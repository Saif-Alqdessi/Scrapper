# Apify Integration Plan — LeadForge B2B Pivot
**Architecture Migration: Playwright/BeautifulSoup → Apify `google-maps-scraper` API**

> **Status:** DRAFT — Awaiting explicit approval before any code changes.
> **Target Niche:** High-Ticket B2B — Real Estate Agencies (Investment & Debt Management System)

---

## 1. Architecture Overview

### Current State (Playwright — Local Headless Browser)

```
Celery Task (run_scrape_pipeline)
  └── PlaywrightMapsScraper.search_businesses(niche, location)
        ├── Launches headless Chromium inside Docker container
        ├── Navigates to maps.google.com
        ├── Scrolls feed (8 rounds × 1.5s = ~12s wait)
        ├── Parses 490 lines of fragile CSS selectors
        └── Yields RawLeadData one card at a time (async generator)
```

**Critical Problems:**
- IP-ban risk — scraping from a fixed VPS IP is flagged by Google
- Requires Chromium binary inside Docker → +500 MB image size
- Selector fragility — Google A/B tests class names constantly
- Slow: 12–30s for a single campaign, blocking Celery worker thread
- Playwright Docker setup requires `playwright install chromium` at image build time

### Target State (Apify API — Cloud Actor)

```
Celery Task (run_scrape_pipeline)
  └── ApifyMapsScraper.search_businesses(niche, location)
        ├── POST to Apify /acts/apify~google-maps-scraper/run-sync-get-dataset-items
        ├── Apify cloud handles browser, proxies, IP rotation
        ├── Returns clean structured JSON in seconds
        └── Maps JSON fields → RawLeadData (same contract as before)
```

**Key Benefits:**
- Zero IP-ban risk — Apify manages residential proxy rotation
- Docker image shrinks by ~500 MB (no Chromium needed)
- Returns structured JSON — no CSS selector maintenance ever again
- Returns `phone`, `website`, `totalScore`, `reviewsCount` directly
- Apify Free Tier: **$5/month free compute** → covers ~200–500 business lookups/month

---

## 2. Environment Variables

### 2.1 Root `.env` (Local Development)

Add the following line:

```dotenv
# ── Apify (Cloud Google Maps Scraper) ──────────────────────────────
# Get your token from: https://console.apify.com/account/integrations
APIFY_API_TOKEN=your_apify_api_token_here
```

### 2.2 Backend `backend/.env`

The same token must be mirrored in the backend env since the Celery worker reads from `app/config.py`:

```dotenv
APIFY_API_TOKEN=your_apify_api_token_here
```

### 2.3 `app/config.py` — Settings Update

Add one line to the `Settings` Pydantic model:

```python
APIFY_API_TOKEN: str = ""
```

### Execution Prompt

> **"Execute Phase 2: Environment Variables. Use the `sickn33/antigravity-awesome-skills` playbook for secure `.env` management to safely add the APIFY_API_TOKEN to both the root and backend `.env` files, as well as `app/config.py`. Once done, trigger `amElnagdy/guard-skills` to validate that no secrets have been hardcoded or exposed in tracked files."**

---

## 3. Dependency Management

### 3.1 Add `httpx` (Already Present ✅)

`httpx==0.28.1` is already in `requirements.txt` (used by `phone_enricher.py` for the DuckDuckGo calls). No change needed.

### 3.2 Remove Playwright & BeautifulSoup

After `playwright_scraper.py` is replaced and confirmed working, the following lines can be **removed** from `backend/requirements.txt`:

```diff
- playwright==1.49.1        # Headless browser fallback scraper
- beautifulsoup4==4.12.3
```

> **⚠️ Verification Required Before Removal:**
> Run `grep -r "beautifulsoup4\|BeautifulSoup\|from bs4" backend/` to confirm `beautifulsoup4` is not imported anywhere outside of the Playwright scraper. Current analysis shows it is NOT used anywhere else — safe to remove.
> Run `grep -r "from playwright\|import playwright" backend/` — only found in `playwright_scraper.py` and `test_scraper.py`. Safe to remove once replaced.

### 3.3 Dockerfile Update

Remove the Playwright browser install step from `backend/Dockerfile`:

```diff
- RUN playwright install chromium
- RUN playwright install-deps chromium
```

