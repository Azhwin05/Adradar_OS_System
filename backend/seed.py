"""
Seed script — run once after migrations:
    python seed.py
"""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from passlib.context import CryptContext

from app.config import get_settings
from app.models.tenant import Tenant
from app.models.user import User
from app.models.batch import Batch
from app.models.lead import Lead
import app.models  # noqa — register all models

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SAMPLE_LEADS = [
    {
        "company_name": "BloomBox Flowers",
        "website": "https://bloombox.com",
        "industry": "Retail",
        "niche": "paid-media",
        "ad_spend_signal": "Active Meta Ads — $5k+/month estimated",
        "contact_name": "Sarah Chen",
        "contact_title": "CEO & Founder",
        "contact_email": "sarah@bloombox.com",
        "contact_linkedin": "https://linkedin.com/in/sarahchen",
        "contact_phone": "+1-555-0101",
        "role_bucket": "Founder",
        "score": 85,
        "score_tier": "hot",
        "pain_signals": [
            {"signal": "High CPM on Meta — above industry average", "confidence": 0.9},
            {"signal": "No retargeting campaigns detected", "confidence": 0.8},
        ],
        "hiring_triggers": [
            {"role": "Head of Growth", "platform": "LinkedIn"},
        ],
        "email_subject": "BloomBox's Meta Ads — quick win I spotted",
        "email_body": (
            "Hi Sarah,\n\n"
            "Noticed BloomBox is running Meta ads with what looks like an above-average CPM. "
            "We helped 3 similar gifting brands cut CPM by 35% in 6 weeks by fixing "
            "audience overlap. Given you're scaling, the timing seems right.\n\n"
            "Worth a 15-min chat?\n\nBest,\nAshwin"
        ),
        "outreach_status": "ready",
        "verified_email": True,
    },
    {
        "company_name": "PetalPerfect Co.",
        "website": "https://petalperfect.io",
        "industry": "E-commerce",
        "niche": "paid-media",
        "ad_spend_signal": "Active Google Ads + Meta Ads",
        "contact_name": "James Okafor",
        "contact_title": "Head of Marketing",
        "contact_email": "james@petalperfect.io",
        "contact_linkedin": "https://linkedin.com/in/jamesokafor",
        "role_bucket": "Marketing",
        "score": 75,
        "score_tier": "warm",
        "pain_signals": [
            {"signal": "Weak mobile landing page experience", "confidence": 0.85},
        ],
        "hiring_triggers": [],
        "email_subject": "PetalPerfect — your Google Ads quality score is losing you conversions",
        "email_body": (
            "Hi James,\n\n"
            "Ran a quick audit on PetalPerfect's ad setup and your mobile landing pages "
            "are likely costing you 20-30% of conversions. "
            "It's a fixable problem — we've done it for 5 similar brands.\n\n"
            "Happy to show you exactly what to fix?\n\nBest,\nAshwin"
        ),
        "outreach_status": "sent",
        "verified_email": True,
    },
    {
        "company_name": "GiftGuru HQ",
        "website": "https://giftguru.co",
        "industry": "Gifting",
        "niche": "paid-media",
        "ad_spend_signal": "Active Meta Ads",
        "contact_name": "Priya Sharma",
        "contact_title": "Director of Growth",
        "contact_email": "priya@giftguru.co",
        "contact_linkedin": "https://linkedin.com/in/priyasharma",
        "role_bucket": "Growth",
        "score": 80,
        "score_tier": "hot",
        "pain_signals": [
            {"signal": "No lookalike audiences running", "confidence": 0.75},
            {"signal": "Broad targeting on top-of-funnel", "confidence": 0.9},
        ],
        "hiring_triggers": [{"role": "Paid Media Specialist", "platform": "Indeed"}],
        "email_subject": "GiftGuru — your lookalike audience gap",
        "email_body": (
            "Hi Priya,\n\n"
            "Spotted that GiftGuru isn't running any lookalike audiences — "
            "for a gifting brand with your customer base that's leaving serious ROAS on the table. "
            "We set this up for a competitor and saw 2.4x ROAS in 3 weeks.\n\n"
            "Open to a quick call?\n\nAshwin"
        ),
        "outreach_status": "replied",
        "verified_email": True,
    },
    {
        "company_name": "ClickFlow Media",
        "website": "https://clickflow.media",
        "industry": "Agency",
        "niche": "performance",
        "ad_spend_signal": "Active LinkedIn Ads",
        "contact_name": "Marcus Webb",
        "contact_title": "VP of Client Success",
        "contact_email": "marcus@clickflow.media",
        "role_bucket": "Growth",
        "score": 65,
        "score_tier": "warm",
        "pain_signals": [{"signal": "High CPC on LinkedIn above benchmark", "confidence": 0.7}],
        "hiring_triggers": [],
        "email_subject": "ClickFlow — LinkedIn CPC 40% above benchmark",
        "email_body": (
            "Hi Marcus,\n\n"
            "Noticed ClickFlow's LinkedIn CPCs look elevated versus agency benchmarks. "
            "We've helped 4 agencies bring this down without sacrificing lead quality. "
            "Worth comparing notes?\n\nAshwin"
        ),
        "outreach_status": "ready",
        "verified_email": False,
    },
    {
        "company_name": "RoseRoute Logistics",
        "website": "https://roseroute.io",
        "industry": "Logistics",
        "niche": "paid-media",
        "ad_spend_signal": None,
        "contact_name": "Lena Torres",
        "contact_title": "Founder",
        "contact_email": "lena@roseroute.io",
        "role_bucket": "Founder",
        "score": 55,
        "score_tier": "review",
        "pain_signals": [],
        "hiring_triggers": [],
        "email_subject": "RoseRoute — quick question about your growth plans",
        "email_body": (
            "Hi Lena,\n\n"
            "Came across RoseRoute and love what you're building in floristry logistics. "
            "We work with several similar companies on paid acquisition — "
            "curious if you're exploring any paid channels this quarter?\n\nAshwin"
        ),
        "outreach_status": "ready",
        "verified_email": False,
    },
]


