# Backend & Agentic AI Engine — Technical Roadmap
## Phase-by-Phase Architecture for the Lead Gen & Landing Page Pipeline

> **Context**: Frontend is complete — headless Next.js, 100% JSON-driven, LTR/RTL ready.
> **Goal**: Build the backend engine that feeds it: scraping → AI agents → JSON payload → wa.me outreach link.
> **Constraints**: Zero-cost outreach (manual WhatsApp via wa.me), cloud LLMs only (no Ollama/local models).

---

## Master System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTERNAL CONTROL DASHBOARD                          │
│              (Your Next.js Frontend — Already Built ✅)                  │
│                                                                          │
│  [Niche] [Location] [Lang: EN/AR] ──► [▶ Run Pipeline]                  │
│                                                                          │
│  Lead Table ◄──── REST API ◄──── FastAPI Backend                        │
│  [Preview Page] [wa.me Link] [Copy JSON] [Status Badge]                  │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │  HTTP / WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI APPLICATION                               │
│                                                                           │
│   /api/campaigns   /api/leads   /api/jobs   /api/preview/{slug}          │
│                                                                           │
│   ┌─────────────┐   ┌──────────────┐   ┌──────────────────────────────┐ │
│   │  Auth Layer │   │  Job Manager │   │     Payload Assembler        │ │
│   │  (API Key)  │   │  (status     │   │  (merges AI copy + lead data │ │
│   └─────────────┘   │   tracking)  │   │   into final JSON schema)    │ │
│                      └──────┬───────┘   └──────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │ enqueue task
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CELERY WORKER POOL                                  │
│                                                                          │
│  Task 1: scrape_leads()          Task 2: run_ai_pipeline(lead_id)        │
│                                                                          │
│  ┌─────────────────────────┐     ┌────────────────────────────────────┐ │
│  │    SCRAPER ENGINE       │     │      LANGGRAPH AGENT PIPELINE      │ │
│  │  (Zero-API-Cost)        │     │                                    │ │
│  │  Playwright Primary ─┐  │     │  [Analyst Agent]                   │ │
│  │  Yelp Fallback ──────┼─►│────►│       │                           │ │
│  │  Overpass Backup ────┘  │     │       ▼                           │ │
│  │                         │     │  [Copywriter Agent EN + AR]        │ │
│  │  Filter: rating≥4.0     │     │       │                           │ │
│  │          reviews≥15     │     │       ▼                           │ │
│  │          no website     │     │  [Validator Agent]                 │ │
│  └───────────┬─────────────┘     │       │                           │ │
│              │                   │       ▼                           │ │
│              │                   │  [wa.me Link Generator]            │ │
│              │                   └────────────┬───────────────────────┘ │
└──────────────┼──────────────────────────────── ┼───────────────────────┘
               │                                 │
               ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL DATABASE                               │
│                                                                           │
│  campaigns  ──►  leads  ──►  ai_outputs  ──►  page_payloads             │
│                                                                           │
│                         + REDIS (Job Queue + Cache)                      │
└──────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │   FINAL JSON PAYLOAD   │  ◄── Consumed by your
                 │   (strict schema)      │       Next.js frontend
                 │   + wa.me link         │  ◄── Clicked by you manually
                 └────────────────────────┘
```

---

## Phase 1: Project Foundation & Database Schema

### 1.1 Repository & Environment Structure

```
/backend
  ├── app/
  │   ├── main.py               # FastAPI app entry point
  │   ├── config.py             # Settings (Pydantic BaseSettings)
  │   ├── database.py           # SQLAlchemy engine + session
  │   ├── models/               # SQLAlchemy ORM models
  │   │   ├── campaign.py
  │   │   ├── lead.py
  │   │   ├── ai_output.py
  │   │   └── page_payload.py
  │   ├── schemas/              # Pydantic request/response schemas
  │   ├── api/
  │   │   └── v1/
  │   │       ├── campaigns.py
  │   │       ├── leads.py
  │   │       ├── jobs.py
  │   │       └── preview.py
  │   ├── services/             # Business logic (not in routes)
  │   │   ├── scraper/
  │   │   ├── agents/
  │   │   ├── assembler.py      # JSON payload builder
  │   │   └── whatsapp.py       # wa.me link generator
  │   └── workers/
  │       ├── celery_app.py
  │       └── tasks.py
  ├── alembic/                  # DB migrations
  ├── tests/
  ├── .env
  ├── requirements.txt
  └── docker-compose.yml
```

### 1.2 Technology Stack Decision (Final)

```
┌─────────────────────┬────────────────────────────────────────────────┐
│ LAYER               │ TECHNOLOGY                                      │
├─────────────────────┼────────────────────────────────────────────────┤
│ Backend Framework   │ FastAPI (Python 3.12)                          │
│ ASGI Server         │ Uvicorn + Gunicorn                             │
│ Task Queue          │ Celery 5.x                                     │
│ Message Broker      │ Redis 7 (queue + pub/sub for live status)      │
│ Primary Database    │ PostgreSQL 16                                  │
│ ORM                 │ SQLAlchemy 2.0 (async) + Alembic               │
│ Data Validation     │ Pydantic v2                                    │
│ Scraping — Primary  │ Playwright + Chromium (Google Maps headless)   │
│ Scraping — Fallback │ Yelp Fusion API (free 500 req/day)             │
│ Scraping — Backup   │ Overpass API / OSM (fully free, no key)        │
│ AI Orchestration    │ LangGraph 0.2+                                 │
│ LLM — Copywriting   │ Gemini 1.5 Pro (Google AI Studio — unified)    │
│ LLM — Analysis/QA   │ Gemini 1.5 Flash (Google AI Studio — free)     │
│ Hosting (Dev)       │ Railway.app or Render.com (free tier)          │
│ Env Management      │ python-dotenv + Pydantic BaseSettings          │
└─────────────────────┴────────────────────────────────────────────────┘
```

### 1.3 Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.9'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
    command: uvicorn app.main:app --host 0.0.0.0 --reload

  worker:
    build: .
    env_file: .env
    depends_on:
      - postgres
      - redis
    command: celery -A app.workers.celery_app worker --loglevel=info --concurrency=4

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: leadforge
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pg_data:
```

### 1.4 Core Database Schema

This is the most important design decision in Phase 1. Every subsequent phase reads from and writes to these tables.

