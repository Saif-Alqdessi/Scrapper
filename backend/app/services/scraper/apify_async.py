"""
app/services/scraper/apify_async.py
Starts an Apify actor run asynchronously (fire-and-forget with webhook).
Does NOT wait for the run to complete — Apify calls us back via webhook.
"""
import base64
import json
import logging
import httpx
from app.config import settings
from app.services.scraper.apify_scraper import _build_payload, _validate_token

_APIFY_RUNS_URL = (
    "https://api.apify.com/v2/acts/compass~crawler-google-places/runs"
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

    Webhooks are registered via the `webhooks` query param (base64-encoded JSON),
    NOT in the request body — Apify silently ignores body-level webhook dicts.
    """
    token = _validate_token()
    query = f"{niche} in {location}"

    # ── Actor input (body) ────────────────────────────────────────────────────
    actor_input = _build_payload(query, max_results)

    # ── Webhook registration (query param, base64-encoded JSON array) ─────────
    webhook_definition = [
        {
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
        }
    ]
    webhooks_b64 = base64.b64encode(
        json.dumps(webhook_definition).encode()
    ).decode()

    log.info(
        "Registering Apify webhook: url=%s campaign_id=%s",
        webhook_url, campaign_id,
    )

    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        response = await client.post(
            _APIFY_RUNS_URL,
            params={"token": token, "webhooks": webhooks_b64},
            json=actor_input,
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
