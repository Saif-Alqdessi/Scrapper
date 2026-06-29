# LeadForge — Cloud Run + Webhooks Migration Plan
## Complete Architectural Transition: Celery/Redis/VPS → Serverless

> **Objective:** Permanently eliminate Celery, Redis, and the VPS worker
> container. Replace with FastAPI on Google Cloud Run + Apify async webhooks
> + Neon PostgreSQL. Target: $0/month running cost, zero always-on processes.

---

## Architecture Transition Summary

```
BEFORE                                    AFTER
──────────────────────────────────────    ────────────────────────────────────
VPS Docker Compose (6 containers)         Google Cloud Run (1 service)
  nginx          → always on              Cloud Run HTTP ingress (built-in)
  api (FastAPI)  → always on              FastAPI on Cloud Run (scales to 0)
  worker (Celery)→ always on              ELIMINATED
  redis          → always on              ELIMINATED
  postgres (VPS) → always on              Neon PostgreSQL (serverless)
  flower         → always on              ELIMINATED

Monthly cost:  ~$5–15/month               Monthly cost: $0 (free tiers)
Containers:    6                          Services: 2 (Cloud Run + Neon)
Request flow:  API → Redis → Celery       API → Apify (async) → Webhook → DB
```

---

## Files Impact Register

| File | Action | Phase |
|---|---|---|
| `backend/app/workers/tasks.py` | **DELETE** | 3 |
| `backend/app/workers/celery_app.py` | **DELETE** | 3 |
| `backend/app/api/v1/jobs.py` | **DELETE** | 3 |
| `backend/requirements.txt` | **MODIFY** — remove celery/redis/kombu | 3 |
| `backend/app/config.py` | **MODIFY** — remove Redis vars, add Cloud Run vars | 3 |
| `backend/app/models/campaign.py` | **MODIFY** — add `apify_run_id` column | 2 |
| `backend/app/api/v1/campaigns.py` | **MODIFY** — swap Celery enqueue → Apify async | 6 |
| `backend/app/main.py` | **MODIFY** — swap jobs router → webhooks router | 6 |
| `docker-compose.yml` | **MODIFY** — remove worker/redis/flower | 6 |
| `backend/Dockerfile` | **MODIFY** — add gunicorn CMD, port 8080 | 7 |
| `backend/app/services/scraper/apify_async.py` | **CREATE** | 4 |
| `backend/app/services/pipeline_runner.py` | **CREATE** | 5 |
| `backend/app/api/v1/webhooks.py` | **CREATE** | 5 |
| `.github/workflows/deploy.yml` | **CREATE** | 8 |
| `backend/alembic/versions/xxxx_add_apify_run_id.py` | **CREATE** (auto) | 2 |

---

## Phase 1 — Codebase Audit & Dependency Mapping

**Goal:** Produce a complete, verified map of every Celery and Redis reference
in the codebase. No code is changed in this phase. This is the foundation
that every subsequent phase depends on.

### Tasks
1. Search every `.py`, `.txt`, `.yml` file for `celery`, `redis`, `flower`,
   `apply_async`, `kombu` references.
2. Map which API routes call Celery tasks and how.
3. Identify the exact `campaign_id == celery task_id` convention used in
   `campaigns.py` and confirm its replacement pattern.
4. Verify `apify_scraper.py` current implementation (sync vs async).
5. Confirm the `RawLeadData` and `Lead` schema contracts are unchanged.
6. Document all findings in a structured audit report.

### Expected Output
- A confirmed list of 8 files that reference Celery/Redis.
- Confirmation that `apify_run_id` does not yet exist on the Campaign model.
- Confirmation of the Apify actor slug: `apify~google-maps-scraper`.

---

```
EXECUTION PROMPT — PHASE 1
══════════════════════════════════════════════════════════════════════════════
@safishamsi/graphify: Map Celery/Redis dependencies and background tasks.
@sickn33/antigravity-awesome-skills: Fetch Apify webhook/dataset API docs.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 2 — Database Migration (Add `apify_run_id`)

**Goal:** Add the `apify_run_id` column to the `campaigns` table. This column
stores the Apify run ID returned when a scrape is launched, allowing the
webhook handler to match the callback to the correct campaign.

**Why this is Phase 2:** The webhook handler (Phase 5) reads this column. The
Alembic migration must exist and be applied to Neon before any code that
references it can run.

### Tasks
1. Add `apify_run_id = Column(String, nullable=True, index=True)` to
   `Campaign` model.
2. Generate Alembic migration with `--autogenerate`.
3. Apply migration to the local/dev database to verify it runs cleanly.
4. Keep the Neon production application for Phase 7 (first Cloud Run deploy).

### Database Contract After This Phase
```sql
ALTER TABLE campaigns ADD COLUMN apify_run_id VARCHAR INDEXED;
-- nullable: existing rows are unaffected
```

---

```
EXECUTION PROMPT — PHASE 2
══════════════════════════════════════════════════════════════════════════════
@safishamsi/graphify: Check Campaign model/alembic wiring.
@amElnagdy/guard-skills: Validate adding `apify_run_id = Column(String, nullable=True, index=True)` to campaigns.py.
@amElnagdy/delegate-skills: Apply change, `alembic revision --autogenerate`, `alembic upgrade head`.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 3 — Remove Dead Code (Celery, Redis, Flower)

