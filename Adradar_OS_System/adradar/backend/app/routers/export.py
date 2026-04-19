import uuid
import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.services.export_service import stream_csv, stream_emails

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/csv")
async def export_csv(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
    tenant_id: uuid.UUID | None = None,
    batch_id: uuid.UUID | None = None,
):
    effective_tenant_id = _resolve_tenant(current_user, tenant_id)
    generator, filename = await stream_csv(db, effective_tenant_id, batch_id)
    return StreamingResponse(
        generator,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/emails")
async def export_emails(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user),
    tenant_id: uuid.UUID | None = None,
    batch_id: uuid.UUID | None = None,
):
    effective_tenant_id = _resolve_tenant(current_user, tenant_id)
    generator, filename = await stream_emails(db, effective_tenant_id, batch_id)
    return StreamingResponse(
        generator,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _resolve_tenant(current_user, tenant_id):
    if current_user.role == "admin":
        if tenant_id is None:
            raise HTTPException(status_code=400, detail="tenant_id is required for admin exports")
        return tenant_id
    return current_user.tenant_id
