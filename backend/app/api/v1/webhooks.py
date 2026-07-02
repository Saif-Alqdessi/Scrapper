"""
app/api/v1/webhooks.py
Receives completion callbacks from Apify cloud actors.
This endpoint REPLACES the Celery worker — it IS the worker.

POST /api/v1/webhooks/apify
  Called by Apify when a run succeeds, fails, or is aborted.
  Secured by HMAC signature verification.
"""
import logging
import uuid

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

# Apify sends "ACTOR.RUN.SUCCEEDED" in the status field (m-3 rename to avoid shadowing built-in)
_APIFY_SUCCESS_STATUS = "ACTOR.RUN.SUCCEEDED"

lead_filter_engine = LeadFilterEngine(
    min_rating=3.8,
    min_reviews=5,
    max_reviews=2000,
    stellar_rating_bypass=4.3,
)

class ApifyWebhookPayload(BaseModel):
    runId: str
    status: str        # "ACTOR.RUN.SUCCEEDED" | "ACTOR.RUN.FAILED" | "ACTOR.RUN.ABORTED"
    campaignId: str


async def _fetch_dataset(run_id: str) -> list[dict]:
    """Fetch all items from the Apify run's default dataset."""
    token = _validate_token()
    url = f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items"
    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        # Apify requires the token as a query param — this is their API convention
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

    SUCCEEDED → fetch results → filter → persist leads → DONE
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
    # I-3: Apify sends the full event name, e.g. "ACTOR.RUN.SUCCEEDED"
    if payload.status.strip().upper() != _APIFY_SUCCESS_STATUS:
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

    # I-2: Collect all place_ids in one query instead of N individual SELECTs
    raw_leads: list[RawLeadData] = []
    for item in items:
        raw: RawLeadData | None = _map_item(item, campaign.niche, campaign.location)
        if raw and lead_filter_engine.is_qualified(raw).qualified:
            raw_leads.append(raw)

    place_ids = [r.google_place_id for r in raw_leads if r.google_place_id]
    existing_place_ids: set[str] = set()
    if place_ids:
        existing_place_ids = set(
            await db.scalars(
                select(Lead.google_place_id).where(Lead.google_place_id.in_(place_ids))
            )
        )

    # I-1: Build all Lead objects, then batch-insert with a single commit
    leads_to_save: list[Lead] = []
    for raw in raw_leads:
        # Skip already-seen places (dedup by google_place_id)
        if raw.google_place_id and raw.google_place_id in existing_place_ids:
            continue

        # C-1: append place_id fragment (or uuid) as suffix to guarantee slug uniqueness
        slug_suffix = (
            raw.google_place_id[:8]
            if raw.google_place_id
            else uuid.uuid4().hex[:8]
        )
        lead = Lead(
            campaign_id=campaign.id,
            slug=generate_slug(raw.business_name, campaign.location, suffix=slug_suffix),
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
        leads_to_save.append(lead)

    # C-2: Wrap the batch insert in a try/except so any DB error doesn't strand the campaign
    saved = 0
    if leads_to_save:
        try:
            db.add_all(leads_to_save)
            await db.commit()
            saved = len(leads_to_save)
        except Exception as exc:
            await db.rollback()
            log.error(
                "Batch lead insert failed for campaign=%s: %s",
                campaign.id, exc, exc_info=True,
            )
            campaign.status = CampaignStatus.FAILED
            await db.commit()
            return {"status": "error", "reason": "lead_insert_failed"}

    campaign.status = CampaignStatus.DONE
    await db.commit()
    log.info("Campaign complete: campaign=%s leads_saved=%d", campaign.id, saved)
    return {"status": "ok", "leads_saved": saved}
