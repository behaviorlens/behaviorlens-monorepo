import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# JSONB on Postgres, plain JSON elsewhere (tests run on SQLite).
JsonType = JSON().with_variant(JSONB(), "postgresql")


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Organization(TimestampMixin, Base):
    """A team that owns projects (a university group, a company)."""

    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    projects: Mapped[list["Project"]] = relationship(back_populates="organization")


class Project(TimestampMixin, Base):
    """One website being studied. Sessions, tasks and personas belong to a project."""

    __tablename__ = "projects"
    __table_args__ = (UniqueConstraint("organization_id", "slug"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    site_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    # Public key embedded in the recorder snippet; safe to expose.
    ingest_key: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    # Browser origins allowed to send recordings with this key.
    allowed_origins: Mapped[list[str]] = mapped_column(JsonType, nullable=False, default=list)
    retention_days: Mapped[int] = mapped_column(Integer, nullable=False, default=90)

    organization: Mapped[Organization] = relationship(back_populates="projects")


class RecordedSession(TimestampMixin, Base):
    """One recorded visit: a human with the snippet, or a persona run with the agent loader."""

    __tablename__ = "sessions"
    __table_args__ = (
        Index("ix_sessions_project_started", "project_id", "started_at"),
        Index("ix_sessions_status_last_received", "status", "last_received_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="human")
    persona_run_id: Mapped[str | None] = mapped_column(String(64))
    task_id: Mapped[str | None] = mapped_column(String(64))
    study_id: Mapped[str | None] = mapped_column(String(64))
    username: Mapped[str | None] = mapped_column(String(200))

    url: Mapped[str | None] = mapped_column(String(4096))
    referrer: Mapped[str | None] = mapped_column(String(4096))
    page_title: Mapped[str | None] = mapped_column(String(1024))
    user_agent: Mapped[str | None] = mapped_column(String(1024))
    browser_info: Mapped[dict[str, Any]] = mapped_column(JsonType, nullable=False, default=dict)

    # active -> completed (closed after idle or an explicit end) | limit_reached | expired
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    # pending -> processing -> ready | failed (post-processing of a closed session)
    processing_state: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")

    # Client clock (rrweb timestamps, ms since epoch) and server receive times.
    first_event_ms: Mapped[int | None] = mapped_column(BigInteger)
    last_event_ms: Mapped[int | None] = mapped_column(BigInteger)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    first_received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    event_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Activity Log entries (clicks, input runs, scroll runs, selections): what the
    # dashboard shows as the session's events. Kept current while the session is
    # active by the refresh_activity_counts job; activity_counted_at says up to when.
    activity_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    activity_counted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    byte_size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    chunks: Mapped[list["SessionChunk"]] = relationship(
        back_populates="session", order_by="SessionChunk.seq", cascade="all, delete-orphan"
    )
    stats: Mapped["SessionStats | None"] = relationship(
        back_populates="session", cascade="all, delete-orphan", uselist=False
    )


class SessionChunk(Base):
    """One uploaded batch of rrweb events, stored gzip-compressed in object storage."""

    __tablename__ = "session_chunks"
    __table_args__ = (UniqueConstraint("session_id", "seq"),)

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer(), "sqlite"), primary_key=True
    )
    session_id: Mapped[str] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    seq: Mapped[int] = mapped_column(Integer, nullable=False)
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    event_count: Mapped[int] = mapped_column(Integer, nullable=False)
    first_event_ms: Mapped[int | None] = mapped_column(BigInteger)
    last_event_ms: Mapped[int | None] = mapped_column(BigInteger)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    session: Mapped[RecordedSession] = relationship(back_populates="chunks")


class SessionStats(Base):
    """Numbers computed once a session closes."""

    __tablename__ = "session_stats"

    session_id: Mapped[str] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), primary_key=True
    )
    duration_ms: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    page_view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    page_views: Mapped[list[str]] = mapped_column(JsonType, nullable=False, default=list)
    click_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    input_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    scroll_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    interaction_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session: Mapped[RecordedSession] = relationship(back_populates="stats")