**Goal:** Surgically excise every Celery and Redis reference from the codebase.
Delete 3 files, strip 3 packages from requirements, remove 3 config settings,
and remove 3 Docker services.

**Why Phase 3 before creating new code:** The new webhook endpoint (Phase 5)
must not import from the deleted files. Deleting first prevents accidental
circular imports during Phase 5.

### Tasks
1. Delete `tasks.py`, `celery_app.py`, `jobs.py`.
2. Remove `celery[redis]`, `redis`, `kombu` from `requirements.txt`.
3. Remove `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` from
   `config.py`. Add placeholder `CLOUD_RUN_URL` and `APIFY_WEBHOOK_SECRET`.
4. Remove `worker`, `redis`, `flower` services from `docker-compose.yml`.
5. Remove all Celery `depends_on` references from remaining services.
6. Verify the app still imports cleanly after deletion.

---

```
EXECUTION PROMPT — PHASE 3
══════════════════════════════════════════════════════════════════════════════
@safishamsi/graphify: Identify Celery/Redis imports.
@amElnagdy/guard-skills: Validate deletion of tasks.py, celery_app.py, jobs.py; and removal of celery/redis from requirements.txt, config.py, docker-compose.yml, main.py.
@sickn33/antigravity-awesome-skills: Apply deletions/edits.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 4 — Create Apify Async Service (`apify_async.py`)

**Goal:** Create the new non-blocking Apify integration module. Unlike the
existing `apify_scraper.py` (which uses `run-sync-get-dataset-items` and
blocks for up to 120 seconds), this module fires an async run and returns
immediately with a `run_id`. Apify will call our webhook when done.

### New Module Contract
```python
async def start_apify_run(
    niche: str,
    location: str,
    campaign_id: str,
    webhook_url: str,
    max_results: int = 40,
) -> str:  # returns Apify run_id
```

### Key Technical Details
- Endpoint: `POST https://api.apify.com/v2/acts/apify~google-maps-scraper/runs`
- This endpoint returns **immediately** (not `run-sync-get-dataset-items`).
- Webhook payload template injects `campaignId` so our handler can look up
  the campaign without a separate DB query on the run_id alone.
- Timeout on this HTTP call: `15.0s` (just launching — fast).

---

```
EXECUTION PROMPT — PHASE 4
══════════════════════════════════════════════════════════════════════════════
@sickn33/antigravity-awesome-skills: Fetch Apify async run/abort docs.
@safishamsi/graphify: Identify reusable ApifyMapsScraper logic.
@amElnagdy/delegate-skills: Write `apify_async.py` (start_apify_run, abort_apify_run).
@amElnagdy/guard-skills: Validate `apify_async.py`.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 5 — Create Webhook Handler & Pipeline Runner

**Goal:** Create the two files that replace the Celery worker entirely:
1. `pipeline_runner.py` — direct async AI pipeline call (no Celery wrapper)
2. `webhooks.py` — the FastAPI endpoint Apify POSTs to when a run finishes

The webhook handler IS the new "worker". It receives the Apify completion
event, fetches results, filters leads, saves to DB, and runs the AI pipeline
— all as a standard async FastAPI request handler.

### Security Note
Apify webhook calls must be validated. The handler verifies that:
- `campaignId` in the payload matches a real campaign in the DB
- `apify_run_id` on the campaign matches `runId` in the payload
- Unknown run IDs return `200 OK` (not 404) to prevent Apify retry storms

---

```
EXECUTION PROMPT — PHASE 5
══════════════════════════════════════════════════════════════════════════════
@safishamsi/graphify: Map dependencies for webhooks and pipeline runner.
@sickn33/antigravity-awesome-skills: Confirm Apify dataset fetch endpoint.
@amElnagdy/delegate-skills: Write `pipeline_runner.py` and `webhooks.py`.
@amElnagdy/guard-skills: Validate both files.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 6 — Update Existing Files (Wire New Architecture)

**Goal:** Connect the new modules into the existing API routes and app
entrypoint. This phase touches 3 existing files: `campaigns.py`, `main.py`,
and `docker-compose.yml`.

### Changes Summary
- `campaigns.py`: Replace `apply_async()` with `await start_apify_run()`.
  Replace Celery `revoke()` with `await abort_apify_run()`.
  Remove time-based retry task_id hack.
- `main.py`: Register webhooks router, remove jobs router.
- `docker-compose.yml`: Remove worker/redis/flower. Used only for local
  dev with a single `api` container + local postgres.

---

