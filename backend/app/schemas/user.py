import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class UserBase(BaseModel):
    email: EmailStr
    name: str | None = None
    role: str
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None
    role: str = "client"
    tenant_id: uuid.UUID | None = None

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        if v not in ("admin", "client"):
            raise ValueError("role must be 'admin' or 'client'")
        return v


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = None
    is_active: bool | None = None
    password: str | None = None


class UserRead(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    role: str
    tenant_id: uuid.UUID | None
    is_active: bool

    model_config = {"from_attributes": True}
