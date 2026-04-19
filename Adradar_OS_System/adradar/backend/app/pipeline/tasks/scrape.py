from app.pipeline.celery_app import celery_app


@celery_app.task(name="app.pipeline.tasks.scrape.run_for_tenant", bind=True)
def run_for_tenant(self, tenant_slug: str, dry_run: bool = False):
    """STUB — scrape leads for a given tenant niche."""
    raise NotImplementedError("Automation not yet enabled")
