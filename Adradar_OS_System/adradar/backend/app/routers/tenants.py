import uuid
import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin, get_current_user
from app.models.tenant import Tenant
from app.models.batch import Batch
from app.models.lead import Lead
from app.schemas.tenant import TenantCreate, TenantRead, TenantUpdate, TenantStats

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[TenantStats])
async def list_tenants(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Tenant).order_by(Tenant.created_at.desc()))
    tenants = result.scalars().all()

    stats_list = []
    for t in tenants:
        total_leads = await db.scalar(
            select(func.count(Lead.id)).where(Lead.tenant_id == t.id)
        )
        total_batches = await db.scalar(
            select(func.count(Batch.id)).where(Batch.tenant_id == t.id)
        )
        published_batches = await db.scalar(
            select(func.count(Batch.id)).where(
                and_(Batch.tenant_id == t.id, Batch.status == "published")
            )
        )
        last_batch = await db.scalar(
            select(func.max(Batch.created_at)).where(Batch.tenant_id == t.id)
        )
        stats_list.append(
            TenantStats(
                **TenantRead.model_validate(t).model_dump(),
                total_leads=total_leads or 0,
                total_batches=total_batches or 0,
                published_batches=published_batches or 0,
                last_batch_date=last_batch,
            )
        )
    return stats_list


@router.post("", response_model=TenantRead, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    payload: TenantCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    existing = await db.scalar(select(Tenant).where(Tenant.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=400, detail="Slug already in use")
    tenant = Tenant(**payload.model_dump())
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)
    logger.info("Created tenant %s (slug=%s)", tenant.id, tenant.slug)
    return tenant


@router.get("/{tenant_id}", response_model=TenantStats)
async def get_tenant(
    tenant_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    # Admin or own tenant
    if current_user.role != "admin" and str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(status_code=403, detail="Access denied")

    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    total_leads = await db.scalar(
        select(func.count(Lead.id)).where(Lead.tenant_id == tenant_id)
    )
    total_batches = await db.scalar(
        select(func.count(Batch.id)).where(Batch.tenant_id == tenant_id)
    )
    published_batches = await db.scalar(
        select(func.count(Batch.id)).where(
            and_(Batch.tenant_id == tenant_id, Batch.status == "published")
        )
    )
    last_batch = await db.scalar(
        select(func.max(Batch.created_at)).where(Batch.tenant_id == tenant_id)
    )
    return TenantStats(
        **TenantRead.model_validate(tenant).model_dump(),
        total_leads=total_leads or 0,
        total_batches=total_batches or 0,
        published_batches=published_batches or 0,
        last_batch_date=last_batch,
    )


@router.patch("/{tenant_id}", response_model=TenantRead)
async def update_tenant(
    tenant_id: uuid.UUID,
    payload: TenantUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(tenant, field, value)
    await db.flush()
    await db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.is_active = False
    await db.flush()
