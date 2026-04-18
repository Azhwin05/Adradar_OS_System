"""
Celery Beat schedule configuration.
All schedules are commented out until automation pipeline is enabled.
"""
# from celery.schedules import crontab
# from app.pipeline.celery_app import celery_app
#
# celery_app.conf.beat_schedule = {
#     "run-pipeline-robin": {
#         "task": "app.pipeline.tasks.scrape.run_for_tenant",
#         "schedule": crontab(hour=6, minute=0),
#         "args": ("robin",),
#     },
# }
