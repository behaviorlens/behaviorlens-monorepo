"""Receives recorded rrweb events from the recorder (snippet or agent bridge).

POST /ingest/v1/sessions/{session_id}/events   one batch of events
POST /ingest/v1/sessions/{session_id}/end      the recorder stopped; close the session now

Authentication is the project's public ingest key (X-BL-Project-Key header or
`key` in the body). Browser requests must also come from one of the project's
allowed origins. Batches are idempotent on (session, seq), so retries are safe.
"""

import gzip
import json
import re
import zlib
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Header, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import Project, RecordedSession, SessionChunk
from app.ratelimit import RateLimiter, get_rate_limiter
from app.session_lifecycle import close_session, get_enqueue
from app.storage import ObjectStore, chunk_key, get_object_store

router = APIRouter(prefix="/ingest/v1", tags=["ingest"])

SESSION_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
REPLAY_TOO_LARGE_CODE = "BEHAVIORLENS_REPLAY_TOO_LARGE"


class Viewport(BaseModel):
    width: int | None = None
    height: int | None = None


class IngestMeta(BaseModel):
    url: str | None = Field(default=None, max_length=4096)
    referrer: str | None = Field(default=None, max_length=4096)
    title: str | None = Field(default=None, max_length=1024)
    userAgent: str | None = Field(default=None, max_length=1024)
    language: str | None = Field(default=None, max_length=64)
    platform: str | None = Field(default=None, max_length=128)
    timezone: str | None = Field(default=None, max_length=128)
    viewport: Viewport | None = None
    screen: Viewport | None = None
    source: Literal["human", "persona"] = "human"
    username: str | None = Field(default=None, max_length=200)
    taskId: str | None = Field(default=None, max_length=64)
    studyId: str | None = Field(default=None, max_length=64)
    personaRunId: str | None = Field(default=None, max_length=64)


class IngestBatch(BaseModel):
    key: str | None = None
    seq: int = Field(ge=0, le=1_000_000)
    meta: IngestMeta | None = None
    events: list[dict[str, Any]] = Field(max_length=20_000)


class EndRequest(BaseModel):
    key: str | None = None


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"errorCode": code, "message": message})


def _decode_body(raw: bytes, encoding: str | None, limit: int) -> bytes:
    if (encoding or "").lower() != "gzip":
        return raw
    decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS)
    data = decompressor.decompress(raw, limit + 1)
    if len(data) > limit or decompressor.unconsumed_tail:
        raise OverflowError
    return data


def _authorize(
    db: Session, key: str | None, origin: str | None
) -> tuple[Project | None, JSONResponse | None]:
    if not key:
        return None, _error(401, "MISSING_KEY", "A project ingest key is required.")
    project = db.scalar(select(Project).where(Project.ingest_key == key))
    if project is None:
        return None, _error(401, "INVALID_KEY", "Unknown project ingest key.")
    # Server-side senders (the agent bridge) send no Origin header.
    if origin and origin.rstrip("/") not in {item.rstrip("/") for item in project.allowed_origins}:
        return None, _error(403, "ORIGIN_NOT_ALLOWED", f"Origin {origin} may not record here.")
    return project, None


def _ms_to_datetime(value: int | None, fallback: datetime) -> datetime:
    if value is None:
        return fallback
    try:
        return datetime.fromtimestamp(value / 1000, UTC)
    except (OverflowError, OSError, ValueError):
        return fallback


def _event_bounds(events: list[dict[str, Any]]) -> tuple[int | None, int | None]:
    stamps = [event["timestamp"] for event in events if isinstance(event.get("timestamp"), int)]
    return (min(stamps), max(stamps)) if stamps else (None, None)


def _apply_meta(session: RecordedSession, meta: IngestMeta, first: bool) -> None:
    if first:
        session.url = meta.url
        session.referrer = meta.referrer or None
        session.page_title = meta.title
        session.user_agent = meta.userAgent
        session.source = meta.source
        session.task_id = meta.taskId
        session.study_id = meta.studyId
        session.persona_run_id = meta.personaRunId
        session.browser_info = {
            "language": meta.language,
            "platform": meta.platform,
            "timezone": meta.timezone,
            "viewport": meta.viewport.model_dump() if meta.viewport else None,
            "screen": meta.screen.model_dump() if meta.screen else None,
        }
    if meta.username:
        session.username = meta.username
    if meta.taskId and not session.task_id:
        session.task_id = meta.taskId


@router.post("/sessions/{session_id}/events", status_code=202)
async def ingest_events(
    session_id: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    store: Annotated[ObjectStore, Depends(get_object_store)],
    limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
    x_bl_project_key: Annotated[str | None, Header()] = None,
    content_encoding: Annotated[str | None, Header()] = None,
    origin: Annotated[str | None, Header()] = None,
):
    settings = get_settings()
    if not SESSION_ID_PATTERN.match(session_id):
        return _error(422, "INVALID_SESSION_ID", "Session ids are 8-64 letters, digits, - or _.")

    raw = await request.body()
    if len(raw) > settings.max_batch_bytes:
        return _error(413, "BATCH_TOO_LARGE", "This batch is larger than the ingest limit.")
    try:
        body = _decode_body(raw, content_encoding, settings.max_batch_decoded_bytes)
        batch = IngestBatch.model_validate(json.loads(body))
    except OverflowError:
        return _error(413, "BATCH_TOO_LARGE", "This batch is larger than the ingest limit.")
    except (ValueError, zlib.error, ValidationError) as exc:
        return _error(400, "INVALID_BATCH", f"The batch could not be read: {exc}"[:500])

    # Database, Redis and S3 calls are blocking; keep them off the event loop.
    return await run_in_threadpool(
        _store_batch, db, store, limiter, session_id, batch, x_bl_project_key, origin
    )


