"""
app/services/agents/copywriter_en.py
English Copywriter Agent — Groq (llama-3.1-8b-instant).

Model switched from llama-3.3-70b-versatile (100K TPD — exhausted on free tier)
to llama-3.1-8b-instant (no daily token limit, 6000 TPM, JSON-mode supported).
Quality is sufficient for structured JSON landing-page copy generation.
"""
import json
import logging

from groq import AsyncGroq

from app.config import settings
from app.services.agents.groq_utils import groq_call_with_backoff

log    = logging.getLogger(__name__)
client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# This schema MUST exactly mirror what your Next.js frontend expects.
FRONTEND_JSON_SCHEMA = """
{
  "meta": {
    "title": "string (max 60 chars, SEO-optimized)",
    "description": "string (max 155 chars)"
  },
  "hero": {
    "headline": "string (max 8 words, bold, punchy)",
    "subheadline": "string (1 sentence, value proposition)",
    "cta_primary": { "label": "string", "action": "call|whatsapp|scroll" },
    "cta_secondary": { "label": "string", "action": "scroll" }
  },
  "services": [
    { "title": "string", "description": "string (2 sentences max)", "icon": "string (lucide icon name)" }
  ],
  "about": {
    "headline": "string",
    "body": "string (3 sentences, personal tone, mention location)"
  },
  "social_proof": {
    "headline": "string",
    "stats": [
      { "value": "string (e.g. '4.8★')", "label": "string" }
    ]
  },
  "cta_section": {
    "headline": "string",
    "body": "string (1-2 sentences)",
    "button_label": "string"
  },
  "contact": {
    "headline": "string",
    "tagline": "string"
  },
  "footer": {
    "tagline": "string"
  }
}
"""


async def copywriter_en_agent(state: dict) -> dict:
    lead     = state["lead"]
    analysis = state["analysis"]

    prompt = f"""You are a world-class conversion copywriter for local business landing pages.
Write hyper-personalized, emotionally resonant English copy.
NEVER use generic filler. Every word must feel written specifically for {lead["business_name"]}.

Business Intelligence:
{json.dumps(analysis, indent=2)}

Business Facts:
- Name:       {lead["business_name"]}
- Location:   {lead["location"]}
- Rating:     {lead["google_rating"]} stars from {lead["review_count"]} real customers
- Phone:      {lead["phone"]}

Rules:
1. Hero headline: max 8 words, powerful, specific to this business type
2. Services: list exactly 4 services realistic for a {lead["niche"]}
3. About section: mention {lead["location"]} naturally, feel personal not corporate
4. Use the review themes as social proof signals
5. CTA labels must be action-oriented (Book Now, Call Us Today, etc.)
6. Return ONLY valid JSON matching this schema exactly (no markdown, no explanation):

{FRONTEND_JSON_SCHEMA}"""

    response = await groq_call_with_backoff(
        client,
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=1200,
        response_format={"type": "json_object"},
    )

    raw  = response.choices[0].message.content.strip()
    copy = json.loads(raw)

    log.debug("EN copywriter complete", extra={"lead": lead["business_name"]})
    # Return ONLY copy_en — do NOT spread {**state} here.
    # Returning the full state from a parallel node causes LangGraph to see
    # conflicting updates to shared keys (e.g. "lead") from both copywriters
    # simultaneously, raising InvalidUpdateError: Can receive only one value per step.
    return {"copy_en": copy}
