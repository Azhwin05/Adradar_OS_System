import uuid
import math
import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.lead import Lead
from app.schemas.lead import LeadListItem, LeadPage, LeadRead, LeadUpdate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=LeadPage)
async def list_leads(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
    tenant_id: uuid.UUID | None = None,
    batch_id: uuid.UUID | None = None,
    niche: str | None = None,
    score_tier: str | None = None,
    outreach_status: str | None = None,
    search: str | None = None,
    verified_email: bool | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
):
    # Tenant scoping — clients can only see their own leads
    if current_user.role == "admin":
        effective_tenant_id = tenant_id
    else:
        effective_tenant_id = current_user.tenant_id

    q = select(Lead)
    conditions = []

    if effective_tenant_id:
        conditions.append(Lead.tenant_id == effective_tenant_id)
    if batch_id:
        conditions.append(Lead.batch_id == batch_id)
    if niche:
        conditions.append(Lead.niche == niche)
    if score_tier:
        conditions.append(Lead.score_tier == score_tier)
    if outreach_status:
        conditions.append(Lead.outreach_status == outreach_status)
    if verified_email is not None:
        conditions.append(Lead.verified_email == verified_email)
    if search:
        search_pattern = f"%{search}%"
        conditions.append(
            or_(
                Lead.company_name.ilike(search_pattern),
                Lead.contact_name.ilike(search_pattern),
            )
        )

    if conditions:
        q = q.where(and_(*conditions))

    # Count total
    count_q = select(func.count()).select_from(q.subquery())
    total = await db.scalar(count_q) or 0

    # Paginate
    q = q.order_by(Lead.score.desc().nulls_last(), Lead.created_at.desc())
    q = q.offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    items = result.scalars().all()

    return LeadPage(
        items=[LeadListItem.model_validate(l) for l in items],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


@router.get("/{lead_id}", response_model=LeadRead)
async def get_lead(
    lead_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role != "admin" and str(lead.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=403, detail="Access denied")
    return lead


@router.patch("/{lead_id}", response_model=LeadRead)
async def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role != "admin" and str(lead.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=403, detail="Access denied")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    await db.flush()
    await db.refresh(lead)
    return lead


@router.post("/{lead_id}/regenerate-email", response_model=LeadRead)
async def regenerate_email(
    lead_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    from app.services.email_generator import generate_email_for_lead

    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    subject, body = await generate_email_for_lead(lead)
    lead.email_subject = subject
    lead.email_body = body
    await db.flush()
    await db.refresh(lead)
    return lead