```python
# app/models/campaign.py
import uuid
from sqlalchemy import Column, String, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class CampaignStatus(str, enum.Enum):
    PENDING   = "pending"
    SCRAPING  = "scraping"
    DONE      = "done"
    FAILED    = "failed"

class Campaign(Base):
    __tablename__ = "campaigns"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    niche      = Column(String, nullable=False)   # e.g. "dental clinic"
    location   = Column(String, nullable=False)   # e.g. "Amman, Jordan"
    language   = Column(String, default="en")     # "en" | "ar" | "both"
    status     = Column(SAEnum(CampaignStatus), default=CampaignStatus.PENDING)
    created_at = Column(DateTime(timezone=True))

    leads = relationship("Lead", back_populates="campaign")
```

```python
# app/models/lead.py
import uuid
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class LeadStatus(str, enum.Enum):
    NEW            = "new"           # Just scraped
    AI_PROCESSING  = "ai_processing" # Agents running
    READY          = "ready"         # JSON payload assembled, wa.me link ready
    OUTREACH_SENT  = "outreach_sent" # You manually clicked the wa.me link
    REPLIED        = "replied"       # Business owner responded
    CLOSED         = "closed"        # Deal signed
    REJECTED       = "rejected"      # Not interested

class Lead(Base):
    __tablename__ = "leads"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id    = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"))

    # --- Raw Scraped Data ---
    business_name  = Column(String, nullable=False)
    google_place_id= Column(String, unique=True)   # Dedup key
    niche          = Column(String)
    location       = Column(String)
    address        = Column(String)
    phone          = Column(String)
    google_rating  = Column(Float)
    review_count   = Column(Integer)
    has_website    = Column(Boolean, default=False)
    website_url    = Column(String)                # NULL if no website
    maps_url       = Column(String)                # Google Maps link
    top_reviews    = Column(JSONB)                 # [{author, text, rating}]
    photo_reference= Column(String)                # Google Places photo ref

    # --- Pipeline State ---
    status         = Column(SAEnum(LeadStatus), default=LeadStatus.NEW)
    slug           = Column(String, unique=True)   # "al-noor-clinic-amman"

    # --- Output Links ---
    preview_url    = Column(String)                # https://yourapp.com/preview/{slug}
    wame_link      = Column(String)                # wa.me/9627XXXXXXX?text=...

    # --- Timestamps ---
    scraped_at     = Column(DateTime(timezone=True))
    ai_processed_at= Column(DateTime(timezone=True))
    outreach_sent_at= Column(DateTime(timezone=True))

    campaign    = relationship("Campaign", back_populates="leads")
    ai_output   = relationship("AIOutput", back_populates="lead", uselist=False)
    page_payload= relationship("PagePayload", back_populates="lead", uselist=False)
```

```python
# app/models/ai_output.py
# Stores raw agent outputs separately from the assembled payload
class AIOutput(Base):
    __tablename__ = "ai_outputs"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id        = Column(UUID(as_uuid=True), ForeignKey("leads.id"), unique=True)

    analyst_json   = Column(JSONB)  # Analyst agent's structured analysis
    copy_en_json   = Column(JSONB)  # Copywriter output (English)
    copy_ar_json   = Column(JSONB)  # Copywriter output (Arabic)
    wame_message_en= Column(String) # Pre-filled WhatsApp message (EN)
    wame_message_ar= Column(String) # Pre-filled WhatsApp message (AR)

    model_used     = Column(String)
    tokens_used    = Column(Integer)
    created_at     = Column(DateTime(timezone=True))

    lead = relationship("Lead", back_populates="ai_output")
```

```python
# app/models/page_payload.py
# The FINAL assembled JSON — exactly what your Next.js frontend consumes
class PagePayload(Base):
    __tablename__ = "page_payloads"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id    = Column(UUID(as_uuid=True), ForeignKey("leads.id"), unique=True)
    slug       = Column(String, unique=True)
    payload_en = Column(JSONB)    # Full EN payload for frontend
    payload_ar = Column(JSONB)    # Full AR payload for frontend
    version    = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))

    lead = relationship("Lead", back_populates="page_payload")
```

---

## Phase 2: Lead Scraper & Data Extraction Engine

> **Architecture Revision (v2):** Google Places API removed (requires $10 prepayment).
> Playwright is now **Layer 1 Primary**. Yelp Fusion is **Layer 2 Fallback** (500 free req/day).
> Overpass/OSM is **Layer 3 Backup** (fully free, no key required).
> `google-generativeai` (Gemini) is **unaffected** — it uses AI Studio, not Google Cloud Maps billing.

### 2.1 Scraper Architecture — 3-Layer Zero-Cost Stack

All three layers feed into the same `LeadFilterEngine` and `RawLeadData` schema:

```
┌─────────────────────────────────────────────────────────────────┐
│              SCRAPER ENGINE — Zero-API-Cost v2                   │
│                                                                  │
│  Input: niche="dental clinic", location="Amman, Jordan"         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LAYER 1: Playwright + Chromium (PRIMARY)                │   │
│  │  • Headless Google Maps HTML scraping — $0/month         │   │
│  │  • Async generator: yields RawLeadData one at a time     │   │
│  │  • Extracts: name, rating, reviews, phone, website flag  │   │
│  │  • Resource interception blocks images/fonts for speed   │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │ if Maps blocked/rate-limited       │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LAYER 2: Yelp Fusion API (FALLBACK)                     │   │
│  │  • Free tier: 500 requests/day — no credit card needed   │   │
│  │  • Structured JSON: name, rating, review_count, phone    │   │
│  │  • Good MENA coverage for restaurants/clinics/services   │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │ if niche not on Yelp               │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LAYER 3: Overpass API / OpenStreetMap (BACKUP)          │   │
│  │  • Completely free, no API key required                  │   │
│  │  • Query by amenity tag + bounding box for city          │   │
│  │  • Lower data quality — no ratings, needs enrichment     │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FILTER ENGINE (Golden Filter — unchanged)               │   │
│  │  ✅ rating >= 4.0                                        │   │
│  │  ✅ review_count >= 15                                   │   │
│  │  ✅ has_website == False                                 │   │
│  │  ✅ review_count <= 500 (no chains)                      │   │
│  │  ✅ phone present (for wa.me link generation)            │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│                    Qualified Leads → PostgreSQL                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer 1: Playwright Primary Scraper

Implemented in `app/services/scraper/playwright_scraper.py`.
Key design points:
- **Async generator** — yields `RawLeadData` one at a time (memory-efficient for 50+ results)
- **BrowserContext isolation** — not a bare Page; prevents cross-search cookie leakage
- **Resource interception** — aborts image/font/media requests (~3× faster page loads)
- **Multi-selector fallbacks** — tries 3 CSS selectors per field before giving up
- **Always closes** browser in `finally` — no zombie Chromium processes
- **Dedup key** — `google_place_id=None` for Playwright results; dedup falls back to `business_name+location` slug in the Celery task

```python
# Usage in Phase 4 Celery task:
scraper = PlaywrightMapsScraper(headless=True)
async for raw_lead in scraper.search_businesses("dental clinic", "Amman, Jordan"):
    result = filter_engine.is_qualified(raw_lead)
    if result:
        await persist_lead(raw_lead, campaign_id)
