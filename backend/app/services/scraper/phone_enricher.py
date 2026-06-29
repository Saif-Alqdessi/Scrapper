"""
app/services/scraper/phone_enricher.py
Post-scrape phone number enrichment via DuckDuckGo Instant Answers API.

Used when:
  - PlaywrightMapsScraper returns partial data (it never has a phone from HTML)
  - PlaywrightMapsScraper returns partial data (it never has a phone)

Strategy:
  1. Query DuckDuckGo Instant Answers for "{name} {location} phone number"
  2. Parse the AbstractText for international phone number patterns
  3. Return the first match, or None if no number is found

Limitations:
  - DuckDuckGo Instant Answers is free but not highly reliable for MENA businesses
  - For a production upgrade, consider integrating with a paid data enrichment
    service (Clearbit, Hunter, etc.) or scraping the business's own website

Note: Businesses we target have NO website, so option 3 (website scraping)
is intentionally not implemented here.
"""
import logging
import re

import httpx

log = logging.getLogger(__name__)

# International phone number regex — matches formats common in MENA region:
#   +962 6 123 4567   (Jordan with country code)
#   +966 50 123 4567  (Saudi with country code)
#   06-123-4567       (local Jordanian format)
_PHONE_RE = re.compile(
    r"(?:\+|00)?[\d\s\-\(\)]{7,20}(?<!\s)",
    re.VERBOSE,
)

_DDG_API_URL = "https://api.duckduckgo.com/"
_HTTP_TIMEOUT = 15.0


class PhoneEnricher:
    """
    Attempts to find a phone number for a business that has none.

    Usage:
        enricher = PhoneEnricher()
        phone = await enricher.enrich("Al Noor Clinic", "Amman, Jordan")
        if phone:
            lead.phone = phone
    """

    async def enrich(self, business_name: str, location: str) -> str | None:
        """
        Search DuckDuckGo for the business phone number.

        Args:
            business_name: e.g. "Al Noor Dental Clinic"
            location:      e.g. "Amman, Jordan"

        Returns:
            Normalized phone string, or None if not found.
        """
        query = f"{business_name} {location} phone number"
        log.debug(
            "PhoneEnricher querying DuckDuckGo",
            extra={"business": business_name, "location": location},
        )

        try:
            async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
                resp = await client.get(
                    _DDG_API_URL,
                    params={
                        "q":       query,
                        "format":  "json",
                        "no_html": "1",
                        "skip_disambig": "1",
                    },
                    headers={"User-Agent": "LeadForge/1.0 (lead enrichment bot)"},
                )
                resp.raise_for_status()
                data = resp.json()

        except httpx.TimeoutException:
            log.warning(
                "PhoneEnricher DuckDuckGo request timed out",
                extra={"business": business_name},
            )
            return None
        except httpx.HTTPStatusError as exc:
            log.warning(
                "PhoneEnricher DuckDuckGo HTTP error",
                extra={"status": exc.response.status_code, "business": business_name},
            )
            return None
        except Exception as exc:
            log.warning(
                "PhoneEnricher unexpected error",
                extra={"error": str(exc), "business": business_name},
                exc_info=True,
            )
            return None

        # Search for a phone number in the AbstractText and Answer fields
        candidate_texts = [
            data.get("AbstractText", ""),
            data.get("Answer", ""),
        ]

        for text in candidate_texts:
            if not text:
                continue
            match = _PHONE_RE.search(text)
            if match:
                phone = match.group(0).strip()
                log.info(
                    "PhoneEnricher found phone number",
                    extra={"business": business_name, "phone": phone},
                )
                return phone

        log.debug(
            "PhoneEnricher found no phone number",
            extra={"business": business_name},
        )
        return None

    async def enrich_many(
        self,
        leads: list[dict],
    ) -> list[dict]:
        """
        Enrich phone numbers for a batch of lead dicts that are missing a phone.
        Modifies lead dicts in-place and returns the updated list.

        Designed for use in the Celery task after Playwright scraping:

            enricher = PhoneEnricher()
            leads = await enricher.enrich_many(playwright_results)

        Args:
            leads: List of dicts with at least 'business_name', 'location', 'phone' keys.

        Returns:
            Same list with phone fields populated where enrichment succeeded.
        """
        for lead in leads:
            if lead.get("phone"):
                continue  # Already has a phone — skip
            phone = await self.enrich(
                business_name=lead.get("business_name", ""),
                location=lead.get("location", ""),
            )
            if phone:
                lead["phone"] = phone
        return leads
