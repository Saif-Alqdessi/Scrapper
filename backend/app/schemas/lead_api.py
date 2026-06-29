"""
app/schemas/lead_api.py
Pydantic V2 response schemas for the Lead API (Phase 3).

Separated from app/schemas/lead.py (which holds scraper-layer schemas)
to keep concerns clean: scraper schemas ≠ API response schemas.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LeadSummaryResponse(BaseModel):
    """
    Returned by GET /api/v1/leads — the dashboard table view.
    Lightweight: no JSONB blobs, just the fields the table needs.
    """
    id:             uuid.UUID
    business_name:  str
    niche:          Optional[str]
    location:       Optional[str]
    google_rating:  Optional[float]
    review_count:   Optional[int]
    has_website:    bool
    phone:          Optional[str]
    status:         str
    slug:           Optional[str]
    preview_url:    Optional[str]
    wame_link:      Optional[str]
    wame_link_ar:   Optional[str]
    scraped_at:     Optional[datetime]
    ai_processed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class LeadStatusUpdate(BaseModel):
    """PATCH /api/v1/leads/{id}/status — body schema."""
    new_status: str = Field(
        ...,
        description="One of: new | ai_processing | ready | outreach_sent | replied | closed | rejected",
    )
