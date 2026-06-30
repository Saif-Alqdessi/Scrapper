"""
app/services/scraper/apify_async.py

Starts an Apify actor run asynchronously and attaches a webhook using the
explicit 2-step flow:
  1. POST /v2/acts/{actor}/runs           → get run_id
  2. POST /v2/webhooks?condition.runId    → attach webhook to that exact run

This 2-step approach is bulletproof because the Apify Webhooks API
unconditionally registers the webhook tied to the specific run_id,
bypassing all query-param encoding issues.
"""
import logging

import httpx

from app.config import settings
from app.services.scraper.apify_scraper import _build_payload, _validate_token

_APIFY_RUNS_URL = "https://api.apify.com/v2/acts/compass~crawler-google-places/runs"
_APIFY_WEBHOOKS_URL = "https://api.apify.com/v2/webhooks"
_HTTPX_TIMEOUT = 15.0  # launching a run is fast — no dataset wait

log = logging.getLogger(__name__)


async def _create_run(token: str, actor_input: dict) -> str:
    """Step 1 — Start the Apify actor run. Returns the run_id."""
    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        response = await client.post(
            _APIFY_RUNS_URL,
            params={"token": token},
            json=actor_input,
        )
        response.raise_for_status()
    run_id: str = response.json()["data"]["id"]
    return run_id


async def _attach_webhook(
    token: str,
    run_id: str,
    campaign_id: str,
    webhook_url: str,
) -> None:
    """
    Step 2 — Attach a webhook to a specific run via the Apify Webhooks API.

    Uses condition.actorRunId so Apify fires exactly on this run's completion.
    The payloadTemplate injects runId and eventType from Apify's context.
    """
    payload_template = (
        '{"runId":"{{runId}}",'
        '"status":"{{eventType}}",'
        f'"campaignId":"{campaign_id}"}}'
    )
    webhook_body = {
        "eventTypes": [
            "ACTOR.RUN.SUCCEEDED",
            "ACTOR.RUN.FAILED",
            "ACTOR.RUN.ABORTED",
        ],
        "requestUrl": webhook_url,
        "payloadTemplate": payload_template,
        "condition": {
            "actorRunId": run_id,
        },
    }
    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        response = await client.post(
            _APIFY_WEBHOOKS_URL,
            params={"token": token},
            json=webhook_body,
        )
        response.raise_for_status()
    webhook_id: str = response.json()["data"]["id"]
    log.info(
        "Webhook attached: webhook_id=%s run_id=%s url=%s",
        webhook_id, run_id, webhook_url,
    )


async def start_apify_run(
    niche: str,
    location: str,
    campaign_id: str,
    webhook_url: str,
    max_results: int = 40,
) -> str:
    """
    Start an Apify Google Maps Scraper run and attach a completion webhook.

    Returns the Apify run_id immediately. Apify calls webhook_url when the
    run succeeds, fails, or is aborted.
    """
    token = _validate_token()
    query = f"{niche} in {location}"
    actor_input = _build_payload(query, max_results)

    # ── Step 1: Start the run ─────────────────────────────────────────────────
    run_id = await _create_run(token, actor_input)
    log.info(
        "Apify run started: run_id=%s campaign_id=%s niche=%r",
        run_id, campaign_id, niche,
    )

    # ── Step 2: Attach webhook explicitly via the Webhooks API ───────────────
    try:
        await _attach_webhook(token, run_id, campaign_id, webhook_url)
    except Exception as exc:
        # Run is already started — log the webhook failure but don't crash.
        # The campaign status can be checked manually if webhook never arrives.
        log.error(
            "Failed to attach webhook for run_id=%s: %s",
            run_id, exc, exc_info=True,
        )

    return run_id


async def abort_apify_run(run_id: str) -> None:
    """Aborts a running Apify Google Maps Scraper run."""
    token = _validate_token()
    url = f"https://api.apify.com/v2/actor-runs/{run_id}/abort"
    log.info("Aborting Apify run: run_id=%s", run_id)
    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        try:
            response = await client.post(url, params={"token": token})
            response.raise_for_status()
            log.info("Apify run aborted: run_id=%s", run_id)
        except httpx.HTTPStatusError as exc:
            log.error("HTTP error aborting run %s: %s", run_id, exc, exc_info=True)
            raise
        except httpx.RequestError as exc:
            log.error("Request error aborting run %s: %s", run_id, exc, exc_info=True)
            raise