This alone reduces Docker image build time by ~2–3 minutes and image size by ~400–600 MB.

### Execution Prompt

> **"Execute Phase 3: Dependency Management. First, use `safishamsi/graphify` to verify all codebase imports and confirm `beautifulsoup4` and `playwright` are truly safe to remove. Then, use `amElnagdy/delegate-skills` to assign a background agent to update `requirements.txt` and strip the Playwright commands from the `Dockerfile`. Finally, run `amElnagdy/guard-skills` to validate the Dockerfile syntax and ensure the build will not break."**

---

## 4. Step-by-Step Refactoring Plan

### 4.1 Files to Create

| File | Action | Purpose |
|---|---|---|
| `backend/app/services/scraper/apify_scraper.py` | **CREATE** | Replaces `playwright_scraper.py` entirely |

### 4.2 Files to Modify

| File | Action | Change Description |
|---|---|---|
| `backend/app/workers/tasks.py` | **MODIFY** | Line 30: swap `PlaywrightMapsScraper` import → `ApifyMapsScraper` |
| `backend/app/services/scraper/__init__.py` | **MODIFY** | Line 2 & 5: update exported class name |
| `backend/app/config.py` | **MODIFY** | Add `APIFY_API_TOKEN: str = ""` field |
| `backend/requirements.txt` | **MODIFY** | Remove playwright + beautifulsoup4 |
| `backend/Dockerfile` | **MODIFY** | Remove playwright install steps |

### 4.3 Files to Retire (Keep for Rollback, then Delete)

| File | Action |
|---|---|
| `backend/app/services/scraper/playwright_scraper.py` | **RETIRE** → rename to `playwright_scraper.py.bak` during transition |
| `backend/test_scraper.py` | **UPDATE** — swap scraper class in test |

---

### 4.4 `ApifyMapsScraper` — Implementation Logic

The new scraper will be a **single async function** (no class needed). The core logic:

#### Apify Endpoint

```
POST https://api.apify.com/v2/acts/apify~google-maps-scraper/run-sync-get-dataset-items
     ?token=YOUR_APIFY_API_TOKEN
     &timeout=120
```

#### Request Body

```json
{
  "searchStringsArray": ["real estate agencies near Amman, Jordan"],
  "maxCrawledPlacesPerSearch": 40,
  "language": "en",
  "includeHistogram": false,
  "includeOpeningHours": false,
  "includePeopleAlsoSearch": false,
  "maxImages": 0,
  "maxReviews": 3,
  "exportPlaceUrls": true
}
```

#### httpx Async Implementation Sketch

```python
async def search_businesses(
    niche: str,
    location: str,
    max_results: int = 40,
) -> AsyncGenerator[RawLeadData, None]:
    query = f"{niche} near {location}"
    url   = (
        f"https://api.apify.com/v2/acts/apify~google-maps-scraper"
        f"/run-sync-get-dataset-items"
        f"?token={settings.APIFY_API_TOKEN}&timeout=120"
    )
    payload = {
        "searchStringsArray": [query],
        "maxCrawledPlacesPerSearch": max_results,
        "language": "en",
        "maxReviews": 3,
        "maxImages": 0,
    }
    async with httpx.AsyncClient(timeout=130.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        items: list[dict] = response.json()

    for item in items:
        raw = _map_apify_item(item, niche, location)
        if raw:
            yield raw
```

---

### 4.5 Apify JSON → `RawLeadData` Field Mapping

This is the core translation contract. Apify's actor returns the following fields:

| Apify Field | Type | Maps To `RawLeadData` Field | Notes |
|---|---|---|---|
| `title` | `str` | `business_name` | Required — reject if missing |
| `placeId` | `str` | `google_place_id` | Used for DB-level dedup |
| `totalScore` | `float` | `google_rating` | e.g. `4.7` |
| `reviewsCount` | `int` | `review_count` | e.g. `238` |
| `phone` | `str \| None` | `phone` | Already formatted. May be `None` |
| `address` | `str \| None` | `address` | Full formatted address |
| `website` | `str \| None` | `website_url` + `has_website` | If non-null → `has_website=True` |
| `url` | `str` | `maps_url` | Direct Google Maps listing URL |
| `imageUrl` | `str \| None` | `photo_reference` | Use as a direct image URL |
| `reviews[].text` | `str` | `top_reviews[].text` | Up to 3 reviews |
| `reviews[].stars` | `int` | `top_reviews[].rating` | |
| `reviews[].name` | `str` | `top_reviews[].author` | |
| `categories` | `list[str]` | (log only, not stored) | Useful for future niche auto-detection |

