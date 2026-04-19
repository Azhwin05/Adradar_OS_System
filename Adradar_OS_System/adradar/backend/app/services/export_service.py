"""
Export service — generates streaming CSV and email text exports.
"""

import csv
import io
import json
import logging
from datetime import date
from typing import AsyncGenerator, TYPE_CHECKING

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.models.batch import Batch
from app.models.tenant import Tenant

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

CSV_COLUMNS = [
    "company_name",
    "website",
    "contact_name",
    "contact_title",
    "contact_email",
    "contact_phone",
    "contact_linkedin",
    "score",
    "niche",
    "pain_signals",
    "hiring_triggers",
    "outreach_status",
    "batch_label",
]


async def stream_csv(
    db: AsyncSession,
    tenant_id,
    batch_id=None,
) -> tuple[AsyncGenerator[bytes, None], str]:
    """Returns (async_generator, filename)."""

    tenant = await db.get(Tenant, tenant_id)
    tenant_slug = tenant.slug if tenant else str(tenant_id)

    # Resolve batch label for filename
    if batch_id:
        batch = await db.get(Batch, batch_id)
        batch_label_safe = (batch.label.replace(" ", "_").replace("·", "") if batch else str(batch_id))
    else:
        batch_label_safe = "all"

    filename = f"adradar_{tenant_slug}_{batch_label_safe}_{date.today()}.csv"

    async def _generate():
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        yield buf.getvalue().encode()
        buf.truncate(0)
        buf.seek(0)

        q = select(Lead, Batch.label.label("batch_label")).join(
            Batch, Lead.batch_id == Batch.id
        ).where(Lead.tenant_id == tenant_id)
        if batch_id:
            q = q.where(Lead.batch_id == batch_id)
        q = q.order_by(Lead.score.desc().nulls_last())

        result = await db.execute(q)
        for lead, batch_lbl in result:
            row = {
                "company_name": lead.company_name,
                "website": lead.website,
                "contact_name": lead.contact_name,
                "contact_title": lead.contact_title,
                "contact_email": lead.contact_email,
                "contact_phone": lead.contact_phone,
                "contact_linkedin": lead.contact_linkedin,
                "score": lead.score,
                "niche": lead.niche,
                "pain_signals": "; ".join(
                    s.get("signal", "") for s in (lead.pain_signals or []) if isinstance(s, dict)
                ),
                "hiring_triggers": "; ".join(
                    t.get("role", "") for t in (lead.hiring_triggers or []) if isinstance(t, dict)
                ),
                "outreach_status": lead.outreach_status,
                "batch_label": batch_lbl,
            }
            writer.writerow(row)
            yield buf.getvalue().encode()
            buf.truncate(0)
            buf.seek(0)

    return _generate(), filename


async def stream_emails(
    db: AsyncSession,
    tenant_id,
    batch_id=None,
) -> tuple[AsyncGenerator[bytes, None], str]:
    """Returns (async_generator, filename)."""

    tenant = await db.get(Tenant, tenant_id)
    tenant_slug = tenant.slug if tenant else str(tenant_id)
    filename = f"adradar_emails_{tenant_slug}_{date.today()}.txt"

    async def _generate():
        q = select(Lead).where(Lead.tenant_id == tenant_id)
        if batch_id:
            q = q.where(Lead.batch_id == batch_id)
        q = q.order_by(Lead.score.desc().nulls_last())

        result = await db.execute(q)
        for lead in result.scalars():
            block = (
                f"Company: {lead.company_name}\n"
                f"Contact: {lead.contact_name or ''} ({lead.contact_title or ''})\n"
                f"Email: {lead.contact_email or ''}\n"
                f"SUBJECT: {lead.email_subject or ''}\n"
                f"{lead.email_body or ''}\n"
                f"{'─' * 60}\n\n"
            )
            yield block.encode()

    return _generate(), filename
