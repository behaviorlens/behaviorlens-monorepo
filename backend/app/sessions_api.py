"""Read API for the dashboard: session list, stats, replay and project settings.

Rows keep the shape the dashboard used with its mock data, so the frontend's
service functions only change where they fetch from.
"""

import gzip
import json
import uuid
from collections import defaultdict
from datetime import UTC, date, datetime, time
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.ingest import REPLAY_TOO_LARGE_CODE
from app.models import Project, RecordedSession, SessionChunk
from app.storage import ObjectStore, get_object_store

router = APIRouter(prefix="/api/v1/projects/{project_ref}", tags=["sessions"])

SortOption = Literal["newest", "oldest", "events_desc", "events_asc"]


class SessionRow(BaseModel):
    id: str
    username: str | None
    url: str | None
    referrer: str | None
    page_title: str | None
    user_agent: str | None
    ip_address: str | None
    started_at: str
    duration_s: int
    # Activity Log entries, the number the dashboard labels "events".
    event_count: int
    raw_event_count: int
    status: str
    source: str
    task_id: str | None
    study_id: str | None
    persona_run_id: str | None
    processing_state: str


class SessionList(BaseModel):
    total: int
    sessions: list[SessionRow]


class StatsTotals(BaseModel):
    total: int
    active: int
    completed: int
    limit_reached: int
    pending_flush: int
    avg_event_count: int
    avg_duration_s: int


class StatsDay(BaseModel):
    day: str
    total: int


class StatsPage(BaseModel):
    url: str
    page_title: str | None
    sessions: int
    avg_event_count: int
    avg_duration_s: int


class SessionStatsResponse(BaseModel):
    totals: StatsTotals
    timeseries: list[StatsDay]
    topPages: list[StatsPage]


class ProjectInfo(BaseModel):
    id: str
    name: str
    slug: str
    site_url: str
    ingest_key: str
    allowed_origins: list[str]
    retention_days: int
    recorder_url: str
    api_url: str
    snippet: str


def resolve_project(db: Session, project_ref: str) -> Project:
    try:
        project = db.get(Project, uuid.UUID(project_ref))
    except ValueError:
        project = db.scalar(select(Project).where(Project.slug == project_ref))
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _duration_s(session: RecordedSession) -> int:
    if session.first_event_ms is None or session.last_event_ms is None:
        return 0
    return max(0, round((session.last_event_ms - session.first_event_ms) / 1000))


def _row(session: RecordedSession) -> dict[str, Any]:
    started = session.started_at
    # SQLite (tests) returns naive datetimes; they are stored as UTC.
    started = started.astimezone(UTC) if started.tzinfo else started.replace(tzinfo=UTC)
    return {
        "id": session.id,
        "username": session.username,
        "url": session.url,
        "referrer": session.referrer,
        "page_title": session.page_title,
        "user_agent": session.user_agent,
        # IP addresses are not stored.
        "ip_address": None,
        # ISO 8601 in UTC with "Z", so browsers convert it to the viewer's time zone.
        "started_at": started.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "duration_s": _duration_s(session),
        "event_count": session.activity_count,
        "raw_event_count": session.event_count,
        "status": session.status,
        "source": session.source,
        "task_id": session.task_id,
        "study_id": session.study_id,
        "persona_run_id": session.persona_run_id,
        "processing_state": session.processing_state,
    }


def _parse_day(value: str | None, end: bool) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if len(value) <= 10:  # a plain date covers the whole day
        parsed = datetime.combine(date.fromisoformat(value), time.max if end else time.min)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def _filtered(
    project: Project,
    q: str | None,
    status: str | None,
    site_path: str | None,
    username: str | None,
    min_events: int | None,
    date_from: str | None,
    date_to: str | None,
    source: str | None,
) -> Select:
    query = select(RecordedSession).where(RecordedSession.project_id == project.id)
    if status and status != "all":
        query = query.where(RecordedSession.status == status)
    if source:
        query = query.where(RecordedSession.source == source)
    if site_path:
        query = query.where(RecordedSession.url.ilike(f"%{site_path}%"))
    if username:
        query = query.where(RecordedSession.username.ilike(f"%{username}%"))
    if min_events:
        query = query.where(RecordedSession.activity_count >= min_events)
    start = _parse_day(date_from, end=False)
    if start:
        query = query.where(RecordedSession.started_at >= start)
    finish = _parse_day(date_to, end=True)
    if finish:
        query = query.where(RecordedSession.started_at <= finish)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(
            or_(
                RecordedSession.id.ilike(term),
                RecordedSession.url.ilike(term),
                RecordedSession.page_title.ilike(term),
                RecordedSession.referrer.ilike(term),
                RecordedSession.username.ilike(term),
                RecordedSession.user_agent.ilike(term),
                RecordedSession.status.ilike(term),
            )
        )
    return query


def _sorted(query: Select, sort: SortOption) -> Select:
    if sort == "oldest":
        return query.order_by(RecordedSession.started_at.asc(), RecordedSession.id)
    if sort == "events_desc":
        return query.order_by(
            RecordedSession.activity_count.desc(), RecordedSession.started_at.desc()
        )
    if sort == "events_asc":
        return query.order_by(
            RecordedSession.activity_count.asc(), RecordedSession.started_at.desc()
        )
    return query.order_by(RecordedSession.started_at.desc(), RecordedSession.id)


class SessionFilters:
    def __init__(
        self,
        q: str | None = None,
        status: str | None = None,
        site_path: str | None = None,
        username: str | None = None,
        min_events: Annotated[int | None, Query(ge=0)] = None,
        date_from: str | None = None,
        date_to: str | None = None,
        source: Literal["human", "persona"] | None = None,
    ) -> None:
        self.values = {
            "q": q,
            "status": status,
            "site_path": site_path,
            "username": username,
            "min_events": min_events,
            "date_from": date_from,
            "date_to": date_to,
            "source": source,
        }


