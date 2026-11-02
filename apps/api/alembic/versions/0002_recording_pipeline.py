"""Recording pipeline: project ingest settings, sessions, chunks and stats.

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-02
"""

import secrets
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

JsonType = sa.JSON().with_variant(JSONB(), "postgresql")


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column(name, sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
        for name in ("created_at", "updated_at")
    ]


def upgrade() -> None:
    op.add_column("projects", sa.Column("ingest_key", sa.String(64), nullable=True))
    op.add_column(
        "projects",
        sa.Column("allowed_origins", JsonType, nullable=False, server_default=sa.text("'[]'")),
    )
    op.add_column(
        "projects",
        sa.Column("retention_days", sa.Integer(), nullable=False, server_default="90"),
    )
    connection = op.get_bind()
    for (project_id,) in connection.execute(sa.text("SELECT id FROM projects")).fetchall():
        connection.execute(
            sa.text("UPDATE projects SET ingest_key = :key WHERE id = :id"),
            {"key": f"pk_{secrets.token_hex(16)}", "id": project_id},
        )
    with op.batch_alter_table("projects") as batch:
        batch.alter_column("ingest_key", existing_type=sa.String(64), nullable=False)
        batch.create_unique_constraint("uq_projects_ingest_key", ["ingest_key"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "project_id",
            sa.Uuid(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source", sa.String(16), nullable=False),
        sa.Column("persona_run_id", sa.String(64)),
        sa.Column("task_id", sa.String(64)),
        sa.Column("study_id", sa.String(64)),
        sa.Column("username", sa.String(200)),
        sa.Column("url", sa.String(4096)),
        sa.Column("referrer", sa.String(4096)),
        sa.Column("page_title", sa.String(1024)),
        sa.Column("user_agent", sa.String(1024)),
        sa.Column("browser_info", JsonType, nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("processing_state", sa.String(16), nullable=False),
        sa.Column("first_event_ms", sa.BigInteger()),
        sa.Column("last_event_ms", sa.BigInteger()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("first_received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("event_count", sa.Integer(), nullable=False),
        sa.Column("chunk_count", sa.Integer(), nullable=False),
        sa.Column("byte_size", sa.BigInteger(), nullable=False),
        *_timestamps(),
    )
    op.create_index("ix_sessions_project_started", "sessions", ["project_id", "started_at"])
    op.create_index("ix_sessions_status_last_received", "sessions", ["status", "last_received_at"])

    op.create_table(
        "session_chunks",
        sa.Column("id", sa.BigInteger().with_variant(sa.Integer(), "sqlite"), primary_key=True),
        sa.Column(
            "session_id",
            sa.String(64),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("seq", sa.Integer(), nullable=False),
        sa.Column("object_key", sa.String(512), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("event_count", sa.Integer(), nullable=False),
        sa.Column("first_event_ms", sa.BigInteger()),
        sa.Column("last_event_ms", sa.BigInteger()),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("session_id", "seq"),
    )

    op.create_table(
        "session_stats",
        sa.Column(
            "session_id",
            sa.String(64),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("duration_ms", sa.BigInteger(), nullable=False),
        sa.Column("page_view_count", sa.Integer(), nullable=False),
        sa.Column("page_views", JsonType, nullable=False),
        sa.Column("click_count", sa.Integer(), nullable=False),
        sa.Column("input_count", sa.Integer(), nullable=False),
        sa.Column("scroll_count", sa.Integer(), nullable=False),
        sa.Column("interaction_count", sa.Integer(), nullable=False),
        sa.Column(
            "computed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_table("session_stats")
    op.drop_table("session_chunks")
    op.drop_index("ix_sessions_status_last_received", table_name="sessions")
    op.drop_index("ix_sessions_project_started", table_name="sessions")
    op.drop_table("sessions")
    with op.batch_alter_table("projects") as batch:
        batch.drop_constraint("uq_projects_ingest_key", type_="unique")
    op.drop_column("projects", "retention_days")
    op.drop_column("projects", "allowed_origins")
    op.drop_column("projects", "ingest_key")