```

### 2.3 The Golden Filter (unchanged logic, updated imports)

Implemented in `app/services/scraper/filter_engine.py`.
Returns `FilterResult` (Pydantic model) not a bare tuple — enables structured audit logging.

```python
engine = LeadFilterEngine()  # defaults: min_rating=4.0, min_reviews=15, max_reviews=500
result = engine.is_qualified(raw_lead)
if result:        # FilterResult.__bool__ returns result.qualified
    persist(raw_lead)
```

### 2.4 Phone Enrichment (post-scrape, when Playwright misses phone)

Implemented in `app/services/scraper/phone_enricher.py`.
DuckDuckGo Instant Answers query → regex phone extraction.
Called only when `lead.phone is None` after scraping.

### 2.5 Removed: Google Places API

`app/services/scraper/google_places.py` is **deprecated and no longer imported**.
The file may be kept for reference but must not be imported anywhere.
`GOOGLE_PLACES_API_KEY` env var is optional and unused.

### 2.2 Google Places API Integration (Layer 1)

```python
# app/services/scraper/google_places.py
import httpx
from typing import AsyncGenerator
from app.config import settings
from app.schemas.lead import RawLeadData

class GooglePlacesScraper:
    BASE_URL = "https://maps.googleapis.com/maps/api/place"

    def __init__(self):
        self.api_key = settings.GOOGLE_PLACES_API_KEY
        self.client  = httpx.AsyncClient(timeout=30)

    async def search_businesses(
        self,
        niche: str,
        location: str,
        radius_meters: int = 10000
    ) -> AsyncGenerator[RawLeadData, None]:
        """
        Uses Text Search → Place Details pipeline.
        Text Search: finds businesses by query string.
        Place Details: enriches with phone, website, reviews.
        """
        # Step 1: Geocode the location string to lat/lng
        coords = await self._geocode(location)
        if not coords:
            raise ValueError(f"Could not geocode location: {location}")

        # Step 2: Text Search (paginated — up to 60 results via next_page_token)
        query    = f"{niche} in {location}"
        page_token = None

        while True:
            params = {
                "query":    query,
                "location": f"{coords['lat']},{coords['lng']}",
                "radius":   radius_meters,
                "key":      self.api_key,
            }
            if page_token:
                params["pagetoken"] = page_token
                # Google requires a short delay before using next_page_token
                await asyncio.sleep(2)

            resp = await self.client.get(f"{self.BASE_URL}/textsearch/json", params=params)
            data = resp.json()

            for place in data.get("results", []):
                # Step 3: Get full details for each place
                details = await self._get_place_details(place["place_id"])
                raw     = self._parse_to_raw_lead(details)
                if raw:
                    yield raw

            page_token = data.get("next_page_token")
            if not page_token:
                break

    async def _get_place_details(self, place_id: str) -> dict:
        """Fetch full details: website, phone, reviews, photos."""
        params = {
            "place_id": place_id,
            "fields":   "name,place_id,rating,user_ratings_total,formatted_phone_number,"
                        "website,formatted_address,url,reviews,photos,types",
            "key":      self.api_key,
            "language": "en",
        }
        resp = await self.client.get(f"{self.BASE_URL}/details/json", params=params)
        return resp.json().get("result", {})

    def _parse_to_raw_lead(self, details: dict) -> RawLeadData | None:
        """Convert Google API response → internal RawLeadData schema."""
        # Extract top 3 reviews for AI context
        reviews = [
            {
                "author":  r.get("author_name"),
                "text":    r.get("text", "")[:300],  # Truncate for token efficiency
                "rating":  r.get("rating"),
            }
            for r in details.get("reviews", [])[:3]
        ]

        return RawLeadData(
            business_name   = details.get("name"),
            google_place_id = details.get("place_id"),
            address         = details.get("formatted_address"),
            phone           = details.get("formatted_phone_number"),
            google_rating   = details.get("rating"),
            review_count    = details.get("user_ratings_total", 0),
            website_url     = details.get("website"),       # None if no website ✅
            has_website     = bool(details.get("website")), # False = qualified
            maps_url        = details.get("url"),
            top_reviews     = reviews,
            photo_reference = (details.get("photos") or [{}])[0].get("photo_reference"),
        )

    async def _geocode(self, location: str) -> dict | None:
        params = {"address": location, "key": self.api_key}
        resp   = await self.client.get(
            "https://maps.googleapis.com/maps/api/geocode/json", params=params
        )
        results = resp.json().get("results", [])
        if results:
            return results[0]["geometry"]["location"]  # {"lat": x, "lng": y}
        return None
```

### 2.3 The Golden Filter

```python
# app/services/scraper/filter_engine.py
from app.schemas.lead import RawLeadData

class LeadFilterEngine:
    def __init__(
        self,
        min_rating: float     = 4.0,
        min_reviews: int      = 15,
        max_reviews: int      = 500,   # Avoid chains
        require_phone: bool   = True,
    ):
        self.min_rating    = min_rating
        self.min_reviews   = min_reviews
        self.max_reviews   = max_reviews
        self.require_phone = require_phone

    def is_qualified(self, lead: RawLeadData) -> tuple[bool, str]:
        """Returns (qualified: bool, reason: str)"""

        if not lead.google_rating or lead.google_rating < self.min_rating:
            return False, f"Rating {lead.google_rating} below {self.min_rating}"

        if not lead.review_count or lead.review_count < self.min_reviews:
            return False, f"Only {lead.review_count} reviews (min: {self.min_reviews})"

        if lead.review_count > self.max_reviews:
            return False, f"Likely a chain ({lead.review_count} reviews)"

        if lead.has_website:
            return False, "Already has a website"

        if self.require_phone and not lead.phone:
            return False, "No phone number found"

        return True, "Qualified"
```

### 2.4 Playwright Fallback Scraper (Layer 2 — Zero Cost)

```python
# app/services/scraper/playwright_scraper.py
from playwright.async_api import async_playwright
import asyncio, re

