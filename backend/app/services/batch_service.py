"""
Batch service — business logic for creating and processing batches.
"""
import logging
import uuid
from typing import TYPE_CHECKING

from fastapi import UploadFile
from sqlalchemy import func, and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import Batch
from app.models.lead import Lead
from app.schemas.batch import BatchDetail, BatchRead
from app.utils.csv_parser import parse_csv_bytes
from app.utils.scoring import calculate_score, classify_role_bucket

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


async def process_batch_upload(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    label: str,
    niche: str,
    created_by: uuid.UUID,
    file: UploadFile,
) -> tuple[Batch, list[Lead]]:
    """
    Parse CSV, score leads, insert batch + leads, return (batch, leads).
    Email generation is NOT done here — caller fires asyncio task.
    """
    content = await file.read()
    lead_dicts, parse_errors = parse_csv_bytes(content)

    if not lead_dicts:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=f"No valid rows found in CSV. Errors: {parse_errors[:5]}",
        )

    batch = Batch(
        tenant_id=tenant_id,
        label=label,
        niche=niche,
        lead_count=len(lead_dicts),
        status="draft",
        source="manual",
        created_by=created_by,
    )
    db.add(batch)
    await db.flush()  # get batch.id

    leads = []
    for data in lead_dicts:
        score, tier = calculate_score(data)
        role_bucket = classify_role_bucket(data.get("contact_title"))
        lead = Lead(
            tenant_id=tenant_id,
            batch_id=batch.id,
            score=score,
            score_tier=tier,
            role_bucket=role_bucket or data.get("role_bucket"),
            **{k: v for k, v in data.items() if k not in ("role_bucket",) and hasattr(Lead, k)},
        )
        db.add(lead)
        leads.append(lead)

    batch.lead_count = len(leads)
    await db.flush()
    await db.refresh(batch)

    logger.info(
        "Created batch %s for tenant %s with %d leads",
        batch.id,
        tenant_id,
        len(leads),
    )
    return batch, leads


async def get_batch_detail(db: AsyncSession, batch: Batch) -> BatchDetail:
    hot = await db.scalar(
        select(func.count(Lead.id)).where(
            and_(Lead.batch_id == batch.id, Lead.score_tier == "hot")
        )
    ) or 0
    warm = await db.scalar(
        select(func.count(Lead.id)).where(
            and_(Lead.batch_id == batch.id, Lead.score_tier == "warm")
        )
    ) or 0
    review = await db.scalar(
        select(func.count(Lead.id)).where(
            and_(Lead.batch_id == batch.id, Lead.score_tier == "review")
        )
    ) or 0
    sent = await db.scalar(
        select(func.count(Lead.id)).where(
            and_(Lead.batch_id == batch.id, Lead.outreach_status == "sent")
        )
    ) or 0
    replied = await db.scalar(
        select(func.count(Lead.id)).where(
            and_(Lead.batch_id == batch.id, Lead.outreach_status == "replied")
        )
    ) or 0

    base = BatchRead.model_validate(batch)
    return BatchDetail(
        **base.model_dump(),
        hot_leads=hot,
        warm_leads=warm,
        review_leads=review,
        sent_count=sent,
        replied_count=replied,
    )
