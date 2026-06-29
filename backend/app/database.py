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

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
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


# ── Context Manager (for Celery tasks outside FastAPI) ────────────────────────
def get_async_session() -> AsyncSessionLocal:  # type: ignore[valid-type]
    """
    Returns the session factory directly, for use as an async context manager
    inside Celery tasks (which run outside FastAPI's DI system).

    Usage:
        async with get_async_session() as db:
            ...
    """
    return AsyncSessionLocal()


@asynccontextmanager
async def make_task_engine() -> AsyncGenerator[async_sessionmaker, None]:
    """
    Creates a FRESH SQLAlchemy async engine bound to the CURRENT event loop.

    Must be used inside Celery tasks that run in their own event loop
    (created by asyncio.run() or asyncio.new_event_loop()).  Using the
    module-level `engine` / `AsyncSessionLocal` from a different loop
    causes: 'Future attached to a different loop'.

    Usage inside a Celery task:
        async def _task_body():
            async with make_task_engine() as SessionLocal:
                async with SessionLocal() as db:
                    ...
    """
    task_engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,          # quiet in worker logs
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )
    task_session_factory = async_sessionmaker(
        bind=task_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    try:
        yield task_session_factory
    finally:
        await task_engine.dispose()


# ── Table Creation ────────────────────────────────────────────────────────────
async def create_tables() -> None:
    """
    Creates all tables on startup (development convenience).
    In production, use Alembic migrations instead.

    Also runs idempotent ALTER TYPE statements to keep the PostgreSQL enum
    in sync with the Python CampaignStatus enum (e.g. adding CANCELLED).
    """
    from sqlalchemy import text
    async with engine.begin() as conn:
        # Import models so they register with Base.metadata
        import app.models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

        # Ensure CANCELLED exists in the PostgreSQL enum.
        # IMPORTANT: SQLAlchemy SAEnum stores the Python member .name (UPPERCASE),
        # not .value ("cancelled"). PostgreSQL is case-sensitive for enum values,
        # so the ALTER must use 'CANCELLED' to match what SQLAlchemy sends.
        # IF NOT EXISTS makes this idempotent — safe on every container restart.
        await conn.execute(
            text("ALTER TYPE campaignstatus ADD VALUE IF NOT EXISTS 'CANCELLED'")
        )