@router.get("", response_model=ProjectInfo, operation_id="getProject")
def get_project(project_ref: str, db: Annotated[Session, Depends(get_db)]) -> ProjectInfo:
    project = resolve_project(db, project_ref)
    settings = get_settings()
    api_url = settings.public_api_url.rstrip("/")
    recorder_url = f"{api_url}/recorder/bl.js"
    snippet = (
        f'<script async src="{recorder_url}"\n'
        f'  data-project-key="{project.ingest_key}"\n'
        f'  data-api="{api_url}"></script>'
    )
    return ProjectInfo(
        id=str(project.id),
        name=project.name,
        slug=project.slug,
        site_url=project.site_url,
        ingest_key=project.ingest_key,
        allowed_origins=list(project.allowed_origins),
        retention_days=project.retention_days,
        recorder_url=recorder_url,
        api_url=api_url,
        snippet=snippet,
    )


@router.get("/sessions", response_model=SessionList, operation_id="listSessions")
def list_sessions(
    project_ref: str,
    db: Annotated[Session, Depends(get_db)],
    filters: Annotated[SessionFilters, Depends()],
    limit: Annotated[int, Query(ge=1, le=500)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    sort: SortOption = "newest",
) -> dict[str, Any]:
    project = resolve_project(db, project_ref)
    query = _filtered(project, **filters.values)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    sessions = db.scalars(_sorted(query, sort).limit(limit).offset(offset)).all()
    return {"total": total, "sessions": [_row(session) for session in sessions]}


@router.get("/sessions/stats", response_model=SessionStatsResponse, operation_id="getSessionStats")
def session_stats(
    project_ref: str,
    db: Annotated[Session, Depends(get_db)],
    filters: Annotated[SessionFilters, Depends()],
) -> dict[str, Any]:
    project = resolve_project(db, project_ref)
    sessions = db.scalars(_filtered(project, **filters.values)).all()
    total = len(sessions)
    by_status: dict[str, int] = defaultdict(int)
    by_day: dict[str, int] = defaultdict(int)
    pages: dict[str, dict[str, Any]] = {}
    events = 0
    duration = 0
    for session in sessions:
        by_status[session.status] += 1
        events += session.activity_count
        seconds = _duration_s(session)
        duration += seconds
        by_day[session.started_at.strftime("%Y-%m-%d")] += 1
        url = session.url or ""
        page = pages.setdefault(
            url,
            {
                "url": url,
                "page_title": session.page_title,
                "sessions": 0,
                "events": 0,
                "duration": 0,
            },
        )
        page["sessions"] += 1
        page["events"] += session.activity_count
        page["duration"] += seconds
    top_pages = sorted(pages.values(), key=lambda page: page["sessions"], reverse=True)[:10]
    return {
        "totals": {
            "total": total,
            "active": by_status["active"],
            "completed": by_status["completed"],
            "limit_reached": by_status["limit_reached"],
            "pending_flush": by_status["pending_flush"],
            "avg_event_count": round(events / total) if total else 0,
            "avg_duration_s": round(duration / total) if total else 0,
        },
        "timeseries": [{"day": day, "total": count} for day, count in sorted(by_day.items())],
        "topPages": [
            {
                "url": page["url"],
                "page_title": page["page_title"],
                "sessions": page["sessions"],
                "avg_event_count": round(page["events"] / page["sessions"]),
                "avg_duration_s": round(page["duration"] / page["sessions"]),
            }
            for page in top_pages
        ],
    }


def _json_array_body(chunk: bytes) -> bytes:
    """`[a,b,c]` -> `a,b,c` without re-parsing the events."""
    text = chunk.strip()
    return text[1:-1].strip() if text.startswith(b"[") and text.endswith(b"]") else b""


@router.get(
    "/sessions/{session_id}/replay",
    operation_id="getReplay",
    responses={200: {"description": "Session metadata and every recorded rrweb event."}},
)
async def get_replay(
    project_ref: str,
    session_id: str,
    db: Annotated[Session, Depends(get_db)],
    store: Annotated[ObjectStore, Depends(get_object_store)],
) -> Response:
    return await run_in_threadpool(_build_replay, db, store, project_ref, session_id)


def _build_replay(db: Session, store: ObjectStore, project_ref: str, session_id: str) -> Response:
    project = resolve_project(db, project_ref)
    session = db.get(RecordedSession, session_id)
    if session is None or session.project_id != project.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.byte_size > get_settings().max_replay_bytes:
        return JSONResponse(
            status_code=413,
            content={"errorCode": REPLAY_TOO_LARGE_CODE, "message": "This replay is too large."},
        )
    chunks = db.scalars(
        select(SessionChunk).where(SessionChunk.session_id == session_id).order_by(SessionChunk.seq)
    ).all()
    # Chunks are concatenated as stored text: no decode/re-encode of every event.
    parts = [_json_array_body(gzip.decompress(store.get(chunk.object_key))) for chunk in chunks]
    events = b",".join(part for part in parts if part)
    meta = {**_row(session), "browser_info": session.browser_info}
    head = json.dumps(
        {
            "session_id": session.id,
            "event_count": session.activity_count,
            "raw_event_count": session.event_count,
            "meta": meta,
        },
        separators=(",", ":"),
    ).encode()
    body = head[:-1] + b',"events":[' + events + b"]}"
    return Response(content=body, media_type="application/json")
