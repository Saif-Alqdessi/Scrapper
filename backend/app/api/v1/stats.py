"""
app/api/v1/stats.py
Dashboard KPI endpoint — aggregate counts only.
No AI, no heavy joins.
"""
import logging
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.lead import Lead, LeadStatus

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/summary", summary="Dashboard KPI summary")
async def get_stats_summary(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Returns aggregate counts for the dashboard KPI cards.
    Two GROUP BY queries — single round-trip per call.
    """
    lead_rows = await db.execute(
        select(Lead.status, func.count(Lead.id)).group_by(Lead.status)
    )
    leads_by_status: dict[str, int] = defaultdict(int)
    total_leads = 0
    for row_status, count in lead_rows:
        leads_by_status[row_status.value] = count
        total_leads += count

    camp_rows = await db.execute(
        select(Campaign.status, func.count(Campaign.id)).group_by(Campaign.status)
    )
    active_statuses = {
        CampaignStatus.PENDING,
        CampaignStatus.SCRAPING,
        CampaignStatus.AI_RUNNING,
    }
    active_campaigns, done_campaigns = 0, 0
    for row_status, count in camp_rows:
        if row_status in active_statuses:
            active_campaigns += count
        elif row_status == CampaignStatus.DONE:
            done_campaigns += count

    return {
        "total_leads": total_leads,
        "leads_by_status": dict(leads_by_status),
        "active_campaigns": active_campaigns,
        "done_campaigns": done_campaigns,
    }
