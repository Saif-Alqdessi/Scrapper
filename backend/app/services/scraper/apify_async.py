import logging
import httpx

from app.services.scraper.apify_scraper import (
    _build_payload,
    _validate_token,
    _HTTPX_TIMEOUT,
)

logger = logging.getLogger(__name__)

async def start_apify_run(niche: str, location: str, max_results: int = 40) -> str:
    """
    Starts an Apify Google Maps Scraper run asynchronously and returns the run ID.
    """
    token = _validate_token()
    query = f"{niche} in {location}"
    payload = _build_payload(query, max_results)
    
    url = f"https://api.apify.com/v2/acts/apify~google-maps-scraper/runs?token={token}"
    
    logger.info(f"Starting Apify run for query: '{query}' with max_results: {max_results}")
    
    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            run_id = data["data"]["id"]
            logger.info(f"Successfully started Apify run with ID: {run_id}")
            return run_id
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred while starting Apify run: {e}", exc_info=True)
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error occurred while starting Apify run: {e}", exc_info=True)
            raise

async def abort_apify_run(run_id: str) -> None:
    """
    Aborts a running Apify Google Maps Scraper run asynchronously.
    """
    token = _validate_token()
    url = f"https://api.apify.com/v2/actor-runs/{run_id}/abort?token={token}"
    
    logger.info(f"Attempting to abort Apify run with ID: {run_id}")
    
    async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
        try:
            response = await client.post(url)
            response.raise_for_status()
            logger.info(f"Successfully aborted Apify run with ID: {run_id}")
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred while aborting Apify run {run_id}: {e}", exc_info=True)
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error occurred while aborting Apify run {run_id}: {e}", exc_info=True)
            raise
