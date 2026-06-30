"""
app/schemas/campaign.py
Pydantic V2 request/response schemas for Campaign endpoints (Phase 3).
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    """POST /api/v1/campaigns — body schema."""
    niche:    str = Field(..., min_length=1, max_length=100, examples=["dental clinic"])
    location: str = Field(..., min_length=1, max_length=100, examples=["Amman, Jordan"])
    language: str = Field(default="both", pattern="^(en|ar|both)$", examples=["both"])


class CampaignResponse(BaseModel):
    """Returned after creating or fetching a campaign."""
    id:            uuid.UUID
    niche:         str
    location:      str
    language:      str
    status:        str
    apify_run_id:  Optional[str] = None
    created_at:    datetime

    model_config = {"from_attributes": True}


class CampaignStatusResponse(BaseModel):
    """GET /api/v1/campaigns/{id}/status — polling response."""
    campaign_id:  str
    status:       str
    total_leads:  int
    ready_leads:  int
    processing:   int