def _store_batch(
    db: Session,
    store: ObjectStore,
    limiter: RateLimiter,
    session_id: str,
    batch: IngestBatch,
    header_key: str | None,
    origin: str | None,
):
    settings = get_settings()
    project, failure = _authorize(db, header_key or batch.key, origin)
    if failure:
        return failure
    assert project is not None
    if not limiter.allow(str(project.id)):
        return _error(429, "RATE_LIMITED", "Too many batches for this project; retry shortly.")

    session = db.get(RecordedSession, session_id)
    if session is not None and session.project_id != project.id:
        return _error(403, "SESSION_PROJECT_MISMATCH", "This session belongs to another project.")
    if session is not None and session.status == "limit_reached":
        return _error(413, REPLAY_TOO_LARGE_CODE, "This session reached its storage limit.")
    duplicate = db.scalar(
        select(SessionChunk.id).where(
            SessionChunk.session_id == session_id, SessionChunk.seq == batch.seq
        )
    )
    if duplicate is not None:
        return {"accepted": False, "duplicate": True, "sessionId": session_id, "seq": batch.seq}

    payload = gzip.compress(json.dumps(batch.events, separators=(",", ":")).encode())
    if session is not None and session.byte_size + len(payload) > settings.max_session_bytes:
        session.status = "limit_reached"
        session.processing_state = "pending"
        db.commit()
        return _error(413, REPLAY_TOO_LARGE_CODE, "This session reached its storage limit.")

    now = datetime.now(UTC)
    first_ms, last_ms = _event_bounds(batch.events)
    key = chunk_key(project.id, session_id, batch.seq)
    store.put(key, payload)

    if session is None:
        session = RecordedSession(
            id=session_id,
            project_id=project.id,
            source="human",
            browser_info={},
            status="active",
            processing_state="pending",
            first_event_ms=first_ms,
            last_event_ms=last_ms,
            started_at=_ms_to_datetime(first_ms, now),
            first_received_at=now,
            last_received_at=now,
            event_count=0,
            chunk_count=0,
            byte_size=0,
        )
        db.add(session)
        if batch.meta:
            _apply_meta(session, batch.meta, first=True)
    else:
        if batch.meta:
            _apply_meta(session, batch.meta, first=session.url is None)
        if first_ms is not None and (
            session.first_event_ms is None or first_ms < session.first_event_ms
        ):
            session.first_event_ms = first_ms
            session.started_at = _ms_to_datetime(first_ms, session.started_at)
        if last_ms is not None and (
            session.last_event_ms is None or last_ms > session.last_event_ms
        ):
            session.last_event_ms = last_ms
        if session.status == "completed":
            # More events after a close (for example a late retry): reopen it.
            session.status = "active"
            session.ended_at = None
        session.last_received_at = now

    session.event_count += len(batch.events)
    session.chunk_count += 1
    session.byte_size += len(payload)
    db.add(
        SessionChunk(
            session_id=session_id,
            seq=batch.seq,
            object_key=key,
            byte_size=len(payload),
            event_count=len(batch.events),
            first_event_ms=first_ms,
            last_event_ms=last_ms,
            received_at=now,
        )
    )
    try:
        db.commit()
    except IntegrityError:
        # A concurrent retry of the same batch won the race.
        db.rollback()
        return {"accepted": False, "duplicate": True, "sessionId": session_id, "seq": batch.seq}
    return {"accepted": True, "duplicate": False, "sessionId": session_id, "seq": batch.seq}


@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    enqueue: Annotated[Callable[[str], None], Depends(get_enqueue)],
    x_bl_project_key: Annotated[str | None, Header()] = None,
    origin: Annotated[str | None, Header()] = None,
):
    raw = await request.body()
    try:
        body = EndRequest.model_validate(json.loads(raw or b"{}"))
    except (ValueError, ValidationError):
        body = EndRequest()
    return await run_in_threadpool(
        _end_session, db, enqueue, session_id, x_bl_project_key or body.key, origin
    )


def _end_session(
    db: Session,
    enqueue: Callable[[str], None],
    session_id: str,
    key: str | None,
    origin: str | None,
):
    project, failure = _authorize(db, key, origin)
    if failure:
        return failure
    assert project is not None
    session = db.get(RecordedSession, session_id)
    if session is None or session.project_id != project.id:
        return _error(404, "SESSION_NOT_FOUND", "No such session for this project.")
    if close_session(session):
        db.commit()
        enqueue(session_id)
    return {"sessionId": session_id, "status": session.status}
