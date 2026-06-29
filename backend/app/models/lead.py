"""
app/models/lead.py
A Lead represents one qualified business scraped from Google Places.
It tracks the full lifecycle from raw scrape → AI processed → outreach sent.

Key deduplication field: google_place_id (unique across all leads).
Key routing field:        slug          (used in preview URLs and wa.me links).
"""
import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class LeadStatus(str, enum.Enum):
    NEW            = "new"            # Just scraped, awaiting AI
    AI_PROCESSING  = "ai_processing"  # LangGraph agents running
    READY          = "ready"          # JSON payload assembled, wa.me link ready
    OUTREACH_SENT  = "outreach_sent"  # You manually clicked the wa.me link
    REPLIED        = "replied"        # Business owner responded
    CLOSED         = "closed"         # Deal signed ✅
    REJECTED       = "rejected"       # Not interested


class Lead(Base):
    __tablename__ = "leads"

    # ── Primary Key ───────────────────────────────────────────
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Foreign Keys ──────────────────────────────────────────
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Raw Scraped Data (from Google Places API) ─────────────
    business_name   = Column(String, nullable=False)
    google_place_id = Column(String, unique=True, index=True)  # Primary dedup key
    niche           = Column(String)
    location        = Column(String)
    address         = Column(String)
    phone           = Column(String)
    google_rating   = Column(Float)
    review_count    = Column(Integer)
    has_website     = Column(Boolean, default=False)
    website_url     = Column(String, nullable=True)   # NULL = no website (qualified!)
    maps_url        = Column(String)                  # Direct Google Maps link
    top_reviews     = Column(JSONB, nullable=True)    # [{author, text, rating}, ...]
    photo_reference = Column(String, nullable=True)   # Google Places photo reference

    # ── Pipeline State ────────────────────────────────────────
    status = Column(
        SAEnum(LeadStatus, name="leadstatus"),
        default=LeadStatus.NEW,
        nullable=False,
        index=True,
    )

    # ── URL Identifiers ───────────────────────────────────────
    slug        = Column(String, unique=True, index=True)  # "al-noor-clinic-amman"
    preview_url = Column(String, nullable=True)            # Full preview URL
    wame_link   = Column(String, nullable=True)            # wa.me/... EN outreach link
    wame_link_ar = Column(String, nullable=True)           # wa.me/... AR outreach link

    # ── Timestamps ────────────────────────────────────────────
    scraped_at       = Column(DateTime(timezone=True), nullable=True)
    ai_processed_at  = Column(DateTime(timezone=True), nullable=True)
    outreach_sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────
    campaign = relationship("Campaign", back_populates="leads")
    ai_output = relationship(
        "AIOutput",
        back_populates="lead",
        uselist=False,          # One-to-one
        cascade="all, delete-orphan",
    )
    page_payload = relationship(
        "PagePayload",
        back_populates="lead",
        uselist=False,          # One-to-one
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<Lead id={self.id} name={self.business_name!r} "
            f"status={self.status} slug={self.slug!r}>"
        )
