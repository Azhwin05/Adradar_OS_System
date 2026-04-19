import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
import re


class TenantBase(BaseModel):
    name: str
    slug: str
    niche: list[str] = []
    plan: str = "starter"
    is_active: bool = True

    @field_validator("slug")
    @classmethod
    def slug_must_be_valid(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError("slug must be lowercase alphanumeric and hyphens only")
        return v

    @field_validator("plan")
    @classmethod
    def plan_must_be_valid(cls, v: str) -> str:
        if v not in ("starter", "growth", "enterprise"):
            raise ValueError("plan must be starter, growth, or enterprise")
        return v


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: str | None = None
    niche: list[str] | None = None
    plan: str | None = None
    is_active: bool | None = None


class TenantRead(TenantBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class TenantStats(TenantRead):
    total_leads: int = 0
    total_batches: int = 0
    published_batches: int = 0
    leads_this_week: int = 0
    last_batch_date: datetime | None = None
