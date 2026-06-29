"""
app/services/whatsapp.py
WhatsApp wa.me link generator — Phase 6 (Roadmap §6.1).

Pure Python — zero cost, zero LLM calls.
Generates pre-filled WhatsApp click-to-chat URLs ready to open from the dashboard.
"""
import re
import urllib.parse


class WaMeLinkGenerator:
    """
    Generates wa.me click-to-chat links with pre-filled, personalized messages.

    Usage:
        gen = WaMeLinkGenerator()
        url = gen.generate(phone="+962 7 9388 9333", message="Hi team 👋...")
        # → "https://wa.me/96279388333?text=Hi%20team%20..."
    """

    def generate(self, phone: str, message: str) -> str:
        """
        Args:
            phone:   Phone in any format — normalized internally.
            message: Pre-filled message text (will be URL-encoded).
        Returns:
            wa.me URL ready to click from the dashboard.
        """
        normalized = self._normalize_phone(phone)
        encoded    = urllib.parse.quote(message)
        return f"https://wa.me/{normalized}?text={encoded}"

    def _normalize_phone(self, phone: str) -> str:
        """
        Normalize to E.164 digits (no leading +) for wa.me URLs.

        Handles Jordan local formats:
          "0779804320"   → "962779804320"
          "07 9117 5410" → "962791175410"
          "+962791175410"→ "962791175410"
          "962791175410" → "962791175410"  (already international)

        Falls back to stripping all non-digits for other formats.
        """
        # Strip everything except digits and a leading +
        digits = re.sub(r"[^\d]", "", phone.lstrip("+") if phone.startswith("+") else re.sub(r"[^\d+]", "", phone).lstrip("+"))

        # Already international: starts with country code (no leading 0)
        if digits.startswith("962"):
            return digits

        # Jordan local format: leading 0 → replace with 962
        if digits.startswith("0"):
            return "962" + digits[1:]

        # Assume already stripped international digits
        return digits

    def build_message_en(self, lead: dict, preview_url: str) -> str:
        review_count = lead.get("review_count") or "many"
        google_rating = lead.get("google_rating", "")
        return (
            f"Hi {lead['business_name']} team! 👋\n\n"
            f"I came across your business on Google — "
            f"{review_count} reviews with a {google_rating}-star average is genuinely impressive.\n\n"
            f"I put together a quick website concept to show what your online presence could look like. Here is the link:\n\n"
            f"{preview_url}\n\n"
            f"Took me a short while to build. Happy to refine it further or hand it over completely "
            f"— no pressure at all.\n\n"
            f"Worth a quick look? 🙂"
        )

    def build_message_ar(self, lead: dict, preview_url: str) -> str:
        review_count = lead.get("review_count") or "كثير من"
        google_rating = lead.get("google_rating", "")
        return (
            f"السلام عليكم، فريق {lead['business_name']} 👋\n\n"
            f"صادفت نشاطكم التجاري على Google — "
            f"{review_count} تقييم بمعدل {google_rating} نجوم، هذا رائع جداً!\n\n"
            f"قمت بإعداد تصور سريع لموقع إلكتروني يُظهر حضوركم الرقمي. هذا هو الرابط:\n\n"
            f"{preview_url}\n\n"
            f"يسعدني تطويره أو تسليمه لكم بالكامل — لا أي إلزام.\n\n"
            f"يستحق نظرة سريعة؟ 🙂"
        )


async def wame_link_generator(state: dict) -> dict:
    """
    LangGraph node — pure Python, no LLM.
    Builds EN and AR wa.me links and injects them into state.
    """
    from app.config import settings

    lead        = state["lead"]
    preview_url = f"{settings.PREVIEW_BASE_URL}/{lead['slug']}"
    gen         = WaMeLinkGenerator()

    msg_en = gen.build_message_en(lead, preview_url)
    msg_ar = gen.build_message_ar(lead, preview_url)

    return {
        "wame_link_en": gen.generate(lead["phone"], msg_en),
        "wame_link_ar": gen.generate(lead["phone"], msg_ar),
    }