#### Python mapping function:

```python
def _map_apify_item(item: dict, niche: str, location: str) -> RawLeadData | None:
    name = item.get("title")
    if not name:
        return None

    website_url = item.get("website")
    has_website = bool(website_url)

    reviews_raw = item.get("reviews") or []
    top_reviews = [
        RawReview(
            author=r.get("name"),
            text=r.get("text"),
            rating=float(r.get("stars", 0)) if r.get("stars") else None,
        )
        for r in reviews_raw[:3]
    ]

    return RawLeadData(
        business_name   = name,
        google_place_id = item.get("placeId"),
        niche           = niche,
        location        = location,
        address         = item.get("address"),
        phone           = item.get("phone"),
        google_rating   = item.get("totalScore"),
        review_count    = item.get("reviewsCount", 0),
        has_website     = has_website,
        website_url     = website_url,
        maps_url        = item.get("url"),
        photo_reference = item.get("imageUrl"),
        top_reviews     = top_reviews,
        scraped_from    = "apify",
    )
```

> **Key Insight:** Because `RawLeadData` is the shared contract, **`LeadFilterEngine`, `tasks.py`, and the entire AI agent pipeline require ZERO changes.** Only the scraper layer is swapped.

---

### 4.6 `tasks.py` — Minimal Change Required

Only **two lines** change in `tasks.py`:

```diff
- from app.services.scraper.playwright_scraper import PlaywrightMapsScraper
+ from app.services.scraper.apify_scraper import ApifyMapsScraper

  # ...inside _scrape():
- scraper = PlaywrightMapsScraper(headless=True)
+ scraper = ApifyMapsScraper()
```

The `async for raw_lead in scraper.search_businesses(...)` call is **identical** — no changes needed downstream.

---

### 4.7 `scraper/__init__.py` — Update Export

```diff
- from .playwright_scraper import PlaywrightMapsScraper
+ from .apify_scraper import ApifyMapsScraper
  from .filter_engine import LeadFilterEngine

- __all__ = ["PlaywrightMapsScraper", "LeadFilterEngine"]
+ __all__ = ["ApifyMapsScraper", "LeadFilterEngine"]
```

### Execution Prompt

> **"Execute Phase 4: Step-by-Step Refactoring. First, run `safishamsi/graphify` to map the exact connections between `tasks.py`, `scraper/__init__.py`, and the legacy scraper. Use `amElnagdy/delegate-skills` to delegate the writing of `apify_scraper.py` (async httpx logic and JSON mapping) to a specialized sub-agent, applying `sickn33/antigravity-awesome-skills` best practices for robust async Python. Finally, trigger `amElnagdy/guard-skills` to perform strict type-checking, code validation, and a dry-run check before finalizing the replacements."**

---

## 5. B2B Niche Filter Adjustments

The current `LeadFilterEngine` uses thresholds tuned for small local businesses (dental clinics, etc.). For real estate agencies, adjust defaults:

| Parameter | Old Value | Suggested New Value | Reason |
|---|---|---|---|
| `min_rating` | `4.0` | `3.8` | RE agencies tend to have lower ratings |
| `min_reviews` | `15` | `5` | Many boutique RE agencies have few reviews |
| `max_reviews` | `500` | `2000` | Large RE firms may have more reviews |
| `require_phone` | `True` | `True` | Keep — required for wa.me |
| `stellar_rating_bypass` | `4.5` | `4.3` | Adjusted to match new thresholds |

These can be passed as constructor arguments in `tasks.py` with no schema changes:

```python
filter_ = LeadFilterEngine(min_rating=3.8, min_reviews=5, max_reviews=2000)
```

### Execution Prompt

> **"Execute Phase 5: B2B Niche Filter Adjustments. Update the filter instantiation in `tasks.py`. Then, use `amElnagdy/guard-skills` to perform a quality gate check on the new parameters (min_rating=3.8, min_reviews=5) to ensure they do not introduce edge-case logical failures in the `LeadFilterEngine`."**

---

## 6. Deployment Steps

