import uuid
from datetime import datetime
from pydantic import BaseModel


class OutreachLogCreate(BaseModel):
    lead_id: uuid.UUID
    tenant_id: uuid.UUID
    status: str
    notes: str | None = None


class OutreachLogRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    lead_id: uuid.UUID
    status: str
    sent_at: datetime | None
    replied_at: datetime | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