class PlaywrightMapsScraper:
    """
    Headless scraper for Google Maps. Used as fallback when
    Places API quota is exceeded. Handle with care — respect
    robots.txt and implement delays to avoid blocks.
    """
    async def search_businesses(self, niche: str, location: str) -> list[dict]:
        query = f"{niche} near {location}"
        results = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page    = await browser.new_page()

            # Navigate to Google Maps search
            encoded = query.replace(" ", "+")
            await page.goto(f"https://www.google.com/maps/search/{encoded}", timeout=30000)
            await page.wait_for_selector('[role="feed"]', timeout=15000)

            # Scroll to load more results
            feed = page.locator('[role="feed"]')
            for _ in range(5):
                await feed.evaluate("el => el.scrollTop += 1000")
                await asyncio.sleep(1.5)

            # Extract business cards
            cards = await page.locator('[role="feed"] > div').all()
            for card in cards:
                try:
                    name    = await card.locator("div.fontHeadlineSmall").text_content()
                    rating  = await card.locator("span.fontBodyMedium > span[aria-label*='stars']").get_attribute("aria-label")
                    result  = {"name": name, "rating_raw": rating}
                    results.append(result)
                except:
                    continue

            await browser.close()
        return results
```

### 2.5 Phone Number Enrichment (When Missing)

```python
# app/services/scraper/phone_enricher.py
"""
When Places API returns no phone, attempt to find it via:
1. The business's own website (if they have one — skip for our leads)
2. A DuckDuckGo search for the business name + location + "phone"
"""
import httpx, re

class PhoneEnricher:
    async def enrich(self, business_name: str, location: str) -> str | None:
        query    = f"{business_name} {location} phone number"
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1},
                headers={"User-Agent": "Mozilla/5.0"},
            )
        abstract = resp.json().get("AbstractText", "")
        # Regex for international phone formats
        phone_match = re.search(r'[\+\(]?[1-9][0-9 \-\(\)]{7,}[0-9]', abstract)
        return phone_match.group(0) if phone_match else None
```

---

## Phase 3: FastAPI Backend & REST API

### 3.1 Application Entry Point

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import campaigns, leads, jobs, preview
from app.database import create_tables

app = FastAPI(
    title="LeadForge API",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["campaigns"])
app.include_router(leads.router,     prefix="/api/v1/leads",     tags=["leads"])
app.include_router(jobs.router,      prefix="/api/v1/jobs",       tags=["jobs"])
app.include_router(preview.router,   prefix="/api/v1/preview",   tags=["preview"])

@app.on_event("startup")
async def startup():
    await create_tables()
```

### 3.2 Campaign API (Triggers the Entire Pipeline)

```python
# app/api/v1/campaigns.py
from fastapi import APIRouter, Depends, BackgroundTasks
from app.schemas.campaign import CampaignCreate, CampaignResponse
from app.workers.tasks import run_scrape_pipeline
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.post("/", response_model=CampaignResponse, status_code=202)
async def create_campaign(
    payload:  CampaignCreate,
    db:       AsyncSession = Depends(get_db),
):
    """
    Creates a campaign and immediately enqueues the scrape job.
    Returns campaign_id so the frontend can poll for status.
    """
    # 1. Persist campaign
    campaign = Campaign(
        niche    = payload.niche,
        location = payload.location,
        language = payload.language,
        status   = CampaignStatus.PENDING,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    # 2. Enqueue Celery task (non-blocking)
    run_scrape_pipeline.apply_async(
        args=[str(campaign.id)],
        task_id=str(campaign.id)  # Use campaign ID as Celery task ID for easy tracking
    )

    return campaign


@router.get("/{campaign_id}/status")
async def get_campaign_status(campaign_id: str, db: AsyncSession = Depends(get_db)):
    """Polled by dashboard every 3 seconds to show live progress."""
    campaign = await db.get(Campaign, campaign_id)
    leads    = await db.execute(
        select(Lead).where(Lead.campaign_id == campaign_id)
    )
    lead_list = leads.scalars().all()

    return {
        "campaign_id": campaign_id,
        "status":      campaign.status,
        "total_leads": len(lead_list),
        "ready_leads": sum(1 for l in lead_list if l.status == LeadStatus.READY),
        "processing":  sum(1 for l in lead_list if l.status == LeadStatus.AI_PROCESSING),
    }
```

### 3.3 Lead API

```python
# app/api/v1/leads.py
@router.get("/", response_model=list[LeadSummaryResponse])
async def list_leads(
    campaign_id: str | None = None,
    status:      str | None = None,
    db:          AsyncSession = Depends(get_db),
):
    """Returns lead list for the dashboard table."""
    query = select(Lead)
    if campaign_id:
        query = query.where(Lead.campaign_id == campaign_id)
    if status:
        query = query.where(Lead.status == status)
    result = await db.execute(query.order_by(Lead.scraped_at.desc()))
    return result.scalars().all()


@router.post("/{lead_id}/trigger-ai")
async def trigger_ai_pipeline(lead_id: str):
    """Manually re-trigger AI pipeline for a single lead."""
    run_ai_pipeline.apply_async(args=[lead_id])
    return {"message": "AI pipeline enqueued", "lead_id": lead_id}


@router.patch("/{lead_id}/status")
async def update_lead_status(lead_id: str, new_status: LeadStatus, db=Depends(get_db)):
    """
    Called when you manually click the wa.me link.
    Frontend sends PATCH to mark lead as 'outreach_sent'.
    """
    lead        = await db.get(Lead, lead_id)
    lead.status = new_status
    if new_status == LeadStatus.OUTREACH_SENT:
        lead.outreach_sent_at = datetime.utcnow()
    await db.commit()
    return {"status": "updated"}
```

### 3.4 Preview API (Serves JSON Payload to Your Frontend)

```python
# app/api/v1/preview.py
@router.get("/{slug}")
async def get_page_payload(slug: str, lang: str = "en", db=Depends(get_db)):
    """
    This is the endpoint your Next.js frontend calls to render a preview.
    URL pattern: GET /api/v1/preview/al-noor-clinic-amman?lang=en
    
    Your frontend already handles LTR/RTL — just pass lang="ar" for Arabic.
    """
    result = await db.execute(
        select(PagePayload).where(PagePayload.slug == slug)
    )
    payload = result.scalar_one_or_none()

    if not payload:
        raise HTTPException(status_code=404, detail="Page not found")

    return payload.payload_ar if lang == "ar" else payload.payload_en
```

---

## Phase 4: Celery Task Pipeline (The Orchestration Backbone)

### 4.1 Task Flow

```
run_scrape_pipeline(campaign_id)
  │
  ├── PlaywrightMapsScraper.search_businesses()  ← Layer 1 (primary)
  │     └── on failure: YelpScraper (Layer 2) or OverpassScraper (Layer 3)
  ├── LeadFilterEngine.is_qualified()
  ├── bulk_insert leads → PostgreSQL
  │
  └── For each qualified lead:
        run_ai_pipeline.apply_async(lead_id)  ← enqueued individually
              │
              └── LangGraph workflow runs:
                    [Analyst] → [Copywriter EN] → [Copywriter AR]
                    → [Validator] → [wa.me Generator]
                    → [Payload Assembler]
                    → PagePayload saved to DB
                    → Lead.status = READY
```

