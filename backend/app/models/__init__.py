# Import all models so Alembic autogenerate picks them up
from app.models.tenant import Tenant
from app.models.user import User
from app.models.batch import Batch
from app.models.lead import Lead
from app.models.outreach import OutreachLog

__all__ = ["Tenant", "User", "Batch", "Lead", "OutreachLog"]
