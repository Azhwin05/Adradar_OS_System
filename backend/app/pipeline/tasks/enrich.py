from app.pipeline.celery_app import celery_app


@celery_app.task(name="app.pipeline.tasks.enrich.enrich_lead", bind=True)
def enrich_lead(self, lead_id: str):
    """STUB — enrich a lead with additional data sources."""
    raise NotImplementedError("Automation not yet enabled")
