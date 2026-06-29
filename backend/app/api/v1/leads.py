"""
app/api/v1/leads.py
Lead endpoints — Phase 3 implementation.

GET    /                      → List leads (filterable by campaign_id, status)
GET    /{id}                  → Lead detail (full data incl. JSONB blobs)
POST   /{id}/trigger-ai       → Manually re-trigger AI pipeline for one lead
PATCH  /{id}/status           → Update lead status (outreach_sent, replied, etc.)
"""
import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.lead import Lead, LeadStatus
from app.schemas.lead_api import LeadSummaryResponse, LeadStatusUpdate

log = logging.getLogger(__name__)

router = APIRouter()


# ── GET / — List leads ────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=list[LeadSummaryResponse],
    summary="List leads, optionally filtered by campaign or status",
)
async def list_leads(
    campaign_id: uuid.UUID | None = None,
    status:      str | None       = None,
    db:          AsyncSession     = Depends(get_db),
) -> list[Lead]:
    """
    Returns lead list for the dashboard table.
    Optionally filter by campaign_id and/or status string.
    Results ordered by most recently scraped first.
    """
    query = select(Lead)
    if campaign_id:
        query = query.where(Lead.campaign_id == campaign_id)
    if status:
        query = query.where(Lead.status == status)
    result = await db.execute(query.order_by(Lead.scraped_at.desc()))
    return result.scalars().all()


# ── GET /{id} — Lead detail ───────────────────────────────────────────────────

@router.get(
    "/{lead_id}",
    response_model=LeadSummaryResponse,
    summary="Get a single lead's full detail",
)
async def get_lead(
    lead_id: uuid.UUID,
    db:      AsyncSession = Depends(get_db),
) -> Lead:
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


# ── POST /{id}/trigger-ai — Re-trigger AI pipeline ───────────────────────────

@router.post(
    "/{lead_id}/trigger-ai",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Manually re-trigger the AI pipeline for a single lead",
)
async def trigger_ai_pipeline(
    lead_id: uuid.UUID,
    db:      AsyncSession = Depends(get_db),
) -> dict:
    """
    Enqueues the AI pipeline Celery task for a specific lead.
    Useful for re-processing a lead after an agent failure.
    """
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    try:
        from app.workers.tasks import run_ai_pipeline
        run_ai_pipeline.apply_async(args=[str(lead_id)])
    except Exception as exc:
        log.warning("Could not enqueue AI task for lead %s: %s", lead_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Task queue unavailable — Celery broker may be down.",
        )

    log.info("AI pipeline re-triggered", extra={"lead_id": str(lead_id)})
    return {"message": "AI pipeline enqueued", "lead_id": str(lead_id)}


# ── PATCH /{id}/status — Update lead status ───────────────────────────────────

@router.patch(
    "/{lead_id}/status",
    response_model=LeadSummaryResponse,
    summary="Update lead lifecycle status",
)
async def update_lead_status(
    lead_id: uuid.UUID,
    body:    LeadStatusUpdate,
    db:      AsyncSession = Depends(get_db),
) -> Lead:
    """
    Called by the dashboard when you manually click the wa.me link or update
    the lead's lifecycle stage (outreach_sent → replied → closed / rejected).
    """
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Validate the incoming status string against the enum
    try:
        new_status = LeadStatus(body.new_status)
    except ValueError:
        valid = [s.value for s in LeadStatus]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{body.new_status}'. Valid values: {valid}",
        )

    lead.status = new_status

    # Stamp the outreach timestamp automatically when status transitions
    if new_status == LeadStatus.OUTREACH_SENT:
        lead.outreach_sent_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(lead)

    log.info(
        "Lead status updated",
        extra={"lead_id": str(lead_id), "new_status": new_status},
    )
    return lead
