"""add apify_run_id

Revision ID: b8c53524_5cc
Revises: 
Create Date: 2026-06-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8c53524_5cc'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('campaigns', sa.Column('apify_run_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_campaigns_apify_run_id'), 'campaigns', ['apify_run_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_campaigns_apify_run_id'), table_name='campaigns')
    op.drop_column('campaigns', 'apify_run_id')
