import uuid
import logging
import asyncio
from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.batch import Batch
from app.schemas.batch import BatchCreate, BatchDetail, BatchRead, BatchUpdate
from app.services.batch_service import get_batch_detail

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[BatchRead])
async def list_batches(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
    tenant_id: uuid.UUID | None = None,
    batch_status: str | None = None,
):
    q = select(Batch)
    if current_user.role == "admin":
        if tenant_id:
            q = q.where(Batch.tenant_id == tenant_id)
    else:
        q = q.where(Batch.tenant_id == current_user.tenant_id)

    if batch_status:
        q = q.where(Batch.status == batch_status)

    q = q.order_by(Batch.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=BatchRead, status_code=status.HTTP_201_CREATED)
async def create_batch(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(require_admin),
    tenant_id: uuid.UUID = Form(...),
    label: str = Form(...),
    niche: str = Form(...),
    expected_count: int | None = Form(None),
    file: UploadFile = File(...),
):
    """
    Multipart upload: CSV file + batch metadata.
    Parses CSV, scores leads, stores them, then triggers async email generation.
    """
    from app.services.batch_service import process_batch_upload

    batch, leads = await process_batch_upload(
        db=db,
        tenant_id=tenant_id,
        label=label,
        niche=niche,
        created_by=current_user.id,
        file=file,
    )

    # Fire email generation as background asyncio task (not Celery yet)
    asyncio.create_task(_generate_emails_background(batch.id, [l.id for l in leads]))

    return batch


async def _generate_emails_background(batch_id: uuid.UUID, lead_ids: list[uuid.UUID]):
    """Asyncio background task — swappable to celery_task.delay() in one line."""
    from app.database import AsyncSessionLocal
    from app.services.email_generator import generate_emails_for_leads

    async with AsyncSessionLocal() as db:
        try:
            await generate_emails_for_leads(db, batch_id, lead_ids)
        except Exception as exc:
            logger.error("Email generation failed for batch %s: %s", batch_id, exc)


@router.get("/{batch_id}", response_model=BatchDetail)
async def get_batch(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if current_user.role != "admin" and str(batch.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=403, detail="Access denied")
    return await get_batch_detail(db, batch)


@router.patch("/{batch_id}", response_model=BatchRead)
async def update_batch(
    batch_id: uuid.UUID,
    payload: BatchUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(batch, field, value)
    await db.flush()
    await db.refresh(batch)
    return batch


@router.post("/{batch_id}/publish", response_model=BatchRead)
async def publish_batch(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if batch.status == "published":
        raise HTTPException(status_code=400, detail="Batch already published")
    batch.status = "published"
    batch.published_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(batch)

    # STUB: notification hook
    logger.info(
        "STUB: notification would be sent for tenant %s, batch '%s'",
        batch.tenant_id,
        batch.label,
    )
    return batch


@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_batch(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch.status = "archived"
    await db.flush()
