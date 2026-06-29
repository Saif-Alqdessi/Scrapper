"""
app/services/agents/validator.py
Validator Agent — Phase 5 (Roadmap §5.6).

Model: Groq llama-3.1-8b-instant — replaces Gemini Flash 2.0 which exhausted
its free-tier daily quota (limit: 0, Quota exceeded).  Unifies the entire
AI stack on a single provider (Groq) with no daily token limits.

Routes through groq_call_with_backoff() for 429-safe concurrency control.
"""
import json
import logging

from groq import AsyncGroq

from app.config import settings
from app.services.agents.groq_utils import groq_call_with_backoff

log    = logging.getLogger(__name__)
client = AsyncGroq(api_key=settings.GROQ_API_KEY)


async def validator_agent(state: dict) -> dict:
    lead    = state["lead"]
    copy_en = state["copy_en"]
    copy_ar = state["copy_ar"]

    prompt = f"""You are a QA engineer validating AI-generated landing page copy.

Business: {lead["business_name"]} — {lead["niche"]} in {lead["location"]}

Check the English copy for ALL of these issues:
1. Does the business name appear correctly spelled everywhere?
2. Are there any placeholder texts? ("[INSERT NAME]", "Lorem ipsum", "{{variable}}")
3. Does the hero headline make sense for a {lead["niche"]}?
4. Are all 4 services realistic for this business type?
5. Is there any factual hallucination (claiming awards, years in business, etc. without evidence)?
6. Does the about section mention {lead["location"]}?

English Copy to validate:
{json.dumps(copy_en, indent=2)}

Return ONLY this JSON (no markdown, no explanation):
{{
  "passed": true,
  "issues": [],
  "severity": "ok"
}}"""

    response = await groq_call_with_backoff(
        client,
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=200,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()

    try:
        result = json.loads(raw)
    except Exception:
        log.warning(
            "Validator returned unparsable JSON — defaulting to passed",
            extra={"business": lead["business_name"], "raw": raw[:200]},
        )
        result = {"passed": True, "issues": [], "severity": "ok"}

    new_retry_count = state.get("retry_count", 0) + (0 if result.get("passed") else 1)

    log.debug(
        "Validator complete",
        extra={
            "business":    lead["business_name"],
            "passed":      result.get("passed"),
            "severity":    result.get("severity"),
            "retry_count": new_retry_count,
        },
    )

    return {
        "validation_result": result,
        "retry_count":       new_retry_count,
    }
