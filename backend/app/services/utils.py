"""
app/services/utils.py
Utility functions shared across the pipeline.

Phase 7 (Roadmap §7.1): URL slug generator + phone formatter.
"""
import hashlib
import re
import unicodedata


def generate_slug(business_name: str, location: str, *, suffix: str = "") -> str:
    """
    Converts business name + location to a URL-safe slug.

    If the business name contains only non-ASCII characters (e.g. pure Arabic)
    the transliterated part will be empty — in that case a short MD5 hash of
    the original name is used instead so slugs remain unique.

    A ``suffix`` (e.g. first 8 chars of google_place_id) can be appended to
    guarantee uniqueness when two businesses share the same name and city.

    Examples:
      'Al-Noor Dental Clinic', 'Amman, Jordan'  → 'al-noor-dental-clinic-amman'
      'عيادات ليجاسي لطب الأسنان', 'Amman'      → 'a3f2c1d0-amman'  (hash fallback)
      'Royal Pharmacy', 'Amman', suffix='abc12345' → 'royal-pharmacy-amman-abc12345'
    """
    def slugify(text: str) -> str:
        # Normalize unicode — handles Arabic, accented chars
        text = unicodedata.normalize("NFKD", text)
        text = text.encode("ascii", "ignore").decode("ascii")
        text = text.lower()
        text = re.sub(r"[^\w\s-]", "", text)
        text = re.sub(r"[-\s]+", "-", text)
        return text.strip("-")

    # Take only the city from "Amman, Jordan" → "Amman"; guard empty location (m-5)
    city_raw = (location.split(",")[0].strip()) if location else ""
    city_part = slugify(city_raw) or "unknown"

    name_part = slugify(business_name)
    if not name_part:
        # Pure non-ASCII name — fall back to a short hash to avoid collisions (I-4)
        name_part = hashlib.md5(business_name.encode("utf-8")).hexdigest()[:8]

    base = f"{name_part}-{city_part}"
    return f"{base}-{suffix}" if suffix else base


def format_phone_for_display(phone: str) -> str:
    """Returns clean display format for the landing page."""
    return re.sub(r"[^\d+\-\s()]", "", phone).strip()
