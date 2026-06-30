"""
app/config.py
Centralized settings via Pydantic BaseSettings.
All values are loaded from .env or environment variables.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────
    APP_ENV: str = "development"
    CLOUD_RUN_URL: str = "https://leadforge-api-xxxx-uc.a.run.app"
    APIFY_WEBHOOK_SECRET: str = ""
    APP_SECRET_KEY: str = "change-me"
    API_KEY: str = "change-me-dashboard-api-key"
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    PREVIEW_BASE_URL: str = "http://localhost:3000/preview"
    LOG_LEVEL: str = "INFO"

    # ── PostgreSQL ────────────────────────────────────────────
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "leadforge"
    POSTGRES_USER: str = "admin"
    POSTGRES_PASSWORD: str = "change-me"
    
    # Optional direct URL override (useful for Neon/Render)
    DATABASE_URL_OVERRIDE: str | None = None

    @property
    def DATABASE_URL(self) -> str:
        """Async URL for SQLAlchemy (asyncpg driver)."""
        if self.DATABASE_URL_OVERRIDE:
            if self.DATABASE_URL_OVERRIDE.startswith("postgres://"):
                # SQLAlchemy 2.0+ requires postgresql://
                url = self.DATABASE_URL_OVERRIDE.replace("postgres://", "postgresql://", 1)
            else:
                url = self.DATABASE_URL_OVERRIDE
            # Ensure asyncpg is used
            if "postgresql://" in url:
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url

        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Sync URL for Alembic migrations (psycopg2 driver)."""
        if self.DATABASE_URL_OVERRIDE:
            if self.DATABASE_URL_OVERRIDE.startswith("postgres://"):
                url = self.DATABASE_URL_OVERRIDE.replace("postgres://", "postgresql://", 1)
            else:
                url = self.DATABASE_URL_OVERRIDE
            # Ensure psycopg2 is used
            if "postgresql://" in url:
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            return url

        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ── Redis / Celery ────────────────────────────────────────


    # ── Google Cloud / AI ─────────────────────────────────────────────
    GOOGLE_PLACES_API_KEY: str = ""
    GOOGLE_AI_API_KEY: str = ""

    # ── Groq (Analyst + Copywriter EN + Copywriter AR — Llama 3.3 70B) ──────────
    GROQ_API_KEY: str = ""

    # ── Apify ─────────────────────────────────────────────────────────
    APIFY_API_TOKEN: str = ""

    # ── LangSmith (Optional) ──────────────────────────────────
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "leadforge"

    # ── Model Allocation (Phase 5 — Google Unified Stack) ─────
    # High-quality copywriting — English & Arabic
    GEMINI_COPY_MODEL: str = "gemini-1.5-pro"
    # Speed-optimised analysis & JSON validation
    GEMINI_ANALYST_MODEL: str = "gemini-1.5-flash"
    GEMINI_VALIDATOR_MODEL: str = "gemini-1.5-flash"


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings instance (called at import time by dependants)."""
    return Settings()


settings = get_settings()
