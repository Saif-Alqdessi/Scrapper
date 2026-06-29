"""
app/models/page_payload.py
The FINAL assembled JSON — exactly what your Next.js frontend consumes.

One row per lead. Contains two complete JSON blobs:
  - payload_en: Full English landing page JSON
  - payload_ar: Full Arabic landing page JSON (RTL-ready)

Your frontend's GET /api/v1/preview/{slug}?lang=en reads this table.
No further processing needed — this is the source of truth for rendering.
"""
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class PagePayload(Base):
    __tablename__ = "page_payloads"

    # ── Primary Key ───────────────────────────────────────────
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Foreign Key (one-to-one with leads) ───────────────────
    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # ── Routing ───────────────────────────────────────────────
    # Denormalized from Lead.slug for direct lookup without JOIN
    slug = Column(String, unique=True, index=True, nullable=False)

    # ── Assembled Payloads (Matches your Next.js JSON schema) ─
    payload_en = Column(JSONB, nullable=True)  # Full EN payload for frontend
    payload_ar = Column(JSONB, nullable=True)  # Full AR payload for frontend

    # ── Versioning (for regeneration without losing history) ──
    version = Column(Integer, default=1, nullable=False)

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

    # ── Relationship ──────────────────────────────────────────
    lead = relationship("Lead", back_populates="page_payload")

    def __repr__(self) -> str:
        return (
            f"<PagePayload id={self.id} slug={self.slug!r} "
            f"version={self.version}>"
        )
