import logging
import asyncio
import httpx
from sqlalchemy import select

from app.database import get_async_session
from app.models.campaign import Campaign, CampaignStatus
from app.models.lead import Lead
from app.services.agents.pipeline import run_lead_through_agents
from app.services.scraper.apify_scraper import _map_item

logger = logging.getLogger(__name__)

async def process_apify_dataset(dataset_id: str, campaign_id: str) -> None:
    async with get_async_session() as db:
        try:
            result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
            campaign = result.scalars().first()
            
            if not campaign or campaign.status == CampaignStatus.CANCELLED:
                return
            
            campaign.status = CampaignStatus.AI_RUNNING
            await db.commit()
            
            url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?clean=1"
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
                items = response.json()
            
            for item in items:
                raw_lead = _map_item(item, campaign.niche, campaign.location)
                if raw_lead:
                    lead = Lead(campaign_id=campaign.id, **raw_lead.model_dump())
                    db.add(lead)
            
            await db.commit()
            
            result = await db.execute(select(Lead).where(Lead.campaign_id == campaign.id))
            leads = result.scalars().all()
            
            for lead in leads:
                await run_lead_through_agents(str(lead.id))
                
            campaign.status = CampaignStatus.DONE
            await db.commit()
            
        except Exception as e:
            logger.error(f"Exception in process_apify_dataset: {e}")
            result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
            campaign = result.scalars().first()
            if campaign:
                campaign.status = CampaignStatus.FAILED
                await db.commit()
            raise