async def seed():
    engine = create_async_engine(settings.database_url, echo=False)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # Admin user
        from sqlalchemy import select
        existing_admin = await db.scalar(select(User).where(User.email == "admin@adradar.io"))
        if existing_admin:
            print("Seed data already exists. Skipping.")
            return

        admin = User(
            email="admin@adradar.io",
            hashed_password=pwd_context.hash("Admin@1234"),
            role="admin",
            name="Ashwin (Admin)",
        )
        db.add(admin)
        await db.flush()

        # Tenant: Robin
        robin_tenant = Tenant(
            name="Facestagram Ltd",
            slug="robin",
            niche=["paid-media", "performance"],
            plan="growth",
        )
        db.add(robin_tenant)

        # Tenant: Muneeb
        muneeb_tenant = Tenant(
            name="PPC AdWise LLC",
            slug="muneeb",
            niche=["florist", "gifting"],
            plan="starter",
        )
        db.add(muneeb_tenant)
        await db.flush()

        # Client user for Robin
        robin_user = User(
            email="robin@facestagram.io",
            hashed_password=pwd_context.hash("Client@1234"),
            role="client",
            name="Robin",
            tenant_id=robin_tenant.id,
        )
        db.add(robin_user)
        await db.flush()

        # Published batch for Robin
        batch = Batch(
            tenant_id=robin_tenant.id,
            label="Batch 1 · Seed Data",
            niche="paid-media",
            lead_count=len(SAMPLE_LEADS),
            status="published",
            source="manual",
            created_by=admin.id,
            published_at=datetime.now(timezone.utc),
        )
        db.add(batch)
        await db.flush()

        for lead_data in SAMPLE_LEADS:
            lead = Lead(
                tenant_id=robin_tenant.id,
                batch_id=batch.id,
                **lead_data,
            )
            db.add(lead)

        await db.commit()
        print("Seed data created:")
        print("  Admin:  admin@adradar.io  / Admin@1234")
        print("  Client: robin@facestagram.io / Client@1234")
        print(f"  Tenant Robin: {robin_tenant.id}")
        print(f"  Tenant Muneeb: {muneeb_tenant.id}")
        print(f"  Batch: {batch.id} (5 leads, published)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
