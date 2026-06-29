"""add wame_link_ar to leads

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-05-24

Phase 0 — Master_Integration_Roadmap.md
Adds the wame_link_ar column so the assembler can persist the Arabic
wa.me outreach link independently of the English wame_link column.
"""
from alembic import op
import sqlalchemy as sa


revision = "a1b2c3d4e5f6"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "leads",
        sa.Column("wame_link_ar", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("leads", "wame_link_ar")
