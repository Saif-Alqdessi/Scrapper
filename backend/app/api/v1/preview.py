"""
app/api/v1/preview.py
Preview endpoint — Phase 3 implementation.

GET /api/v1/preview/{slug}?lang=en   → Returns the assembled JSON payload
                                        for your Next.js frontend to render.

This is the endpoint your Next.js frontend calls to render a business's
landing page preview. The slug comes from the wa.me link and the dashboard.

URL pattern:
  GET /api/v1/preview/al-noor-clinic-amman        → English payload (default)
  GET /api/v1/preview/al-noor-clinic-amman?lang=ar → Arabic payload (RTL-ready)

Your frontend already handles LTR/RTL — just pass lang="ar" for Arabic.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.page_payload import PagePayload

log = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/{slug}",
    summary="Get the assembled JSON payload for a business preview page",
    response_description="JSON payload exactly matching your Next.js frontend schema",
)
async def get_page_payload(
    slug: str,
    lang: str = Query(default="en", pattern="^(en|ar)$", description="Language: 'en' or 'ar'"),
    db:   AsyncSession = Depends(get_db),
) -> dict:
    """
    Returns the pre-assembled JSON payload that your Next.js frontend
    uses to render a business's landing page preview.

    - **slug**: The URL-safe identifier (e.g. `al-noor-clinic-amman`)
    - **lang**: `en` for English (LTR), `ar` for Arabic (RTL)

    Returns 404 if the AI pipeline hasn't completed yet for this lead.
    """
    result = await db.execute(
        select(PagePayload).where(PagePayload.slug == slug)
    )
    payload = result.scalar_one_or_none()

    if not payload:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No payload found for slug '{slug}'. "
                "The AI pipeline may not have completed yet."
            ),
        )

    # Return the appropriate language payload
    data = payload.payload_ar if lang == "ar" else payload.payload_en

    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"No '{lang}' payload assembled yet for '{slug}'.",
        )

    log.debug("Preview served", extra={"slug": slug, "lang": lang})
    return data
