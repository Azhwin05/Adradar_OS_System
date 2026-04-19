import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("batches.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Company
    company_name: Mapped[str] = mapped_column(Text, nullable=False)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry: Mapped[str | None] = mapped_column(Text, nullable=True)
    niche: Mapped[str | None] = mapped_column(Text, nullable=True)
    ad_spend_signal: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Contact
    contact_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_email: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_linkedin: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    role_bucket: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Growth | Marketing | Founder

    # Intelligence
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_tier: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # hot | warm | review
    pain_signals: Mapped[list | None] = mapped_column(JSONB, default=list, nullable=True)
    hiring_triggers: Mapped[list | None] = mapped_column(JSONB, default=list, nullable=True)

    # AI-generated outreach
    email_subject: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_body: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status
    outreach_status: Mapped[str] = mapped_column(String(20), default="ready", nullable=False)
    # ready | sent | replied | archived
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_email: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="leads")  # noqa: F821
    batch: Mapped["Batch"] = relationship("Batch", back_populates="leads")  # noqa: F821
    outreach_logs: Mapped[list["OutreachLog"]] = relationship("OutreachLog", back_populates="lead", lazy="select")  # noqa: F821