```
EXECUTION PROMPT — PHASE 6
══════════════════════════════════════════════════════════════════════════════
@safishamsi/graphify: Identify insertion points in campaigns.py, main.py, docker-compose.yml.
@amElnagdy/guard-skills: Validate swapping apply_async for start_apify_run, adding webhooks router.
@sickn33/antigravity-awesome-skills: Apply edits.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 7 — Dockerfile + Google Cloud Run Deployment

**Goal:** Update the Dockerfile for Cloud Run compatibility (port 8080,
gunicorn production server), then deploy the application to Cloud Run for
the first time. Configure all secrets via Google Secret Manager.

### Key Cloud Run Requirements
- Container must listen on `$PORT` (Cloud Run sets this to `8080`)
- Must use `gunicorn` with `UvicornWorker` for production (not `--reload`)
- Secrets injected as environment variables via Secret Manager (never baked in)
- Min instances = 0 (scales to zero when idle → $0 cost)
- Timeout = 300s (webhook handler can take up to 90s for large campaigns)

---

```
EXECUTION PROMPT — PHASE 7
══════════════════════════════════════════════════════════════════════════════
@sickn33/antigravity-awesome-skills: Check Cloud Run docs.
@amElnagdy/guard-skills: Validate Dockerfile CMD (gunicorn, port 8080).
@amElnagdy/delegate-skills: Create GCP secrets.
@sickn33/antigravity-awesome-skills: `gcloud run deploy` and health check.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 8 — GitHub Actions CI/CD Pipeline

**Goal:** Configure automatic deployment to Cloud Run on every push to `main`
that touches the `backend/` directory. Uses GitHub's Workload Identity
Federation (keyless auth — no service account JSON files).

### Why Workload Identity Federation
Storing GCP service account JSON keys in GitHub Secrets is a security
anti-pattern. WIF allows GitHub Actions to authenticate to GCP using
short-lived OIDC tokens — zero secrets stored, zero rotation required.

---

```
EXECUTION PROMPT — PHASE 8
══════════════════════════════════════════════════════════════════════════════
@sickn33/antigravity-awesome-skills: Fetch WIF docs and setup WIF.
@amElnagdy/delegate-skills: Write `.github/workflows/deploy.yml`.
@amElnagdy/guard-skills: Validate YAML (id-token: write), commit & push.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 9 — Neon PostgreSQL Migration

**Goal:** Provision the Neon serverless PostgreSQL database, run Alembic
migrations against it, and update Cloud Run to use the Neon connection string.
The local Docker postgres is retired for production use.

### Neon Free Tier
- 0.5 GB storage
- Scales to zero when idle (no cost at rest)
- Connection pooling via PgBouncer included
- `asyncpg` driver works with `?sslmode=require` suffix

---

```
EXECUTION PROMPT — PHASE 9
══════════════════════════════════════════════════════════════════════════════
@sickn33/antigravity-awesome-skills: Verify Neon connection docs.
@amElnagdy/delegate-skills: Run Alembic migrations on Neon DB.
@sickn33/antigravity-awesome-skills: Update Cloud Run DATABASE_URL secret.
══════════════════════════════════════════════════════════════════════════════
```

---

## Phase 10 — End-to-End Validation & Smoke Tests

**Goal:** Verify the complete new architecture works end-to-end with a real
campaign. This is the acceptance test for the entire migration.

### Validation Checklist
1. API health check passes
2. Campaign creation returns 202 with `apify_run_id` populated
3. Apify calls the webhook within 2 minutes
4. Campaign status transitions: PENDING → SCRAPING → AI_RUNNING → DONE
5. Leads appear in the database with AI output
6. Cancel and retry endpoints work without Celery errors
7. No references to Celery or Redis in running process

---

```
EXECUTION PROMPT — PHASE 10
══════════════════════════════════════════════════════════════════════════════
@safishamsi/graphify: Assert ZERO remaining Celery/Redis references.
@sickn33/antigravity-awesome-skills: Run acceptance tests.
@safishamsi/graphify: Summarize request flow.
══════════════════════════════════════════════════════════════════════════════
```

---

## Migration Complete — Architecture Summary

```
LeadForge Serverless Architecture (Final State)
════════════════════════════════════════════════

  GitHub (main branch)
      │ git push
      ▼
  GitHub Actions
      │ gcloud run deploy
      ▼
  Google Cloud Run (FastAPI)
      │                          │
      │ POST /api/v1/campaigns   │ POST /api/v1/webhooks/apify
      │                          │
      ▼                          ▼
  Neon PostgreSQL           Neon PostgreSQL
  (save campaign)           (save leads + AI output)
      │                          ▲
      │ POST /acts/.../runs      │ webhook callback
      ▼                          │
  Apify Cloud ──────────────────►┘
  (scrapes Google Maps)

  Total infrastructure: 2 managed services
  Total monthly cost:   $0 (free tiers)
  Containers maintained: 0 (Cloud Run is managed)
  Always-on processes:   0 (scales to zero)
```

---

*Senior Cloud Architect · LeadForge Serverless Migration · 2026-06-29*
