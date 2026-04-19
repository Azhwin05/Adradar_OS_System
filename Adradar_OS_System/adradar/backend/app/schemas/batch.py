import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator


class BatchBase(BaseModel):
    label: str
    niche: str
    status: str = "draft"
    source: str = "manual"

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: str) -> str:
        if v not in ("draft", "published", "archived"):
            raise ValueError("status must be draft, published, or archived")
        return v


class BatchCreate(BaseModel):
    tenant_id: uuid.UUID
    label: str
    niche: str
    expected_count: int | None = None


class BatchUpdate(BaseModel):
    label: str | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: str | None) -> str | None:
        if v is not None and v not in ("draft", "published", "archived"):
            raise ValueError("status must be draft, published, or archived")
        return v


class BatchRead(BatchBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    lead_count: int
    published_at: datetime | None
    created_at: datetime
    created_by: uuid.UUID | None

    model_config = {"from_attributes": True}


class BatchDetail(BatchRead):
    hot_leads: int = 0
    warm_leads: int = 0
    review_leads: int = 0
    sent_count: int = 0
    replied_count: int = 0
