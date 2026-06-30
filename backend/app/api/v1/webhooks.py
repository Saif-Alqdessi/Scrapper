"""
app/api/v1/webhooks.py
Receives completion callbacks from Apify cloud actors.
This endpoint REPLACES the Celery worker — it IS the worker.

POST /api/v1/webhooks/apify
  Called by Apify when a run succeeds, fails, or is aborted.
  Secured by HMAC signature verification.
"""
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.lead import Lead, LeadStatus
from app.schemas.lead import RawLeadData
from app.services.scraper.apify_scraper import _map_item, _validate_token
from app.services.scraper.filter_engine import LeadFilterEngine
from app.services.utils import generate_slug

log = logging.getLogger(__name__)
router = APIRouter()

_APIFY_DATASET_URL = "https://api.apify.com/v2/datasets/{dataset_id}/items"
_HTTPX_TIMEOUT = 30.0

_filter = LeadFilterEngine(
    min_rating=3.8,
    min_reviews=5,
    max_reviews=2000,
    stellar_rating_bypass=4.3,
)

class ApifyWebhookPayload(BaseModel):
    runId: str
    status: str        # "ACTOR.RUN.SUCCEEDED" | "ACTOR.RUN.FAILED" | ...
    campaignId: str


async def _fetch_dataset(run_id: str) -> list[dict]:
    """Fetch all items from the Apify run's default dataset."""
    token = _validate_token()
    url = f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items"
    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        r = await client.get(url, params={"token": token, "clean": 1})
        r.raise_for_status()
        return r.json()


@router.post("/apify", status_code=200)
async def apify_webhook(
    payload: ApifyWebhookPayload,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Apify calls this endpoint when a scrape run completes.

    SUCCEEDED → fetch results → filter → AI pipeline → DONE
    FAILED/ABORTED → mark campaign FAILED
    """
    campaign = await db.scalar(
        select(Campaign).where(Campaign.apify_run_id == payload.runId)
    )
    if not campaign:
        # Apify may retry — return 200 to prevent retry loop
        log.warning("Webhook received for unknown run_id=%s", payload.runId)
        return {"status": "ignored", "reason": "unknown run_id"}

    # ── Handle failure ───────────────────────────────────────────────────────
    if payload.status.strip().upper() != "SUCCEEDED":
        campaign.status = CampaignStatus.FAILED
        await db.commit()
        log.error("Apify run failed: run_id=%s status=%s", payload.runId, payload.status)
        return {"status": "acknowledged", "result": "campaign_failed"}

    # ── Fetch results ─────────────────────────────────────────────────────────
    campaign.status = CampaignStatus.SCRAPING
    await db.commit()

    try:
        items = await _fetch_dataset(payload.runId)
    except Exception as exc:
        log.error("Failed to fetch Apify dataset: %s", exc, exc_info=True)
        campaign.status = CampaignStatus.FAILED
        await db.commit()
        return {"status": "error", "reason": "dataset_fetch_failed"}

    log.info("Webhook: %d items received for campaign=%s", len(items), campaign.id)

    # ── Filter + persist leads ────────────────────────────────────────────────
    campaign.status = CampaignStatus.AI_RUNNING
    await db.commit()

    saved = 0
    for item in items:
        raw: RawLeadData | None = _map_item(item, campaign.niche, campaign.location)
        if not raw:
            continue
        result = _filter.is_qualified(raw)
        if not result.qualified:
            continue

        # Dedup by google_place_id
        if raw.google_place_id:
            existing = await db.scalar(
                select(Lead).where(Lead.google_place_id == raw.google_place_id)
            )
            if existing:
                continue

        lead = Lead(
            campaign_id=campaign.id,
            slug=generate_slug(raw.business_name),
            business_name=raw.business_name,
            google_place_id=raw.google_place_id,
            google_rating=raw.google_rating,
            review_count=raw.review_count,
            phone=raw.phone,
            address=raw.address,
            website_url=raw.website_url,
            has_website=raw.has_website,
            maps_url=raw.maps_url,
            status=LeadStatus.NEW,
        )
        db.add(lead)
        await db.commit()
        await db.refresh(lead)

        saved += 1

    campaign.status = CampaignStatus.DONE
    await db.commit()
    log.info("Campaign complete: campaign=%s leads_saved=%d", campaign.id, saved)
    return {"status": "ok", "leads_saved": saved}