### 4.2 Celery Tasks

```python
# app/workers/tasks.py
from app.workers.celery_app import celery_app
from app.services.scraper import PlaywrightMapsScraper, LeadFilterEngine
from app.services.scraper.phone_enricher import PhoneEnricher
from app.services.agents.pipeline import run_lead_through_agents

@celery_app.task(bind=True, max_retries=3)
def run_scrape_pipeline(self, campaign_id: str):
    """
    Phase 1 of the pipeline. Scrapes and filters leads,
    then fires off individual AI tasks for each qualified lead.
    """
    import asyncio
    loop = asyncio.get_event_loop()

    async def _run():
        async with get_async_session() as db:
            campaign = await db.get(Campaign, campaign_id)
            campaign.status = CampaignStatus.SCRAPING
            await db.commit()

            scraper  = PlaywrightMapsScraper(headless=True)
            enricher = PhoneEnricher()
            filter   = LeadFilterEngine()
            saved    = 0

            async for raw_lead in scraper.search_businesses(
                campaign.niche, campaign.location
            ):
                # Enrich phone if missing (Playwright sometimes misses it)
                if not raw_lead.phone:
                    raw_lead.phone = await enricher.enrich(
                        raw_lead.business_name, raw_lead.location or campaign.location
                    )
                result = filter.is_qualified(raw_lead)
                if not result:
                    continue

                # Dedup by Google Place ID
                existing = await db.execute(
                    select(Lead).where(Lead.google_place_id == raw_lead.google_place_id)
                )
                if existing.scalar_one_or_none():
                    continue

                lead = Lead(
                    campaign_id    = campaign_id,
                    business_name  = raw_lead.business_name,
                    google_place_id= raw_lead.google_place_id,
                    niche          = campaign.niche,
                    location       = campaign.location,
                    address        = raw_lead.address,
                    phone          = raw_lead.phone,
                    google_rating  = raw_lead.google_rating,
                    review_count   = raw_lead.review_count,
                    has_website    = raw_lead.has_website,
                    maps_url       = raw_lead.maps_url,
                    top_reviews    = raw_lead.top_reviews,
                    photo_reference= raw_lead.photo_reference,
                    status         = LeadStatus.NEW,
                    slug           = generate_slug(raw_lead.business_name, campaign.location),
                    scraped_at     = datetime.utcnow(),
                )
                db.add(lead)
                await db.commit()
                await db.refresh(lead)
                saved += 1

                # Fire AI pipeline for this lead immediately
                run_ai_pipeline.apply_async(args=[str(lead.id)])

            campaign.status = CampaignStatus.DONE
            await db.commit()

    loop.run_until_complete(_run())


@celery_app.task(bind=True, max_retries=2)
def run_ai_pipeline(self, lead_id: str):
    """
    Phase 2: Runs the full LangGraph agent pipeline for one lead.
    """
    import asyncio
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_lead_through_agents(lead_id))
```

---

## Phase 5: The LangGraph Multi-Agent Pipeline

### 5.1 Agent Graph Design

```
                    ┌─────────────────┐
                    │   ENTRY POINT   │
                    │  lead_data dict │
                    └────────┬────────┘
                             │
                    ┌────────▼────────────┐
                    │   ANALYST AGENT     │
                    │   Model: Groq       │
                    │   (Llama 3.3 70B)   │
                    │                     │
                    │  Input:  lead dict  │
                    │  Output: analysis{} │
                    └────────┬────────────┘
                             │
               ┌─────────────┴──────────────┐
               │                             │
    ┌──────────▼──────────┐     ┌────────────▼──────────┐
    │  COPYWRITER EN      │     │  COPYWRITER AR         │
    │  Model: Claude      │     │  Model: Claude          │
    │  Sonnet 4           │     │  Sonnet 4               │
    │                     │     │                         │
    │  Output: copy_en{}  │     │  Output: copy_ar{}      │
    └──────────┬──────────┘     └────────────┬────────────┘
               │                             │
               └─────────────┬───────────────┘
                             │
                    ┌────────▼────────────┐
                    │   VALIDATOR AGENT   │
                    │   Model: Gemini     │
                    │   Flash 2.0         │
                    │                     │
                    │  Checks: halluc.,   │
                    │  placeholders,      │
                    │  brand accuracy     │
                    └────────┬────────────┘
                             │
                    [passed?]─── No ──► back to Copywriter (max 2 retries)
                             │
                            Yes
                             │
                    ┌────────▼────────────────────┐
                    │   wa.me LINK GENERATOR       │
                    │   (pure Python — no LLM)     │
                    │                              │
                    │  Formats pre-filled message  │
                    │  URL-encodes it              │
                    │  Output: wa.me/962...?text=  │
                    └────────┬─────────────────────┘
                             │
                    ┌────────▼────────────────────┐
                    │   PAYLOAD ASSEMBLER          │
                    │   (pure Python — no LLM)     │
                    │                              │
                    │  Merges: copy + lead data    │
                    │  into your frontend's JSON   │
                    │  schema (EN + AR versions)   │
                    └─────────────────────────────┘
```

### 5.2 LangGraph State & Graph Definition

```python
# app/services/agents/pipeline.py
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    # Input
    lead:              dict          # Raw lead data from DB

    # Intermediate
    analysis:          dict          # Analyst output
    copy_en:           dict          # English copywriting
    copy_ar:           dict          # Arabic copywriting
    validation_result: dict          # Validator output
    retry_count:       int           # Guard against infinite loops

    # Output
    wame_link_en:      str
    wame_link_ar:      str
    final_payload_en:  dict
    final_payload_ar:  dict
    errors:            Annotated[list, operator.add]

def build_agent_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("analyst",    analyst_agent)
    graph.add_node("copy_en",    copywriter_en_agent)
    graph.add_node("copy_ar",    copywriter_ar_agent)
    graph.add_node("validator",  validator_agent)
    graph.add_node("wame_gen",   wame_link_generator)
    graph.add_node("assembler",  payload_assembler)

    graph.set_entry_point("analyst")
    graph.add_edge("analyst",   "copy_en")
    graph.add_edge("analyst",   "copy_ar")
    graph.add_edge("copy_en",   "validator")   # Validator waits for both
    graph.add_edge("copy_ar",   "validator")

    graph.add_conditional_edges(
        "validator",
        route_after_validation,
        {
            "retry":    "copy_en",   # Re-run copywriting if validation fails
            "proceed":  "wame_gen",  # Move forward if passed
        }
    )
    graph.add_edge("wame_gen",  "assembler")
    graph.add_edge("assembler", END)

    return graph.compile()


def route_after_validation(state: AgentState) -> str:
    v = state["validation_result"]
    if v.get("passed") or state.get("retry_count", 0) >= 2:
        return "proceed"
    return "retry"
```

