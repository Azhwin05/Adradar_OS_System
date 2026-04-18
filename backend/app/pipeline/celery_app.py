"""
Celery application — real configuration, stub tasks only for now.
When automation is enabled, replace NotImplementedError bodies with real logic.
"""

from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "adradar",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.pipeline.tasks.scrape",
        "app.pipeline.tasks.enrich",
        "app.pipeline.tasks.validate",
        "app.pipeline.tasks.notify",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

# FUTURE: Uncomment to enable per-tenant scheduled runs
# celery_app.conf.beat_schedule = {
#     "run-pipeline-robin": {
#         "task": "app.pipeline.tasks.scrape.run_for_tenant",
#         "schedule": crontab(hour=6, minute=0),
#         "args": ("robin",),
#     },
#     "run-pipeline-muneeb": {
#         "task": "app.pipeline.tasks.scrape.run_for_tenant",
#         "schedule": crontab(hour=6, minute=30),
#         "args": ("muneeb",),
#     },
# }
