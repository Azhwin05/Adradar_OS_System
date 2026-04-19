import uuid
import logging
from typing import Annotated
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.outreach import OutreachLog
from app.models.lead import Lead
from app.schemas.outreach import OutreachLogCreate, OutreachLogRead

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=OutreachLogRead, status_code=status.HTTP_201_CREATED)
async def log_outreach(
    payload: OutreachLogCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
):
    lead = await db.get(Lead, payload.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role != "admin" and str(lead.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(status_code=403, detail="Access denied")

    log = OutreachLog(
        lead_id=payload.lead_id,
        tenant_id=lead.tenant_id,
        status=payload.status,
        notes=payload.notes,
        sent_at=datetime.now(timezone.utc) if payload.status == "sent" else None,
        replied_at=datetime.now(timezone.utc) if payload.status == "replied" else None,
    )
    db.add(log)

    # Mirror status on lead
    lead.outreach_status = payload.status
    await db.flush()
    await db.refresh(log)
    return log


@router.get("", response_model=list[OutreachLogRead])
async def list_outreach_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
    lead_id: uuid.UUID | None = None,
):
    q = select(OutreachLog)
    if current_user.role != "admin":
        q = q.where(OutreachLog.tenant_id == current_user.tenant_id)
    if lead_id:
        q = q.where(OutreachLog.lead_id == lead_id)
    q = q.order_by(OutreachLog.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()