After code changes are approved and implemented:

```bash
# 1. On your local machine — push updated files to VPS
scp -i YOUR_KEY backend/requirements.txt ubuntu@84.8.102.112:/home/ubuntu/leadforge/backend/
scp -i YOUR_KEY backend/Dockerfile ubuntu@84.8.102.112:/home/ubuntu/leadforge/backend/
scp -i YOUR_KEY backend/app/services/scraper/apify_scraper.py ubuntu@84.8.102.112:/home/ubuntu/leadforge/backend/app/services/scraper/
scp -i YOUR_KEY backend/app/workers/tasks.py ubuntu@84.8.102.112:/home/ubuntu/leadforge/backend/app/workers/

# 2. On VPS — update .env
nano /home/ubuntu/leadforge/backend/.env
# Add: APIFY_API_TOKEN=your_token_here

# 3. Rebuild ONLY the api and worker containers (no DB/Redis downtime)
cd /home/ubuntu/leadforge
docker compose up -d --build api worker

# 4. Verify the worker starts cleanly
docker compose logs worker --tail=30
```

### Execution Prompt

> **"Execute Phase 6: Deployment. Follow the `sickn33/antigravity-awesome-skills` deployment playbook. Use `safishamsi/graphify` to verify the final architecture state. Then, use `amElnagdy/delegate-skills` to manage the SCP transfers and remote Docker rebuild commands. Finally, run `amElnagdy/guard-skills` to execute a post-deployment health check, confirming the Celery worker and FastAPI containers are running securely and without errors."**

---

## 7. Architect's Recommendations

### 7.1 ✅ DO: Keep `phone_enricher.py` As-Is
The `PhoneEnricher` (DuckDuckGo fallback) remains valuable. Apify sometimes returns `null` for `phone` on MENA-region businesses. The enricher already uses `httpx` and requires no changes.

### 7.2 ✅ DO: Implement a `scraped_from="apify"` Tag
Already handled in the field mapping above. This lets you filter analytics by scraper source in the dashboard later.

### 7.3 ✅ DO: Add `maxCrawledPlacesPerSearch` as a Campaign Parameter
Currently hardcoded to 40. Consider wiring this to the `Campaign` model in the future so users can configure "scrape 20 leads" vs "scrape 100 leads" per campaign — directly controlling Apify compute credit usage.

### 7.4 ⚠️ MONITOR: Apify Free Tier Credit Consumption
The free tier provides **$5 USD/month** of compute. The `google-maps-scraper` actor costs approximately **$0.004–0.012 per result** depending on depth. At 40 results/campaign, one campaign costs **~$0.16–0.48**. This means you get **~10–30 campaigns per month** on the free tier.

> To scale beyond the free tier without cost: consider **self-hosting the Apify actor** using their open-source [`apify/actor-google-maps-scraper`](https://github.com/apify/actor-google-maps-scraper) on your own Oracle Cloud VPS with Puppeteer. This is a zero-cost alternative once the VPS is already running.

### 7.5 ⚠️ WATCH: `run-sync-get-dataset-items` Timeout
The synchronous run endpoint has a hard server timeout. For queries returning >60 results, switch to the **async run + polling** pattern:
1. `POST /acts/{actor}/runs` → get `runId`
2. Poll `GET /acts/{actor}/runs/{runId}` until status = `SUCCEEDED`
3. `GET /datasets/{defaultDatasetId}/items`

For ≤40 results (our default), the synchronous endpoint is reliable and simpler.

### 7.6 🔐 SECURITY: Never Commit `APIFY_API_TOKEN`
Confirm `.gitignore` already includes `.env` and `backend/.env`. If you ever push to GitHub, rotate the token immediately at `console.apify.com`.

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Apify API downtime | Medium | Keep `playwright_scraper.py.bak` for emergency fallback |
| Free tier exhaustion | Low | Monitor in Apify console; 10–30 campaigns/month is sufficient for MVP |
| `phone` field null for MENA | Low | `PhoneEnricher` DuckDuckGo fallback already handles this |
| Actor schema change (Apify updates) | Low | Add an `item.get()` default for every field — already planned above |
| `reviewsCount` == 0 for new agencies | Medium | `stellar_rating_bypass` gate in `LeadFilterEngine` handles this |

---

*Awaiting explicit approval to begin implementation.*
