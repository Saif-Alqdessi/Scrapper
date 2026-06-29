"""
app/services/agents/groq_utils.py
Shared Groq API utilities — rate-limit throttle and exponential back-off retry.

Extracted to a standalone module to avoid circular imports between:
  pipeline.py → copywriter_en/ar.py → pipeline.py

Usage in any agent:
    from app.services.agents.groq_utils import groq_call_with_backoff

    response = await groq_call_with_backoff(
        client,
        model="llama-3.3-70b-versatile",
        messages=[...],
        ...
    )
"""
import asyncio
import logging
import random

log = logging.getLogger(__name__)

# ── Concurrency + retry config ────────────────────────────────────────────────
# Groq free tier: ~12 000 TPM / ~30 RPM.
# 2 concurrent calls across all parallel pipeline workers keeps us under limit.
GROQ_MAX_CONCURRENT = 2
GROQ_MAX_RETRIES    = 5
GROQ_BASE_DELAY     = 2.0   # seconds — doubles each retry (capped at 60s)

# Module-level semaphore — shared across all coroutines in this process.
# Recreated when the event loop changes (each asyncio.run() call in Celery).
_groq_semaphore: asyncio.Semaphore | None = None
_groq_semaphore_loop: asyncio.AbstractEventLoop | None = None


def _get_groq_semaphore() -> asyncio.Semaphore:
    """
    Returns the process-level Groq semaphore, creating a fresh one whenever
    the running event loop has changed (i.e. after asyncio.run() restarts).
    """
    global _groq_semaphore, _groq_semaphore_loop
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if _groq_semaphore is None or _groq_semaphore_loop is not current_loop:
        _groq_semaphore      = asyncio.Semaphore(GROQ_MAX_CONCURRENT)
        _groq_semaphore_loop = current_loop

    return _groq_semaphore


async def groq_call_with_backoff(client, **kwargs):
    """
    Wraps a groq AsyncGroq client.chat.completions.create() call with:
      - Concurrency cap: at most GROQ_MAX_CONCURRENT simultaneous calls
      - Exponential back-off with full jitter on RateLimitError (429)
        up to GROQ_MAX_RETRIES attempts

    All kwargs are forwarded verbatim to client.chat.completions.create().
    """
    from groq import RateLimitError

    semaphore = _get_groq_semaphore()
    delay     = GROQ_BASE_DELAY

    async with semaphore:
        for attempt in range(1, GROQ_MAX_RETRIES + 1):
            try:
                return await client.chat.completions.create(**kwargs)
            except RateLimitError as exc:
                if attempt == GROQ_MAX_RETRIES:
                    log.error(
                        "Groq 429 rate limit — exhausted %d retries: %s",
                        GROQ_MAX_RETRIES, exc,
                    )
                    raise
                jitter = random.uniform(0, delay)
                log.warning(
                    "Groq 429 (attempt %d/%d) — retrying in %.1fs",
                    attempt, GROQ_MAX_RETRIES, jitter,
                )
                await asyncio.sleep(jitter)
                delay = min(delay * 2, 60.0)
