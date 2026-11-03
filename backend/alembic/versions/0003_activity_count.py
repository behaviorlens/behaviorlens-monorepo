"""Activity count: the number of Activity Log entries shown as a session's events.

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "sessions",
        sa.Column("activity_count", sa.Integer(), nullable=False, server_default="0"),
    )
    # Null means "not counted yet": the refresh job and processing fill it in.
    op.add_column(
        "sessions", sa.Column("activity_counted_at", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("sessions", "activity_counted_at")
    op.drop_column("sessions", "activity_count")
