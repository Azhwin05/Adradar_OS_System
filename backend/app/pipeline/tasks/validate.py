from app.pipeline.celery_app import celery_app


@celery_app.task(name="app.pipeline.tasks.validate.validate_emails", bind=True)
def validate_emails(self, batch_id: str):
    """STUB — validate emails in a batch via external service."""
    raise NotImplementedError("Automation not yet enabled")
