import logging
from app.pipeline.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.pipeline.tasks.notify.send_batch_notification", bind=True)
def send_batch_notification(self, tenant_id: str, batch_id: str):
    """STUB — notify client when a batch is published. Wire real email here."""
    raise NotImplementedError("Automation not yet enabled")
