"""
app/services/utils.py
Utility functions shared across the pipeline.

Phase 7 (Roadmap §7.1): URL slug generator + phone formatter.
"""
import re
import unicodedata


def generate_slug(business_name: str, location: str) -> str:
    """
    Converts business name + location to a URL-safe slug.

    Examples:
      'Al-Noor Dental Clinic', 'Amman, Jordan'  → 'al-noor-dental-clinic-amman'
      'عيادات ليجاسي لطب الأسنان', 'Amman'      → 'amman'  (Arabic dropped to ASCII)
    """
    def slugify(text: str) -> str:
        # Normalize unicode — handles Arabic, accented chars
        text = unicodedata.normalize("NFKD", text)
        text = text.encode("ascii", "ignore").decode("ascii")
        text = text.lower()
        text = re.sub(r"[^\w\s-]", "", text)
        text = re.sub(r"[-\s]+", "-", text)
        return text.strip("-")

    # Take only the city from "Amman, Jordan" → "Amman"
    city = location.split(",")[0].strip()
    return f"{slugify(business_name)}-{slugify(city)}"


def format_phone_for_display(phone: str) -> str:
    """Returns clean display format for the landing page."""
    return re.sub(r"[^\d+\-\s()]", "", phone).strip()
