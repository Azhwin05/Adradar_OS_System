import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator


class LeadBase(BaseModel):
    company_name: str
    website: str | None = None
    industry: str | None = None
    niche: str | None = None
    ad_spend_signal: str | None = None
    contact_name: str | None = None
    contact_title: str | None = None
    contact_email: str | None = None
    contact_linkedin: str | None = None
    contact_phone: str | None = None
    role_bucket: str | None = None
    pain_signals: list = []
    hiring_triggers: list = []
    verified_email: bool = False


class LeadCreate(LeadBase):
    tenant_id: uuid.UUID
    batch_id: uuid.UUID


class LeadUpdate(BaseModel):
    outreach_status: str | None = None
    notes: str | None = None
    verified_email: bool | None = None

    @field_validator("outreach_status")
    @classmethod
    def status_must_be_valid(cls, v: str | None) -> str | None:
        if v is not None and v not in ("ready", "sent", "replied", "archived"):
            raise ValueError("outreach_status must be ready, sent, replied, or archived")
        return v


class LeadRead(LeadBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    batch_id: uuid.UUID
    score: int | None
    score_tier: str | None
    email_subject: str | None
    email_body: str | None
    outreach_status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LeadListItem(BaseModel):
    """Lighter projection for the leads table."""
    id: uuid.UUID
    company_name: str
    contact_name: str | None
    contact_title: str | None
    contact_email: str | None
    niche: str | None
    score: int | None
    score_tier: str | None
    outreach_status: str
    verified_email: bool
    batch_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadPage(BaseModel):
    items: list[LeadListItem]
    total: int
    page: int
    limit: int
    pages: int
