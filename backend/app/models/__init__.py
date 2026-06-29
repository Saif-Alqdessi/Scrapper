"""
app/models/__init__.py
Imports all ORM models so that Base.metadata has them registered
when create_tables() or Alembic env.py imports this package.
"""
from app.models.campaign import Campaign, CampaignStatus  # noqa: F401
from app.models.lead import Lead, LeadStatus              # noqa: F401
from app.models.ai_output import AIOutput                 # noqa: F401
from app.models.page_payload import PagePayload           # noqa: F401
