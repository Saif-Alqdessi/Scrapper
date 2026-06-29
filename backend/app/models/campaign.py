"""
app/models/campaign.py
Campaigns are the top-level entity. Each campaign represents one run of the
scraper targeting a specific niche + location combination.

A campaign drives the entire pipeline:
  Campaign → (many) Leads → AIOutput → PagePayload
"""
import enum
import uuid

from sqlalchemy import Column, DateTime, Enum as SAEnum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class CampaignStatus(str, enum.Enum):
    PENDING    = "pending"     # Created, not yet started
    SCRAPING   = "scraping"    # Scraper is running
    AI_RUNNING = "ai_running"  # Leads scraped, AI pipeline running
    DONE       = "done"        # All leads processed
    FAILED     = "failed"      # Fatal error during scraping
    CANCELLED  = "cancelled"   # Manually stopped by user


class Campaign(Base):
    __tablename__ = "campaigns"

    # ── Primary Key ───────────────────────────────────────────
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Scrape Parameters (set by dashboard) ─────────────────
    niche    = Column(String, nullable=False)   # e.g. "dental clinic"
    location = Column(String, nullable=False)   # e.g. "Amman, Jordan"
    language = Column(String(10), default="both")  # "en" | "ar" | "both"

    # ── Pipeline State ────────────────────────────────────────
    apify_run_id = Column(String, nullable=True, index=True)
    status = Column(
        SAEnum(CampaignStatus, name="campaignstatus"),
        default=CampaignStatus.PENDING,
        nullable=False,
    )

    # ── Timestamps ────────────────────────────────────────────
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
    leads = relationship(
        "Lead",
        back_populates="campaign",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Campaign id={self.id} niche={self.niche!r} location={self.location!r} status={self.status}>"