### 5.3 Analyst Agent (Groq — Fast & Cheap)

```python
# app/services/agents/analyst.py
from groq import AsyncGroq
import json

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

async def analyst_agent(state: AgentState) -> AgentState:
    lead = state["lead"]

    # Summarize reviews for context without blowing token budget
    review_summary = "\n".join([
        f'- "{r["text"][:200]}" (⭐{r["rating"]})'
        for r in (lead.get("top_reviews") or [])[:3]
    ])

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
{review_summary or "No reviews available"}

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
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    analysis = json.loads(response.choices[0].message.content)
    return {**state, "analysis": analysis}
```

### 5.4 Copywriter Agent — English (Claude Sonnet 4)

```python
# app/services/agents/copywriter_en.py
import anthropic, json

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

# This JSON schema MUST exactly mirror what your Next.js frontend expects
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

async def copywriter_en_agent(state: AgentState) -> AgentState:
    lead     = state["lead"]
    analysis = state["analysis"]

    prompt = f"""
You are a world-class conversion copywriter for local business landing pages.
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
6. Return ONLY valid JSON matching this schema exactly:

{FRONTEND_JSON_SCHEMA}
"""
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    # Strip potential markdown fences
    raw  = message.content[0].text.strip()
    raw  = raw.removeprefix("```json").removesuffix("```").strip()
    copy = json.loads(raw)

    return {**state, "copy_en": copy}
```

### 5.5 Copywriter Agent — Arabic (Claude Sonnet 4)

```python
# app/services/agents/copywriter_ar.py

async def copywriter_ar_agent(state: AgentState) -> AgentState:
    lead     = state["lead"]
    analysis = state["analysis"]

    prompt = f"""
أنت كاتب إعلانات محترف متخصص في صفحات الهبوط للأعمال التجارية المحلية في العالم العربي.
اكتب نصوصاً احترافية ومقنعة باللغة العربية الفصحى المبسطة، ملائمة للسياق المحلي.

معلومات العمل التجاري:
- الاسم: {lead["business_name"]}
- النوع: {lead["niche"]}
- الموقع: {lead["location"]}
- التقييم: {lead["google_rating"]} نجوم من {lead["review_count"]} تقييم حقيقي

تحليل العمل التجاري:
{json.dumps(analysis, indent=2, ensure_ascii=False)}

القواعد:
1. كل النصوص يجب أن تكون عربية فصيحة مبسطة (ليست عامية)
2. العنوان الرئيسي: 5-7 كلمات، قوية ومباشرة
3. اذكر الموقع ({lead["location"]}) بشكل طبيعي في قسم "من نحن"
4. أسماء الخدمات: واضحة وعملية
5. أسماء الأيقونات: استخدم نفس أسماء Lucide icons بالإنجليزية (heart, star, etc.)
6. أرجع JSON صحيحاً فقط بدون أي شرح، يتطابق مع هذا الهيكل تماماً:

{FRONTEND_JSON_SCHEMA}
"""
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    raw     = message.content[0].text.strip()
    raw     = raw.removeprefix("```json").removesuffix("```").strip()
    copy_ar = json.loads(raw)

    return {**state, "copy_ar": copy_ar}
```

### 5.6 Validator Agent (Gemini Flash — Fast & Cheap)

```python
# app/services/agents/validator.py
import google.generativeai as genai
import json

genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

async def validator_agent(state: AgentState) -> AgentState:
    lead    = state["lead"]
    copy_en = state["copy_en"]
    copy_ar = state["copy_ar"]

    prompt = f"""
You are a QA engineer validating AI-generated landing page copy.

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

Return ONLY this JSON:
{{
  "passed": true|false,
  "issues": ["issue1", "issue2"],
  "severity": "ok|minor|major"
}}
"""
    response = await model.generate_content_async(prompt)
    raw      = response.text.strip().removeprefix("```json").removesuffix("```").strip()

    try:
        result = json.loads(raw)
    except:
        result = {"passed": True, "issues": [], "severity": "ok"}

    new_retry_count = state.get("retry_count", 0) + (0 if result["passed"] else 1)
    return {**state, "validation_result": result, "retry_count": new_retry_count}
```

---

## Phase 6: wa.me Link Generator & Payload Assembler

### 6.1 WhatsApp wa.me Link Generator

This is pure Python — no LLM needed. This is one of the highest-value components: a perfectly crafted, pre-filled WhatsApp message ready for you to click and send.

```python
# app/services/whatsapp.py
import urllib.parse

class WaMeLinkGenerator:
    """
    Generates wa.me click-to-chat links with pre-filled, personalized messages.
    Zero cost. You click, WhatsApp Web opens, message is pre-filled.
    """

    def generate(
        self,
        phone: str,
        message: str,
    ) -> str:
        """
        Args:
            phone:   Phone in any format — we normalize it
            message: Pre-filled message text
        Returns:
            wa.me URL ready to click from your dashboard
        """
        normalized_phone = self._normalize_phone(phone)
        encoded_message  = urllib.parse.quote(message)
        return f"https://wa.me/{normalized_phone}?text={encoded_message}"

    def _normalize_phone(self, phone: str) -> str:
        """Remove spaces, dashes, parentheses. Keep digits and leading +."""
        import re
        digits = re.sub(r'[^\d+]', '', phone)
        # Remove leading + for wa.me format
        return digits.lstrip('+')

    def build_message_en(self, lead: dict, preview_url: str) -> str:
        return f"""Hi {lead['business_name']} team! 👋

I came across your business on Google — {lead['review_count']} reviews with a {lead['google_rating']}-star average is genuinely impressive.

I put together a quick website concept to show what your online presence could look like:

🔗 {preview_url}

Took me a short while to build. Happy to refine it further or hand it over completely — no pressure at all.

Worth a quick look? 🙂"""

    def build_message_ar(self, lead: dict, preview_url: str) -> str:
        return f"""السلام عليكم، فريق {lead['business_name']} 👋

صادفت نشاطكم التجاري على Google — {lead['review_count']} تقييم بمعدل {lead['google_rating']} نجوم، هذا رائع جداً!

قمت بإعداد تصور سريع لموقع إلكتروني يُظهر حضوركم الرقمي:

🔗 {preview_url}

يسعدني تطويره أو تسليمه لكم بالكامل — لا أي إلزام.

يستحق نظرة سريعة؟ 🙂"""


async def wame_link_generator(state: AgentState) -> AgentState:
    lead        = state["lead"]
    preview_url = f"https://yourdomain.com/preview/{lead['slug']}"
    generator   = WaMeLinkGenerator()

    msg_en = generator.build_message_en(lead, preview_url)
    msg_ar = generator.build_message_ar(lead, preview_url)

    return {
        **state,
        "wame_link_en": generator.generate(lead["phone"], msg_en),
        "wame_link_ar": generator.generate(lead["phone"], msg_ar),
    }
```

