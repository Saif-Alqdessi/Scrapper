"""
app/services/pipeline_runner.py
Direct async pipeline — called from webhook handler.
Replaces the Celery run_ai_pipeline task.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.lead import Lead
from app.services.agents.pipeline import run_lead_through_agents

log = logging.getLogger(__name__)


async def process_lead(lead: Lead, db: AsyncSession) -> None:
    """
    Run the full AI pipeline for a single lead.
    Called directly (no Celery) from the webhook handler.
    """
    try:
        await run_lead_through_agents(str(lead.id))
        log.info("AI pipeline complete: lead=%s", lead.id)
    except Exception as exc:
        log.error("AI pipeline failed: lead=%s error=%s", lead.id, exc, exc_info=True)
        raise
