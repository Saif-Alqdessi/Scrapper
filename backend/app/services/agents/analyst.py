"""
app/services/agents/analyst.py
Analyst Agent — Phase 5 (Roadmap §5.3).

Model switched from llama-3.3-70b-versatile (100K TPD — exhausted on free tier)
to llama-3.1-8b-instant (no daily token limit, 6000 TPM, JSON-mode supported).
Input:  lead dict from DB
Output: analysis{} — structured business intelligence for copywriters
"""
import json
import logging

from groq import AsyncGroq

from app.config import settings
from app.services.agents.groq_utils import groq_call_with_backoff

log    = logging.getLogger(__name__)
client = AsyncGroq(api_key=settings.GROQ_API_KEY)


async def analyst_agent(state: dict) -> dict:
    lead = state["lead"]

    # Summarize top reviews for context without blowing token budget
    review_summary = "\n".join([
        f'- "{r["text"][:200]}" (⭐{r["rating"]})'
        for r in (lead.get("top_reviews") or [])[:3]
    ]) or "No reviews available"

    prompt = f"""
You are a local business intelligence analyst. Analyze this business listing
and extract strategic copywriting signals. Return ONLY valid JSON.

Business:
  Name:     {lead["business_name"]}
  Type:     {lead["niche"]}
  Location: {lead["location"]}
  Rating:   {lead["google_rating"]} ({lead["review_count"]} Google reviews)
  Address:  {lead["address"]}

Sample customer reviews:
{review_summary}

Return this exact JSON structure (no markdown, no explanation):
{{
  "business_archetype": "family_clinic|specialist|casual_dining|fine_dining|general_law|...",
  "primary_audience": "families|young_professionals|tourists|local_community|...",
  "inferred_usp": "One sentence: what makes them stand out based on evidence",
  "pain_points_solved": ["pain 1", "pain 2", "pain 3"],
  "tone_profile": "warm_and_friendly|professional|energetic|calm_and_trustworthy",
  "review_themes": ["theme1", "theme2", "theme3"],
  "local_identity_signals": ["any neighborhood names, landmarks, or local context"],
  "suggested_services": ["service1", "service2", "service3", "service4"],
  "urgency_hook": "One-line reason they need a website now"
}}
"""

    response = await groq_call_with_backoff(
        client,
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    analysis = json.loads(response.choices[0].message.content)
    log.debug("Analyst complete", extra={"lead": lead["business_name"]})
    return {"analysis": analysis}
