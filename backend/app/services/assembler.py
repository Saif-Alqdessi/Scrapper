"""
app/services/assembler.py
Payload Assembler — Phase 6 (Roadmap §6.2).

Pure Python — no LLM. Merges AI-generated copy with real scraped data
into the exact JSON schema your Next.js frontend consumes.
Also persists PagePayload to DB and stamps the lead as READY.
"""
import logging
from datetime import datetime, timezone

log = logging.getLogger(__name__)


async def payload_assembler(state: dict) -> dict:
    """
    LangGraph node — merges copy + lead data → PagePayload in DB.

    Transitions:
      Lead.status: AI_PROCESSING → READY
      Creates: PagePayload(payload_en, payload_ar)
      Sets:    Lead.wame_link, Lead.preview_url, Lead.ai_processed_at
    """
    from app.database import make_task_engine
    from app.models.lead import Lead, LeadStatus
    from app.models.page_payload import PagePayload
    from app.config import settings
    from sqlalchemy import select

    lead    = state["lead"]
    copy_en = state["copy_en"]
    copy_ar = state["copy_ar"]
    now_iso = datetime.now(timezone.utc).isoformat()

    def build_payload(copy: dict, lang: str) -> dict:
        """
        Inject real business data into AI-generated copy.
        Fields from AI: meta, hero text, services, about, cta, contact text, footer.
        Fields from scrape: phone, rating, review_count, maps_url, address.
        """
        return {
            # ── Pipeline metadata ──────────────────────────────────────────
            "_meta": {
                "slug":      lead["slug"],
                "lang":      lang,
                "direction": "rtl" if lang == "ar" else "ltr",
                "generated": now_iso,
                "version":   1,
            },

            # ── SEO (AI-generated) ────────────────────────────────────────
            "meta": copy.get("meta", {}),

            # ── Hero (AI text + real phone) ───────────────────────────────
            "hero": {
                **copy.get("hero", {}),
                "phone": lead.get("phone"),
            },

            # ── Services (AI-generated) ───────────────────────────────────
            "services": copy.get("services", []),

            # ── About (AI-generated) ──────────────────────────────────────
            "about": copy.get("about", {}),

            # ── Social Proof (AI text + real numbers) ─────────────────────
            "social_proof": {
                "headline": copy.get("social_proof", {}).get("headline", ""),
                "stats": [
                    {
                        "value": f"{lead.get('google_rating')}★",
                        "label": "Google Rating" if lang == "en" else "تقييم Google",
                    },
                    {
                        "value": f"{lead.get('review_count') or ''}+",
                        "label": "Happy Customers" if lang == "en" else "عميل سعيد",
                    },
                    {
                        "value": "100%",
                        "label": "Satisfaction" if lang == "en" else "رضا العملاء",
                    },
                ],
                "maps_url":      lead.get("maps_url"),
                "google_rating": lead.get("google_rating"),
                "review_count":  lead.get("review_count"),
            },

            # ── CTA (AI text + real phone) ────────────────────────────────
            "cta_section": {
                **copy.get("cta_section", {}),
                "phone": lead.get("phone"),
            },

            # ── Contact (AI text + real data) ────────────────────────────
            "contact": {
                **copy.get("contact", {}),
                "phone":    lead.get("phone"),
                "address":  lead.get("address"),
                "maps_url": lead.get("maps_url"),
            },

            # ── Footer (AI-generated) ─────────────────────────────────────
            "footer": copy.get("footer", {}),

            # ── Business identity (always from scrape) ────────────────────
            "business": {
                "name":            lead.get("business_name"),
                "niche":           lead.get("niche"),
                "location":        lead.get("location"),
                "phone":           lead.get("phone"),
                "address":         lead.get("address"),
                "google_rating":   lead.get("google_rating"),
                "review_count":    lead.get("review_count"),
                "maps_url":        lead.get("maps_url"),
                "photo_reference": lead.get("photo_reference"),
            },
        }

    final_payload_en = build_payload(copy_en, "en")
    final_payload_ar = build_payload(copy_ar, "ar")
    preview_url      = f"{settings.PREVIEW_BASE_URL}/{lead['slug']}"

    # ── Persist to DB ──────────────────────────────────────────────────────
    # make_task_engine() creates a fresh engine bound to the CURRENT asyncio
    # event loop (the one asyncio.run() just created for this Celery task).
    # Using the module-level get_async_session() causes RuntimeError: Event
    # loop is closed because that engine's asyncpg pool was bound to the
    # FastAPI startup loop which no longer exists inside Celery workers.
    async with make_task_engine() as SessionLocal:
        async with SessionLocal() as db:
            # Upsert PagePayload (re-running assembler for a lead should overwrite)
            existing_pp = await db.execute(
                select(PagePayload).where(PagePayload.lead_id == lead["id"])
            )
            page_payload = existing_pp.scalar_one_or_none()

            if page_payload:
                page_payload.payload_en = final_payload_en
                page_payload.payload_ar = final_payload_ar
                page_payload.version   += 1
            else:
                page_payload = PagePayload(
                    lead_id    = lead["id"],
                    slug       = lead["slug"],
                    payload_en = final_payload_en,
                    payload_ar = final_payload_ar,
                )
                db.add(page_payload)

            # Stamp lead as READY with all outreach links (EN + AR)
            lead_obj = await db.get(Lead, lead["id"])
            if lead_obj:
                lead_obj.status          = LeadStatus.READY
                lead_obj.preview_url     = preview_url
                lead_obj.wame_link       = state.get("wame_link_en")
                lead_obj.wame_link_ar    = state.get("wame_link_ar")
                lead_obj.ai_processed_at = datetime.now(timezone.utc)

            await db.commit()

    log.info(
        "Payload assembled and persisted",
        extra={"lead_id": lead["id"], "slug": lead["slug"]},
    )

    return {
        "final_payload_en": final_payload_en,
        "final_payload_ar": final_payload_ar,
    }