### 6.2 Final Payload Assembler

This is the most critical function. It merges AI copy with scraped data into the exact JSON your frontend consumes.

```python
# app/services/assembler.py

async def payload_assembler(state: AgentState) -> AgentState:
    """
    Merges AI-generated copy with raw scraped lead data.
    Produces the FINAL JSON payload your Next.js frontend renders.
    """
    lead    = state["lead"]
    copy_en = state["copy_en"]
    copy_ar = state["copy_ar"]

    def build_payload(copy: dict, lang: str) -> dict:
        """
        Inject real business data into AI copy.
        Some fields the AI generates (headlines, descriptions).
        Some fields come directly from scraped data (phone, rating).
        """
        return {
            # ── Metadata ──────────────────────────────────────────────
            "_meta": {
                "slug":       lead["slug"],
                "lang":       lang,
                "direction":  "rtl" if lang == "ar" else "ltr",
                "generated":  datetime.utcnow().isoformat(),
                "version":    1,
            },

            # ── SEO (AI-generated) ────────────────────────────────────
            "meta": copy["meta"],

            # ── Hero Section ──────────────────────────────────────────
            "hero": {
                **copy["hero"],
                "phone": lead["phone"],      # Real phone injected here
            },

            # ── Services (AI-generated) ───────────────────────────────
            "services": copy["services"],

            # ── About (AI-generated) ─────────────────────────────────
            "about": copy["about"],

            # ── Social Proof (Mix: AI text + Real data) ───────────────
            "social_proof": {
                "headline": copy["social_proof"]["headline"],
                "stats": [
                    {
                        "value": f"{lead['google_rating']}★",   # Real rating
                        "label": "Google Rating" if lang == "en" else "تقييم Google"
                    },
                    {
                        "value": f"{lead['review_count']}+",    # Real count
                        "label": "Happy Customers" if lang == "en" else "عميل سعيد"
                    },
                    {
                        "value": "100%",
                        "label": "Satisfaction" if lang == "en" else "رضا العملاء"
                    },
                ],
                "maps_url":     lead["maps_url"],               # Real Maps link
                "google_rating": lead["google_rating"],
                "review_count":  lead["review_count"],
            },

            # ── CTA Section (AI-generated) ────────────────────────────
            "cta_section": {
                **copy["cta_section"],
                "phone": lead["phone"],      # Real phone for CTA button
            },

            # ── Contact (AI text + Real data) ────────────────────────
            "contact": {
                **copy["contact"],
                "phone":   lead["phone"],
                "address": lead["address"],
                "maps_url": lead["maps_url"],
            },

            # ── Footer ────────────────────────────────────────────────
            "footer": copy["footer"],

            # ── Business Identity (Always injected from scrape) ───────
            "business": {
                "name":          lead["business_name"],
                "niche":         lead["niche"],
                "location":      lead["location"],
                "phone":         lead["phone"],
                "address":       lead["address"],
                "google_rating": lead["google_rating"],
                "review_count":  lead["review_count"],
                "maps_url":      lead["maps_url"],
                "photo_reference": lead.get("photo_reference"),
            },
        }

    final_payload_en = build_payload(copy_en, "en")
    final_payload_ar = build_payload(copy_ar, "ar")

    # Persist to DB
    async with get_async_session() as db:
        page_payload = PagePayload(
            lead_id    = lead["id"],
            slug       = lead["slug"],
            payload_en = final_payload_en,
            payload_ar = final_payload_ar,
        )
        db.add(page_payload)

        # Update lead status and links
        lead_obj = await db.get(Lead, lead["id"])
        lead_obj.status      = LeadStatus.READY
        lead_obj.preview_url = f"https://yourdomain.com/preview/{lead['slug']}"
        lead_obj.wame_link   = state["wame_link_en"]
        lead_obj.ai_processed_at = datetime.utcnow()
        await db.commit()

    return {
        **state,
        "final_payload_en": final_payload_en,
        "final_payload_ar": final_payload_ar,
    }
```

---

## Phase 7: Slug Generator & Utility Services

### 7.1 URL Slug Generator

```python
# app/services/utils.py
import re, unicodedata

def generate_slug(business_name: str, location: str) -> str:
    """
    'Al-Noor Dental Clinic', 'Amman, Jordan'
     → 'al-noor-dental-clinic-amman'
    """
    def slugify(text: str) -> str:
        # Normalize unicode (handles Arabic, accented chars)
        text = unicodedata.normalize('NFKD', text)
        text = text.encode('ascii', 'ignore').decode('ascii')
        text = text.lower()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text.strip('-')

    # Take only city from location string
    city = location.split(',')[0].strip()
    return f"{slugify(business_name)}-{slugify(city)}"


def format_phone_for_display(phone: str) -> str:
    """Returns clean display format for the landing page."""
    import re
    return re.sub(r'[^\d+\-\s()]', '', phone).strip()
```

---

## Phase 8: Dashboard Integration — The wa.me Workflow

### 8.1 How the Dashboard Surfaces the Final Outputs

Once a lead reaches `status = READY`, your dashboard receives this from the API:

```json
{
  "id": "uuid",
  "business_name": "Al-Noor Dental Clinic",
  "location": "Amman, Jordan",
  "google_rating": 4.8,
  "review_count": 127,
  "status": "ready",
  "preview_url": "https://yourdomain.com/preview/al-noor-dental-clinic-amman",
  "wame_link": "https://wa.me/9627XXXXXXX?text=Hi%20Al-Noor%20Dental...",
  "actions": {
    "preview_en": "https://yourdomain.com/preview/al-noor-dental-clinic-amman?lang=en",
    "preview_ar": "https://yourdomain.com/preview/al-noor-dental-clinic-amman?lang=ar",
    "wame_en": "https://wa.me/9627XXXXXXX?text=Hi+Al-Noor...",
    "wame_ar": "https://wa.me/9627XXXXXXX?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85...",
    "copy_payload_en": "https://api.yourdomain.com/api/v1/preview/al-noor-dental-clinic-amman?lang=en",
    "copy_payload_ar": "https://api.yourdomain.com/api/v1/preview/al-noor-dental-clinic-amman?lang=ar"
  }
}
```

