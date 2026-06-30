"""
app/main.py
FastAPI application entry point — LeadForge Backend.

Architecture:
  - /api/v1/campaigns  → Create/monitor scraping campaigns
  - /api/v1/leads      → List, update, and trigger AI for leads
  - /api/v1/preview    → Serves assembled JSON payloads to Next.js frontend
"""
import structlog
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings

log = structlog.get_logger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before yielding, then shutdown tasks after."""
    log.info("LeadForge API starting up…", env=settings.APP_ENV)
    yield
    log.info("LeadForge API shutting down…")


# ── Application ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="LeadForge API",
    description=(
        "Backend engine for the Lead Gen & Landing Page Pipeline. "
        "Scrapes → AI agents → JSON payload → wa.me outreach link."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("Unhandled exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Check server logs."},
    )


# ── Routers (Phase 3 — fully implemented) ────────────────────────────────────
from app.api.v1 import campaigns, leads, preview, webhooks

app.include_router(
    campaigns.router,
    prefix="/api/v1/campaigns",
    tags=["campaigns"],
)
app.include_router(
    leads.router,
    prefix="/api/v1/leads",
    tags=["leads"],
)

app.include_router(
    preview.router,
    prefix="/api/v1/preview",
    tags=["preview"],
)

app.include_router(
    webhooks.router,
    tags=["webhooks"],
)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"], summary="Health check")
async def health_check():
    """Returns 200 OK when the service is running."""
    return {
        "status": "ok",
        "service": "leadforge-api",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["system"], include_in_schema=False)
async def root():
    return {"message": "LeadForge API — see /docs for endpoints."}
