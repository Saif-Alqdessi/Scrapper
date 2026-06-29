"""
app/api/v1/campaigns.py
Campaign endpoints — Phase 3 implementation.

POST /                   → Create campaign, enqueue scrape job → 202
GET  /{id}/status        → Poll campaign progress (dashboard polling every 3s)
GET  /                   → List all campaigns (dashboard overview)
GET  /{id}               → Campaign detail
DELETE /{id}             → Cancel / delete campaign
"""
import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.lead import Lead, LeadStatus
from app.config import settings
from app.schemas.campaign import CampaignCreate, CampaignResponse, CampaignStatusResponse
from app.services.scraper.apify_async import start_apify_run, abort_apify_run

log = logging.getLogger(__name__)

router = APIRouter()


# ── POST / — Create campaign & enqueue scrape job ─────────────────────────────

@router.post(
    "/",
    response_model=CampaignResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create a campaign and start scraping",
)
async def create_campaign(
    payload: CampaignCreate,
    db: AsyncSession = Depends(get_db),
) -> Campaign:
    """
    Creates a campaign record and immediately enqueues the Celery scrape task.
    Returns the campaign with status=PENDING; the frontend polls /status.

    The Celery task transitions the status through:
      PENDING → SCRAPING → AI_RUNNING → DONE (or FAILED)
    """
    campaign = Campaign(
        niche    = payload.niche,
        location = payload.location,
        language = payload.language,
        status   = CampaignStatus.PENDING,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    log.info(
        "Campaign created — enqueueing scrape task",
        extra={"campaign_id": str(campaign.id), "niche": campaign.niche},
    )

    # Start Apify run asynchronously
    try:
        webhook_url = f"{settings.CLOUD_RUN_URL}/api/v1/webhooks/apify"
        run_id = await start_apify_run(
            niche=campaign.niche,
            location=campaign.location,
            campaign_id=str(campaign.id),
            webhook_url=webhook_url,
        )
        campaign.apify_run_id = run_id
        await db.commit()
    except Exception as exc:
        log.error("Could not start Apify run: %s", exc)

    return campaign


# ── GET /{id}/status — Dashboard polling endpoint ─────────────────────────────

@router.get(
    "/{campaign_id}/status",
    response_model=CampaignStatusResponse,
    summary="Poll campaign progress",
)
async def get_campaign_status(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Polled by the dashboard every 3 seconds to show live progress.
    Returns a lightweight summary — no lead data, just counts.
    """
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    result = await db.execute(
        select(Lead).where(Lead.campaign_id == campaign_id)
    )
    lead_list = result.scalars().all()

    return {
        "campaign_id": str(campaign_id),
        "status":      campaign.status,
        "total_leads": len(lead_list),
        "ready_leads": sum(1 for l in lead_list if l.status == LeadStatus.READY),
        "processing":  sum(1 for l in lead_list if l.status == LeadStatus.AI_PROCESSING),
    }


# ── GET / — List all campaigns ────────────────────────────────────────────────

@router.get(
    "/",
    response_model=list[CampaignResponse],
    summary="List all campaigns",
)
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
) -> list[Campaign]:
    """Returns all campaigns ordered by most recent first."""
    result = await db.execute(
        select(Campaign).order_by(Campaign.created_at.desc())
    )
    return result.scalars().all()


# ── GET /{id} — Campaign detail ───────────────────────────────────────────────

@router.get(
    "/{campaign_id}",
    response_model=CampaignResponse,
    summary="Get campaign detail",
)
async def get_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Campaign:
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


# ── POST /{id}/cancel — Stop a running campaign ───────────────────────────────

@router.post(
    "/{campaign_id}/cancel",
    response_model=CampaignResponse,
    summary="Cancel a running campaign",
)
async def cancel_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Campaign:
    """
    Terminates the Celery task for a running campaign and marks it CANCELLED.
    Only valid when campaign is PENDING, SCRAPING, or AI_RUNNING.
    """
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    cancellable = {CampaignStatus.PENDING, CampaignStatus.SCRAPING, CampaignStatus.AI_RUNNING}
    if campaign.status not in cancellable:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot cancel a campaign with status '{campaign.status}'. "
                   "Only pending/scraping/ai_running campaigns can be cancelled.",
        )

    # Abort the Apify run if it exists
    if campaign.apify_run_id:
        try:
            await abort_apify_run(campaign.apify_run_id)
            log.info("Apify run aborted", extra={"apify_run_id": campaign.apify_run_id})
        except Exception as exc:
            log.warning("Could not abort Apify run: %s", exc)

    campaign.status = CampaignStatus.CANCELLED
    await db.commit()
    await db.refresh(campaign)
    log.info("Campaign cancelled", extra={"campaign_id": str(campaign_id)})
    return campaign


# ── POST /{id}/retry — Re-run a failed or cancelled campaign ──────────────────

@router.post(
    "/{campaign_id}/retry",
    response_model=CampaignResponse,
    summary="Retry a failed or cancelled campaign",
)
async def retry_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Campaign:
    """
    Re-enqueues the scrape pipeline for a FAILED or CANCELLED campaign.
    Resets status to PENDING and fires a new Celery task.
    """
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    retryable = {CampaignStatus.FAILED, CampaignStatus.CANCELLED}
    if campaign.status not in retryable:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot retry a campaign with status '{campaign.status}'. "
                   "Only failed/cancelled campaigns can be retried.",
        )

    campaign.status = CampaignStatus.PENDING
    await db.commit()
    await db.refresh(campaign)

    # Start a fresh Apify run
    try:
        webhook_url = f"{settings.CLOUD_RUN_URL}/api/v1/webhooks/apify"
        run_id = await start_apify_run(
            niche=campaign.niche,
            location=campaign.location,
            campaign_id=str(campaign.id),
            webhook_url=webhook_url,
        )
        campaign.apify_run_id = run_id
        await db.commit()
        log.info("Campaign retry started via Apify", extra={"campaign_id": str(campaign_id), "apify_run_id": run_id})
    except Exception as exc:
        log.error("Could not start Apify run on retry: %s", exc)

    return campaign


# ── DELETE /{id} — Delete campaign ───────────────────────────────────────────

@router.delete(
    "/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a campaign and all its leads",
)
async def delete_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await db.delete(campaign)
    await db.commit()
