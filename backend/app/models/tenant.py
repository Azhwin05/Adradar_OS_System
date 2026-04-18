import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    niche: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=True, default=list)
    plan: Mapped[str] = mapped_column(String(50), default="starter", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="tenant", lazy="select")  # noqa: F821
    batches: Mapped[list["Batch"]] = relationship("Batch", back_populates="tenant", lazy="select")  # noqa: F821
    leads: Mapped[list["Lead"]] = relationship("Lead", back_populates="tenant", lazy="select")  # noqa: F821
