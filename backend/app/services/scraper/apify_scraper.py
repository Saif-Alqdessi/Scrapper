"""
apify_scraper.py
~~~~~~~~~~~~~~~~
Async Google Maps lead scraper backed by the Apify cloud API.

Replaces the legacy PlaywrightMapsScraper. Calls the Apify Google Maps
Scraper actor via a synchronous run endpoint (POST + wait), then maps each
JSON item to the RawLeadData/RawReview Pydantic contracts.
"""

import logging
from collections.abc import AsyncGenerator

import httpx

from app.config import settings
from app.schemas.lead import RawLeadData, RawReview

# ---------------------------------------------------------------------------
# Module-level constants
# ---------------------------------------------------------------------------
_APIFY_RUN_URL: str = (
    "https://api.apify.com/v2/acts/compass~crawler-google-places"
    "/run-sync-get-dataset-items"
)
_APIFY_TIMEOUT_PARAM: int = 120          # seconds passed to Apify as query param
_HTTPX_TIMEOUT: float = 130.0            # slightly longer than Apify's own timeout
_DEFAULT_LANGUAGE: str = "en"

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _build_payload(query: str, max_results: int, location: str = "") -> dict:
    """Return the Apify actor input payload for a single search query."""
    country_code = "jo" if any(x in location.lower() for x in ["jordan", "amman", "zarqa", "irbid"]) else "us"
    return {
        "searchStringsArray": [query],
        "maxCrawledPlacesPerSearch": max_results,
        "language": _DEFAULT_LANGUAGE,
        "countryCode": country_code,
        "zoom": 12,
        "includeReviews": True,
        "maxReviews": 3,
    }


def _map_reviews(raw_reviews: list) -> list[RawReview]:
    """Convert up to three raw Apify review dicts to RawReview objects."""
    mapped: list[RawReview] = []
    for r in raw_reviews[:3]:
        rating: float | None = float(r["stars"]) if r.get("stars") else None
        mapped.append(
            RawReview(
                author=r.get("name"),
                text=r.get("text"),
                rating=rating,
            )
        )
    return mapped


def _build_lead(
    item: dict,
    business_name: str,
    niche: str,
    location: str,
) -> RawLeadData:
    """Construct RawLeadData from a validated Apify item dict."""
    website_url: str | None = item.get("website")
    return RawLeadData(
        business_name=business_name,
        niche=niche,
        location=location,
        scraped_from="apify",
        google_place_id=item.get("placeId"),
        google_rating=item.get("totalScore"),
        review_count=item.get("reviewsCount", 0),
        phone=item.get("phone"),
        address=item.get("address"),
        website_url=website_url,
        has_website=bool(website_url),
        maps_url=item.get("url"),
        photo_reference=item.get("imageUrl"),
        top_reviews=_map_reviews(item.get("reviews", [])),
    )


def _map_item(item: dict, niche: str, location: str) -> RawLeadData | None:
    """
    Map a single Apify JSON item to RawLeadData.

    Returns None and logs DEBUG if the required *title* field is absent.
    """
    business_name: str | None = item.get("title")
    if not business_name:
        log.debug("Skipping item — missing 'title': %s", item)
        return None
    lead = _build_lead(item, business_name, niche, location)
    log.debug("Mapped item: business_name=%r place_id=%r", business_name, lead.google_place_id)
    return lead


def _validate_token() -> str:
    """Return the Apify API token or raise RuntimeError if not configured."""
    token: str = settings.APIFY_API_TOKEN or ""
    if not token:
        raise RuntimeError("APIFY_API_TOKEN is not configured")
    return token


async def _fetch_items(query: str, max_results: int, token: str, location: str) -> list[dict]:
    """
    POST to Apify's synchronous run endpoint and return the raw item list.

    Raises httpx.HTTPStatusError or httpx.RequestError on transport failures.
    """
    payload = _build_payload(query, max_results, location)
    params = {"token": token, "timeout": _APIFY_TIMEOUT_PARAM}

    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        response = await client.post(_APIFY_RUN_URL, params=params, json=payload)
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# Public scraper class
# ---------------------------------------------------------------------------

class ApifyMapsScraper:
    """Async Google Maps scraper powered by the Apify cloud actor."""

    async def search_businesses(
        self,
        niche: str,
        location: str,
        max_results: int = 40,
    ) -> AsyncGenerator[RawLeadData, None]:
        """
        Yield RawLeadData records for *niche* businesses in *location*.

        Parameters
        ----------
        niche:
            Business category (e.g. ``"plumber"``).
        location:
            Target area (e.g. ``"Austin, TX"``).
        max_results:
            Upper bound on results returned by Apify.
        """
        token: str = _validate_token()
        query: str = f"{niche} in {location}"
        log.info("Apify search started: query=%r max_results=%d", query, max_results)

        try:
            items: list[dict] = await _fetch_items(query, max_results, token, location)
        except httpx.HTTPStatusError as exc:
            log.error(
                "Apify HTTP error: status=%d url=%s",
                exc.response.status_code,
                exc.request.url,
                exc_info=True,
            )
            raise
        except httpx.RequestError as exc:
            log.error("Apify request error: url=%s", exc.request.url, exc_info=True)
            raise

        log.info("Apify returned %d items for query=%r", len(items), query)

        for item in items:
            lead: RawLeadData | None = _map_item(item, niche, location)
            if lead is not None:
                yield lead
