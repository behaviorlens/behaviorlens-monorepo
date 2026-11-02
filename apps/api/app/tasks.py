"""Background jobs: close idle sessions, compute session stats, apply retention."""

import gzip
import json
import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, or_, select

from app.activity import count_activity
from app.config import get_settings
from app.db import get_sessionmaker
from app.models import Project, RecordedSession, SessionChunk, SessionStats
from app.processing import compute_stats
from app.session_lifecycle import close_idle_sessions as close_idle
from app.storage import get_object_store, session_prefix
from app.worker import celery_app

logger = logging.getLogger(__name__)


def _load_events(db, store, session_id: str) -> list:
    chunks = db.scalars(
        select(SessionChunk).where(SessionChunk.session_id == session_id).order_by(SessionChunk.seq)
    ).all()
    events = []
    for chunk in chunks:
        events.extend(json.loads(gzip.decompress(store.get(chunk.object_key))))
    return events


def process_session_now(session_id: str) -> bool:
    """Computes and stores stats for one session. Returns False if it is missing."""
    store = get_object_store()
    with get_sessionmaker()() as db:
        session = db.get(RecordedSession, session_id)
        if session is None:
            return False
        session.processing_state = "processing"
        db.commit()
        try:
            counted_at = datetime.now(UTC)
            events = _load_events(db, store, session_id)
            session.activity_count = count_activity(events)
            session.activity_counted_at = counted_at
            computed = compute_stats(events)
            stats = db.get(SessionStats, session_id) or SessionStats(session_id=session_id)
            stats.duration_ms = computed.duration_ms
            stats.page_views = computed.page_views
            stats.page_view_count = len(computed.page_views)
            stats.click_count = computed.click_count
            stats.input_count = computed.input_count
            stats.scroll_count = computed.scroll_count
            stats.interaction_count = computed.interaction_count
            stats.computed_at = datetime.now(UTC)
            db.add(stats)
            session.processing_state = "ready"
            db.commit()
        except Exception:
            db.rollback()
            session = db.get(RecordedSession, session_id)
            if session is not None:
                session.processing_state = "failed"
                db.commit()
            logger.exception("Processing session %s failed", session_id)
            raise
    return True


@celery_app.task(name="app.tasks.process_session")
def process_session(session_id: str) -> bool:
    return process_session_now(session_id)


@celery_app.task(name="app.tasks.refresh_activity_counts")
def refresh_activity_counts() -> int:
    """Counts sessions never counted (including ones recorded before the count
    existed) and recounts active ones that received events since."""
    store = get_object_store()
    refreshed = 0
    with get_sessionmaker()() as db:
        sessions = db.scalars(
            select(RecordedSession).where(
                or_(
                    RecordedSession.activity_counted_at.is_(None),
                    and_(
                        RecordedSession.status == "active",
                        RecordedSession.activity_counted_at < RecordedSession.last_received_at,
                    ),
                )
            )
        ).all()
        for session in sessions:
            counted_at = datetime.now(UTC)
            session.activity_count = count_activity(_load_events(db, store, session.id))
            session.activity_counted_at = counted_at
            db.commit()
            refreshed += 1
    return refreshed


@celery_app.task(name="app.tasks.close_idle_sessions")
def close_idle_sessions() -> int:
    with get_sessionmaker()() as db:
        closed = close_idle(db, get_settings().session_idle_seconds)
    for session_id in closed:
        process_session.delay(session_id)
    if closed:
        logger.info("Closed %d idle sessions", len(closed))
    return len(closed)


@celery_app.task(name="app.tasks.apply_retention")
def apply_retention() -> int:
    """Deletes recordings older than each project's retention; keeps rows and stats."""
    store = get_object_store()
    expired = 0
    with get_sessionmaker()() as db:
        for project in db.scalars(select(Project)).all():
            cutoff = datetime.now(UTC) - timedelta(days=project.retention_days)
            old = db.scalars(
                select(RecordedSession).where(
                    RecordedSession.project_id == project.id,
                    RecordedSession.started_at < cutoff,
                    RecordedSession.status != "expired",
                )
            ).all()
            for session in old:
                store.delete_prefix(session_prefix(project.id, session.id))
                for chunk in list(session.chunks):
                    db.delete(chunk)
                session.status = "expired"
                session.byte_size = 0
                session.chunk_count = 0
                expired += 1
            db.commit()
    return expired
