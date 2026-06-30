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
        import os
        # 1. Check override
        # 2. Check standard DATABASE_URL (Render injects this)
        raw_url = self.DATABASE_URL_OVERRIDE or os.getenv("DATABASE_URL")
        
        if raw_url:
            if raw_url.startswith("postgres://"):
                # SQLAlchemy 2.0+ requires postgresql://
                url = raw_url.replace("postgres://", "postgresql://", 1)
            else:
                url = raw_url
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
        import os
        raw_url = self.DATABASE_URL_OVERRIDE or os.getenv("DATABASE_URL")
        
        if raw_url:
            if raw_url.startswith("postgres://"):
                url = raw_url.replace("postgres://", "postgresql://", 1)
            else:
                url = raw_url
            # Ensure psycopg2 is used
            if "postgresql://" in url:
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            return url

        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ── Google Cloud ──────────────────────────────────────────────────
    GOOGLE_PLACES_API_KEY: str = ""

    # ── Apify ─────────────────────────────────────────────────────────
    APIFY_API_TOKEN: str = ""


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings instance (called at import time by dependants)."""
    return Settings()


settings = get_settings()
