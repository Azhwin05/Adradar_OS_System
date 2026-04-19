"""
Email generator service.
Calls Claude API (claude-sonnet-4-20250514) once per lead at batch upload time.
Results are stored in the DB — never re-generated on page load.

To swap to Celery: replace asyncio.create_task → celery_task.delay().
"""

import json
import logging
import asyncio
from typing import TYPE_CHECKING

import anthropic

from app.config import get_settings

if TYPE_CHECKING:
    from app.models.lead import Lead
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are an expert cold outreach specialist for a paid media agency.
Write a personalised cold email for the following lead.
Be concise (under 120 words), reference their ad activity, and
lead with a specific pain point. Return JSON only:
{"subject": "...", "body": "..."}"""

BATCH_SIZE = 10  # process N leads at a time


async def generate_email_for_lead(lead: "Lead") -> tuple[str, str]:
    """
    Call Claude API for a single lead.
    Returns (subject, body) or fallback strings on error.
    """
    if not settings.anthropic_api_key:
        logger.warning("ANTHROPIC_API_KEY not set — skipping email generation")
        return _fallback_email(lead)

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    user_content = f"""
Company: {lead.company_name}
Industry: {lead.industry or 'Unknown'}
Niche: {lead.niche or 'Unknown'}
Ad Activity: {lead.ad_spend_signal or 'Unknown'}
Contact: {lead.contact_name or 'Unknown'} ({lead.contact_title or 'Unknown'})
Pain Signals: {json.dumps(lead.pain_signals or [])}
Hiring Triggers: {json.dumps(lead.hiring_triggers or [])}
"""
    try:
        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
        )
        raw = message.content[0].text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return data.get("subject", ""), data.get("body", "")
    except Exception as exc:
        logger.error("Claude API error for lead %s: %s", lead.id, exc)
        return _fallback_email(lead)


async def generate_emails_for_leads(
    db: "AsyncSession",
    batch_id,
    lead_ids: list,
) -> None:
    """
    Background generator — processes leads in BATCH_SIZE chunks.
    Called as asyncio.create_task() from batches router.
    """
    from app.models.lead import Lead
    from sqlalchemy import select

    logger.info("Starting email generation for batch %s (%d leads)", batch_id, len(lead_ids))

    for i in range(0, len(lead_ids), BATCH_SIZE):
        chunk_ids = lead_ids[i : i + BATCH_SIZE]
        result = await db.execute(select(Lead).where(Lead.id.in_(chunk_ids)))
        leads = result.scalars().all()

        tasks = [generate_email_for_lead(lead) for lead in leads]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for lead, result in zip(leads, results):
            if isinstance(result, Exception):
                logger.error("Email gen failed for lead %s: %s", lead.id, result)
                continue
            subject, body = result
            lead.email_subject = subject
            lead.email_body = body

        await db.commit()
        logger.info("Email generation batch %d-%d complete", i, i + len(chunk_ids))


def _fallback_email(lead: "Lead") -> tuple[str, str]:
    subject = f"Quick question about {lead.company_name}'s ad strategy"
    body = (
        f"Hi {lead.contact_name or 'there'},\n\n"
        f"I noticed {lead.company_name} is running paid ads and wanted to reach out. "
        "We help businesses like yours get more from their ad spend without increasing budget. "
        "Would a 15-minute call this week work?\n\nBest,"
    )
    return subject, body