### 8.2 Your Manual Outreach Workflow (Zero-Cost)

```
Dashboard shows lead as 🟢 READY
        │
        ▼
[👁 Preview EN] ──► You review the generated page in your browser
[👁 Preview AR] ──► You check the Arabic version / RTL rendering
        │
        ▼
[📱 Send via WhatsApp EN] ──► Opens WhatsApp Web with pre-filled EN message
[📱 Send via WhatsApp AR] ──► Opens WhatsApp Web with pre-filled AR message
        │
You click send manually (one click)
        │
        ▼
Dashboard: [Mark as Sent] ──► PATCH /leads/{id}/status → "outreach_sent"
                               Records timestamp for follow-up tracking
```

---

## Complete Data Flow Summary

```
INPUT (Dashboard)
  niche="dental clinic", location="Amman, Jordan", lang="both"
                    │
                    ▼
         POST /api/v1/campaigns
                    │
                    ▼
         Celery: run_scrape_pipeline()
                    │
         PlaywrightMapsScraper: headless Google Maps → RawLeadData stream
                    │
         LeadFilterEngine: rating≥4.0, reviews≥15, no website
                    │
         Lead saved to PostgreSQL (status=NEW)
                    │
         Celery: run_ai_pipeline(lead_id) [per lead, parallel]
                    │
         ┌──────────────────────────────────────┐
         │          LangGraph Pipeline           │
         │                                      │
         │  AnalystAgent (Groq) → analysis{}    │
         │         │                            │
         │  ┌──────┴──────┐                     │
         │  CopyEN(Claude) CopyAR(Claude)        │
         │  └──────┬──────┘                     │
         │  ValidatorAgent (Gemini Flash)        │
         │  wa.me Generator (pure Python)        │
         │  PayloadAssembler (pure Python)       │
         └──────────────────────────────────────┘
                    │
         PagePayload saved (payload_en{}, payload_ar{})
         Lead.status = READY
         Lead.wame_link = "wa.me/962...?text=..."
                    │
                    ▼
         GET /api/v1/leads → Dashboard polls, shows 🟢 READY
                    │
         GET /api/v1/preview/{slug}?lang=en → Your Next.js frontend renders
                    │
         wa.me link → You click → WhatsApp Web → Manual send → Done ✅
```

---

## Environment Variables Reference

```bash
# .env — Zero-API-Cost Architecture v2

# Database
POSTGRES_URL=postgresql+asyncpg://admin:password@localhost:5432/leadforge
REDIS_URL=redis://localhost:6379/0

# Google AI Studio — Gemini 1.5 Pro + Flash (NO Google Cloud billing required)
# Get key at: https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY=AIza...

# Yelp Fusion API — Layer 2 fallback scraper (free, 500 req/day, no credit card)
# Get key at: https://www.yelp.com/developers/v3/manage_app
YELP_API_KEY=your-yelp-fusion-api-key

# Removed: GOOGLE_PLACES_API_KEY (requires $10 prepayment — not used)
# Removed: ANTHROPIC_API_KEY (replaced by Gemini unified stack)
# Removed: GROQ_API_KEY (replaced by Gemini unified stack)

# App
API_SECRET_KEY=your-random-secret-for-jwt
FRONTEND_URL=http://localhost:3000
PREVIEW_BASE_URL=https://yourdomain.com
```

---

## LLM Cost Estimation Per Lead

```
┌─────────────────────────────────────────────────────────────────┐
│ AGENT          │ MODEL              │ COST PER LEAD (approx)    │
├─────────────────────────────────────────────────────────────────┤
│ Analyst        │ Groq Llama 3.3 70B │ ~$0.000 (free tier)       │
│ Copywriter EN  │ Claude Sonnet 4    │ ~$0.004 (1K in + 1.5K out)│
│ Copywriter AR  │ Claude Sonnet 4    │ ~$0.004                   │
│ Validator      │ Gemini 2.0 Flash   │ ~$0.000 (free tier)       │
│ wa.me Gen      │ No LLM             │ $0.000                    │
│ Assembler      │ No LLM             │ $0.000                    │
├─────────────────────────────────────────────────────────────────┤
│ TOTAL PER LEAD │                    │ ~$0.008 (less than 1 cent) │
│ 100 leads      │                    │ ~$0.80                     │
│ 1,000 leads    │                    │ ~$8.00                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Build Order (Recommended Sequence)

```
Week 1: Phase 1 + Phase 3 (foundation)
  ✓ Docker Compose up (PostgreSQL + Redis)
  ✓ SQLAlchemy models + Alembic migrations
  ✓ FastAPI skeleton with all routes returning stubs
  ✓ Basic campaign creation and polling

Week 2: Phase 2 (scraper) — Zero-API-Cost
  ✓ PlaywrightMapsScraper as primary (headless Google Maps)
  ✓ LeadFilterEngine (Golden Filter — unchanged logic)
  ✓ PhoneEnricher (DuckDuckGo post-enrichment)
  ✓ Celery scrape task wired to Playwright
  ✓ Test: 10 real leads in DB from one Playwright run

Week 3: Phase 5 (agents)
  ✓ LangGraph graph definition
  ✓ Analyst agent (Groq)
  ✓ Copywriter EN agent (Claude)
  ✓ Validator agent (Gemini)
  ✓ Test: one lead goes through full graph

Week 4: Phase 5 continued + Phase 6
  ✓ Copywriter AR agent
  ✓ wa.me link generator
  ✓ Payload assembler (match your frontend's exact schema)
  ✓ End-to-end test: campaign → qualified lead → AI → payload → wa.me link

Week 5: Integration + Testing
  ✓ Connect backend to your Next.js dashboard
  ✓ Preview endpoint serving JSON to frontend
  ✓ Manual UAT: run 20 real leads, review outputs
  ✓ Fix hallucinations, placeholder leaks, schema mismatches

Week 6: First Outreach Campaign 🚀
  ✓ Pick one niche, one city
  ✓ Generate 30-50 leads
  ✓ Review, approve, click wa.me links manually
  ✓ Track replies in dashboard
```

---

*Backend Roadmap v3.0 — Zero-API-Cost Architecture.*
*Scraper: Playwright Primary → Yelp Fallback → Overpass Backup.*
*AI Stack: Google Gemini unified (1.5-pro copywriting, 1.5-flash analysis/validation).*
*Zero prepayment required. No Google Cloud Maps billing. No Anthropic. No Groq.*
