"""
app/database.py
SQLAlchemy 2.0 async engine, session factory, and declarative Base.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

import logging
import re

log = logging.getLogger(__name__)

import os

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_WS1djRN8TcBD@ep-purple-dew-aslco8b5.c-4.eu-central-1.aws.neon.tech/neondb?ssl=require"
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

db_url = DATABASE_URL

if not db_url or "change-me" in db_url:
    log.critical("CRITICAL: DATABASE_URL environment variable is missing or empty!")
else:
    # Mask password: replace everything between the colon after the username and the @ symbol with ***
    masked_url = re.sub(r":([^:@/]+)@", ":***@", db_url)
    log.info(f"Loaded DATABASE_URL -> {masked_url}")

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    db_url,
    echo=(settings.APP_ENV == "development"),  # Log SQL in dev only
    pool_pre_ping=True,                        # Detect stale connections
    pool_size=10,
    max_overflow=20,
)

# ── Session Factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── Declarative Base ──────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """All ORM models inherit from this Base."""
    pass


# ── FastAPI Dependency ────────────────────────────────────────────────────────
async def get_db() -> AsyncSession:  # type: ignore[return]
    """
    Yields an async database session.
    Used as a FastAPI dependency: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ── Table Creation ────────────────────────────────────────────────────────────
async def create_tables() -> None:
    """
    Creates all tables on startup (development convenience).
    """
    async with engine.begin() as conn:
        import app.models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
