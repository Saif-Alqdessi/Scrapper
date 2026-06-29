"""
app/schemas/lead.py
Pydantic V2 schemas for lead data flowing through the scraper pipeline.

Schema hierarchy:
  RawReview      — one customer review extracted from Google Places
  RawLeadData    — full raw scrape result from Layer 1 (Google) or Layer 2 (Playwright)
  FilterResult   — output of LeadFilterEngine.is_qualified(), carries the rejection reason
"""
import logging
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

log = logging.getLogger(__name__)


# ── Sub-schema: Individual Review ─────────────────────────────────────────────

class RawReview(BaseModel):
    """
    A single customer review extracted from Google Places API.
    Top 3 reviews are stored on the lead and forwarded to the Analyst Agent
    as copywriting signal (review themes, tone, social proof).
    """
    author: str | None = Field(default=None, description="Reviewer's display name")
    text: str | None = Field(
        default=None,
        max_length=300,
        description="Review text, truncated to 300 chars for token efficiency",
    )
    rating: float | None = Field(
        default=None,
        ge=1.0,
        le=5.0,
        description="Star rating given by this reviewer (1–5)",
    )

    @field_validator("text", mode="before")
    @classmethod
    def truncate_text(cls, v: Any) -> str | None:
        """Ensure text never exceeds 300 chars regardless of source."""
        if v is None:
            return None
        return str(v)[:300]


# ── Primary Schema: Raw Lead Data ─────────────────────────────────────────────

class RawLeadData(BaseModel):
    """
    Standardized container for a single business scraped from any source layer.

    Populated by:
      - PlaywrightMapsScraper (Layer 1) — primary, zero cost
      - YelpScraper           (Layer 2) — fallback, 500 req/day free
      - OverpassScraper       (Layer 3) — backup, fully free, no key

    This schema is the contract between the scraper and:
      1. LeadFilterEngine  — decides qualified/rejected
      2. Celery task       — persists to the Lead ORM model
      3. AI agent pipeline — feeds business context to the Analyst Agent
    """

    # ── Core Identity ──────────────────────────────────────────────────────
    business_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Business display name from Google Places",
    )
    google_place_id: str | None = Field(
        default=None,
        description="Unique Google Place ID — primary deduplication key",
    )

    # ── Location & Contact ─────────────────────────────────────────────────
    niche: str | None = Field(
        default=None,
        description="Business niche/category used in the scrape query (e.g. 'dental clinic')",
    )
    location: str | None = Field(
        default=None,
        description="Location string used in the scrape query (e.g. 'Amman, Jordan')",
    )
    address: str | None = Field(
        default=None,
        description="Full formatted address returned by Google Places",
    )
    phone: str | None = Field(
        default=None,
        description="Formatted phone number (e.g. '+962 6 123 4567')",
    )

    # ── Quality Signals (used by LeadFilterEngine) ─────────────────────────
    google_rating: float | None = Field(
        default=None,
        ge=0.0,
        le=5.0,
        description="Google star rating (0.0–5.0). Must be >= 4.0 to qualify.",
    )
    review_count: int | None = Field(
        default=None,
        ge=0,
        description="Total number of Google reviews. Must be >= 15 and <= 500 to qualify.",
    )

    # ── Website Presence (the critical filter field) ───────────────────────
    has_website: bool = Field(
        default=False,
        description=(
            "True if the business has an existing website. "
            "ONLY leads with has_website=False are qualified — "
            "these are the businesses we can sell a website to."
        ),
    )
    website_url: str | None = Field(
        default=None,
        description="Website URL if present. If None, has_website must be False.",
    )

    # ── Maps & Media ───────────────────────────────────────────────────────
    maps_url: str | None = Field(
        default=None,
        description="Direct Google Maps URL for this business listing",
    )
    photo_reference: str | None = Field(
        default=None,
        description=(
            "Google Places photo reference string. "
            "Use with /maps/api/place/photo to fetch the actual image."
        ),
    )

    # ── AI Context ─────────────────────────────────────────────────────────
    top_reviews: list[RawReview] = Field(
        default_factory=list,
        max_length=3,
        description="Up to 3 customer reviews forwarded to the Analyst Agent as context",
    )

    # ── Source Tracking ────────────────────────────────────────────────────
    scraped_from: str = Field(
        default="google_places",
        description="Identifies which scraper layer produced this record: 'google_places' | 'playwright'",
    )

    # ── Pydantic V2 Config ─────────────────────────────────────────────────
    model_config = {
        "str_strip_whitespace": True,
        "populate_by_name": True,
    }

    # ── Cross-field Validators ─────────────────────────────────────────────

    @model_validator(mode="after")
    def enforce_website_consistency(self) -> "RawLeadData":
        """
        Ensure has_website and website_url are always consistent.
        If website_url is present, has_website must be True and vice versa.
        This prevents filter bypass due to inconsistent API responses.
        """
        if self.website_url and not self.has_website:
            log.debug(
                "Auto-correcting has_website: website_url present but has_website=False",
                extra={"business": self.business_name, "url": self.website_url},
            )
            self.has_website = True
        if not self.website_url and self.has_website:
            # Treat as ambiguous — stay conservative, assume no website
            log.debug(
                "has_website=True but no website_url found — treating as no website",
                extra={"business": self.business_name},
            )
            self.has_website = False
        return self

    @field_validator("top_reviews", mode="before")
    @classmethod
    def cap_reviews(cls, v: Any) -> list[Any]:
        """Never store more than 3 reviews regardless of source."""
        if isinstance(v, list):
            return v[:3]
        return []

    def is_minimally_viable(self) -> bool:
        """
        Quick sanity check: does this lead have the bare minimum fields
        for the filter engine to make a decision?
        Missing name or place_id → reject immediately without filter logic.
        """
        return bool(self.business_name and self.google_place_id)

    def __repr__(self) -> str:
        return (
            f"<RawLeadData name={self.business_name!r} "
            f"rating={self.google_rating} reviews={self.review_count} "
            f"has_website={self.has_website}>"
        )


# ── Filter Result ──────────────────────────────────────────────────────────────

class FilterResult(BaseModel):
    """
    Output of LeadFilterEngine.is_qualified().
    Carries both the decision and the human-readable reason for observability.
    Used in Celery task logs and future analytics dashboards.
    """
    qualified: bool = Field(description="True if the lead passed all filter criteria")
    reason: str = Field(description="Human-readable explanation of the decision")
    lead_name: str | None = Field(default=None, description="Business name for log context")

    def __bool__(self) -> bool:
        return self.qualified

    def __repr__(self) -> str:
        status = "✅ QUALIFIED" if self.qualified else "❌ REJECTED"
        return f"<FilterResult {status} — {self.reason}>"
