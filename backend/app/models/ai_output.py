"""
app/models/ai_output.py
Stores the raw outputs from all LangGraph agents for a given lead.

Separated from PagePayload intentionally:
  - AIOutput = intermediate agent results (debug, audit, retry)
  - PagePayload = final assembled JSON consumed by the frontend

This separation allows re-running the assembler without re-running LLMs,
and gives full observability into what each agent returned.

Model allocation (Google unified stack):
  - analyst_json   → gemini-1.5-flash   (Analyst Agent)
  - copy_en_json   → gemini-1.5-pro     (Copywriter EN Agent)
  - copy_ar_json   → gemini-1.5-pro     (Copywriter AR Agent)
  - (validator)    → gemini-1.5-flash   (Validator Agent — stored in validation_result)
"""
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AIOutput(Base):
    __tablename__ = "ai_outputs"

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

    # ── Agent Outputs (JSONB for queryability) ────────────────
    analyst_json      = Column(JSONB, nullable=True)   # Analyst structured analysis
    copy_en_json      = Column(JSONB, nullable=True)   # EN copywriter output
    copy_ar_json      = Column(JSONB, nullable=True)   # AR copywriter output
    validation_result = Column(JSONB, nullable=True)   # Validator QA result

    # ── WhatsApp Messages (pre-filled, pre-assembled) ─────────
    wame_message_en = Column(String, nullable=True)    # Pre-filled EN WA message text
    wame_message_ar = Column(String, nullable=True)    # Pre-filled AR WA message text

    # ── Observability ─────────────────────────────────────────
    model_used   = Column(String, nullable=True)       # Last model that ran
    tokens_used  = Column(Integer, nullable=True)      # Approximate token count
    retry_count  = Column(Integer, default=0)          # Validator retry counter

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
    lead = relationship("Lead", back_populates="ai_output")

    def __repr__(self) -> str:
        return (
            f"<AIOutput id={self.id} lead_id={self.lead_id} "
            f"retry_count={self.retry_count}>"
        )
