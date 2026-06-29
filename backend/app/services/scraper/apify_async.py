"""
app/services/scraper/apify_async.py
Starts an Apify actor run asynchronously (fire-and-forget with webhook).
Does NOT wait for the run to complete — Apify calls us back via webhook.
"""
import logging
import httpx
from app.config import settings
from app.services.scraper.apify_scraper import _build_payload, _validate_token

_APIFY_RUNS_URL = (
    "https://api.apify.com/v2/acts/apify~google-maps-scraper/runs"
)
_HTTPX_TIMEOUT = 15.0   # Just launching the run — fast

log = logging.getLogger(__name__)


async def start_apify_run(
    niche: str,
    location: str,
    campaign_id: str,
    webhook_url: str,
    max_results: int = 40,
) -> str:
    """
    Fire an async Apify actor run.
    Returns the Apify run_id immediately (Apify will call webhook_url when done).
    """
    token = _validate_token()
    payload = {
        **_build_payload(niche, location, max_results),
        "webhooks": [{
            "eventTypes": [
                "ACTOR.RUN.SUCCEEDED",
                "ACTOR.RUN.FAILED",
                "ACTOR.RUN.ABORTED",
            ],
            "requestUrl": webhook_url,
            "payloadTemplate": (
                '{"runId":"{{runId}}",'
                '"status":"{{eventType}}",'
                f'"campaignId":"{campaign_id}"}}'
            ),
        }],
    }

    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        response = await client.post(
            _APIFY_RUNS_URL,
            params={"token": token},
            json=payload,
        )
        response.raise_for_status()

    run_id: str = response.json()["data"]["id"]
    log.info(
        "Apify run started: run_id=%s campaign_id=%s niche=%r",
        run_id, campaign_id, niche,
    )
    return run_id


async def abort_apify_run(run_id: str) -> None:
    """
    Aborts a running Apify Google Maps Scraper run asynchronously.
    """
    token = _validate_token()
    url = f"https://api.apify.com/v2/actor-runs/{run_id}/abort?token={token}"
    
    log.info(f"Attempting to abort Apify run with ID: {run_id}")
    
    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        try:
            response = await client.post(url)
            response.raise_for_status()
            log.info(f"Successfully aborted Apify run with ID: {run_id}")
        except httpx.HTTPStatusError as e:
            log.error(f"HTTP error occurred while aborting Apify run {run_id}: {e}", exc_info=True)
            raise
        except httpx.RequestError as e:
            log.error(f"Request error occurred while aborting Apify run {run_id}: {e}", exc_info=True)
            raise
