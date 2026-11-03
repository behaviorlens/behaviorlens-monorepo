"""Closing sessions and handing them to the worker for processing."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import RecordedSession


def enqueue_processing(session_id: str) -> None:
    from app.tasks import process_session

    process_session.delay(session_id)


def get_enqueue() -> Callable[[str], None]:
    """FastAPI dependency so tests can replace the Celery hand-off."""
    return enqueue_processing


def close_session(session: RecordedSession, now: datetime | None = None) -> bool:
    """Marks an active session completed. Returns True if it changed."""
    if session.status != "active":
        return False
    session.status = "completed"
    session.ended_at = now or datetime.now(UTC)
    session.processing_state = "pending"
    return True


def close_idle_sessions(db: Session, idle_seconds: int, now: datetime | None = None) -> list[str]:
    """Closes sessions with no new events for `idle_seconds`. Returns their ids."""
    now = now or datetime.now(UTC)
    cutoff = now - timedelta(seconds=idle_seconds)
    idle = db.scalars(
        select(RecordedSession).where(
            RecordedSession.status == "active", RecordedSession.last_received_at < cutoff
        )
    ).all()
    closed = [session.id for session in idle if close_session(session, now)]
    db.commit()
    return closed
