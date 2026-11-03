import gzip
import json
from datetime import UTC, datetime, timedelta

import pytest

from app import ingest, sessions_api
from app.activity import count_activity
from app.config import get_settings
from app.models import RecordedSession, SessionChunk, SessionStats
from app.processing import compute_stats
from app.session_lifecycle import close_idle_sessions
from app.tasks import process_session_now, refresh_activity_counts

from .conftest import PROJECT_KEY, PROJECT_ORIGIN, Harness

SESSION = "a" * 36
T0 = 1_793_000_000_000


def page_events(href: str, start: int) -> list[dict]:
    return [
        {"type": 4, "timestamp": start, "data": {"href": href, "width": 1280, "height": 800}},
        {"type": 2, "timestamp": start + 1, "data": {"node": {"id": 1}}},
        {"type": 3, "timestamp": start + 500, "data": {"source": 2, "type": 2, "id": 9}},
        {"type": 3, "timestamp": start + 900, "data": {"source": 5, "id": 12, "text": "***"}},
        {
            "type": 5,
            "timestamp": start + 501,
            "data": {"tag": "bl.interaction", "payload": {"type": "click"}},
        },
    ]


META = {
    "url": f"{PROJECT_ORIGIN}/cart",
    "referrer": "https://search.example/",
    "title": "Your cart",
    "userAgent": "Mozilla/5.0 Test",
    "viewport": {"width": 1280, "height": 800},
    "username": "Avery Park",
}


def send(
    harness: Harness,
    *,
    session: str = SESSION,
    seq: int = 0,
    events: list[dict] | None = None,
    meta: dict | None = None,
    headers: dict | None = None,
    gzip_body: bool = False,
):
    payload = {"seq": seq, "events": events if events is not None else page_events("/", T0)}
    if meta is not None:
        payload["meta"] = meta
    body = json.dumps(payload).encode()
    request_headers = {"X-BL-Project-Key": PROJECT_KEY, "Origin": PROJECT_ORIGIN, **(headers or {})}
    if gzip_body:
        body = gzip.compress(body)
        request_headers["Content-Encoding"] = "gzip"
    request_headers["Content-Type"] = "application/json"
    return harness.client.post(
        f"/ingest/v1/sessions/{session}/events", content=body, headers=request_headers
    )


def patch_settings(monkeypatch: pytest.MonkeyPatch, **values) -> None:
    settings = get_settings().model_copy(update=values)
    monkeypatch.setattr(ingest, "get_settings", lambda: settings)
    monkeypatch.setattr(sessions_api, "get_settings", lambda: settings)


def test_batch_creates_session_and_stores_chunk(harness: Harness) -> None:
    response = send(harness, meta=META)
    assert response.status_code == 202
    assert response.json()["accepted"] is True
    with harness.make_session() as db:
        session = db.get(RecordedSession, SESSION)
        assert session is not None
        assert session.url == META["url"]
        assert session.username == "Avery Park"
        assert session.source == "human"
        assert session.event_count == 5
        assert session.status == "active"
    (key,) = harness.store.keys()
    assert json.loads(gzip.decompress(harness.store.get(key)))[0]["type"] == 4


@pytest.mark.parametrize(
    ("headers", "status", "code"),
    [
        ({"X-BL-Project-Key": ""}, 401, "MISSING_KEY"),
        ({"X-BL-Project-Key": "pk_wrong"}, 401, "INVALID_KEY"),
        ({"Origin": "https://evil.example"}, 403, "ORIGIN_NOT_ALLOWED"),
    ],
)
def test_rejects_bad_key_or_origin(harness: Harness, headers: dict, status: int, code: str) -> None:
    response = send(harness, headers=headers)
    assert response.status_code == status
    assert response.json()["errorCode"] == code
    assert harness.store.keys() == []


def test_server_side_sender_without_origin_is_accepted(harness: Harness) -> None:
    payload = json.dumps({"seq": 0, "key": PROJECT_KEY, "events": page_events("/", T0)})
    response = harness.client.post(
        f"/ingest/v1/sessions/{SESSION}/events",
        content=payload,
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 202


def test_duplicate_seq_is_ignored(harness: Harness) -> None:
    assert send(harness, meta=META).status_code == 202
    retry = send(harness, meta=META)
    assert retry.status_code == 202
    assert retry.json() == {"accepted": False, "duplicate": True, "sessionId": SESSION, "seq": 0}
    with harness.make_session() as db:
        session = db.get(RecordedSession, SESSION)
        assert session is not None
        assert session.event_count == 5
        assert session.chunk_count == 1


def test_gzip_batches_are_accepted(harness: Harness) -> None:
    assert send(harness, meta=META, gzip_body=True).status_code == 202


def test_oversized_batch_is_rejected(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    patch_settings(monkeypatch, max_batch_bytes=200)
    response = send(harness, meta=META)
    assert response.status_code == 413
    assert response.json()["errorCode"] == "BATCH_TOO_LARGE"


def test_session_storage_limit_marks_limit_reached(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    assert send(harness, meta=META).status_code == 202
    patch_settings(monkeypatch, max_session_bytes=10)
    response = send(harness, seq=1, events=page_events("/next", T0 + 5000))
    assert response.status_code == 413
    assert response.json()["errorCode"] == "BEHAVIORLENS_REPLAY_TOO_LARGE"
    with harness.make_session() as db:
        session = db.get(RecordedSession, SESSION)
        assert session is not None
        assert session.status == "limit_reached"


def test_invalid_session_id_is_rejected(harness: Harness) -> None:
    assert send(harness, session="bad id!").status_code == 422


def test_cors_preflight_is_answered_for_any_origin(harness: Harness) -> None:
    response = harness.client.options(
        f"/ingest/v1/sessions/{SESSION}/events",
        headers={"Origin": "https://anything.example", "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 204
    assert response.headers["access-control-allow-origin"] == "https://anything.example"


def test_list_filters_sort_and_stats(harness: Harness) -> None:
    send(harness, session="s" * 36, meta={**META, "url": f"{PROJECT_ORIGIN}/cart"})
    send(
        harness,
        session="t" * 36,
        meta={**META, "url": f"{PROJECT_ORIGIN}/products/p1", "username": "Jordan Lee"},
        events=page_events("/products/p1", T0 + 86_400_000) * 3,
    )
    base = "/api/v1/projects/shop/sessions"
    # Each page_events() is one click and one input: 2 activity entries.
    assert refresh_activity_counts() == 2
    listing = harness.client.get(base).json()
    assert listing["total"] == 2
    assert [row["event_count"] for row in listing["sessions"]] == [6, 2]
    assert [row["raw_event_count"] for row in listing["sessions"]] == [15, 5]
    assert [row["id"] for row in listing["sessions"]] == ["t" * 36, "s" * 36]  # newest first
    assert listing["sessions"][0]["ip_address"] is None
    # Start times are UTC with an explicit zone, e.g. 2026-10-26T08:53:20Z.
    assert listing["sessions"][0]["started_at"].endswith("Z")
    assert "T" in listing["sessions"][0]["started_at"]

    assert harness.client.get(base, params={"q": "jordan"}).json()["total"] == 1
    assert harness.client.get(base, params={"min_events": 3}).json()["total"] == 1
    assert harness.client.get(base, params={"site_path": "/cart"}).json()["total"] == 1
    events_asc = harness.client.get(base, params={"sort": "events_asc"}).json()
    assert events_asc["sessions"][0]["id"] == "s" * 36

    stats = harness.client.get(f"{base}/stats").json()
    assert stats["totals"]["total"] == 2
    assert stats["totals"]["active"] == 2
    assert len(stats["timeseries"]) == 2
    assert stats["topPages"][0]["sessions"] == 1


def test_replay_joins_chunks_in_order(harness: Harness) -> None:
    send(harness, seq=0, meta=META, events=page_events("/", T0))
    send(harness, seq=1, events=page_events("/cart", T0 + 2000))
    replay = harness.client.get(f"/api/v1/projects/shop/sessions/{SESSION}/replay").json()
    assert replay["session_id"] == SESSION
    assert replay["raw_event_count"] == 10
    assert [event["timestamp"] for event in replay["events"]][:2] == [T0, T0 + 1]
    assert replay["events"][5]["data"]["href"] == "/cart"
    assert replay["meta"]["username"] == "Avery Park"
    assert "browser_info" in replay["meta"]


def test_replay_over_the_cap_answers_413(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    send(harness, meta=META)
    patch_settings(monkeypatch, max_replay_bytes=10)
    response = harness.client.get(f"/api/v1/projects/shop/sessions/{SESSION}/replay")
    assert response.status_code == 413
    assert response.json()["errorCode"] == "BEHAVIORLENS_REPLAY_TOO_LARGE"


def test_end_closes_session_and_processing_computes_stats(harness: Harness) -> None:
    send(harness, seq=0, meta=META, events=page_events("/", T0))
    send(harness, seq=1, events=page_events("/cart", T0 + 2000))
    response = harness.client.post(f"/ingest/v1/sessions/{SESSION}/end", json={"key": PROJECT_KEY})
    assert response.json()["status"] == "completed"
    assert harness.enqueued == [SESSION]
    assert process_session_now(SESSION) is True
    with harness.make_session() as db:
        stats = db.get(SessionStats, SESSION)
        assert stats is not None
        assert stats.page_views == ["/", "/cart"]
        assert stats.click_count == 2
        assert stats.input_count == 2
        assert stats.interaction_count == 2
        assert stats.duration_ms == 2900
        session = db.get(RecordedSession, SESSION)
        assert session is not None
        assert session.processing_state == "ready"
        assert session.activity_count == 4
        assert session.activity_counted_at is not None


def test_idle_sessions_are_closed(harness: Harness) -> None:
    send(harness, meta=META)
    with harness.make_session() as db:
        later = datetime.now(UTC) + timedelta(hours=1)
        assert close_idle_sessions(db, idle_seconds=600, now=later) == [SESSION]
        session = db.get(RecordedSession, SESSION)
        assert session is not None
        assert session.status == "completed"
        assert db.query(SessionChunk).count() == 1


def test_project_info_includes_snippet(harness: Harness) -> None:
    info = harness.client.get("/api/v1/projects/shop").json()
    assert info["ingest_key"] == PROJECT_KEY
    assert 'data-project-key="pk_test_project"' in info["snippet"]
    assert harness.client.get(f"/api/v1/projects/{harness.project_id}").status_code == 200
    assert harness.client.get("/api/v1/projects/missing").status_code == 404


def test_compute_stats_ignores_malformed_events() -> None:
    stats = compute_stats(
        [{"type": 3}, {"timestamp": "x"}, {"type": 4, "timestamp": 5, "data": {}}]
    )
    assert stats.page_views == []
    assert stats.duration_ms == 0


def test_refresh_skips_sessions_counted_since_their_last_batch(harness: Harness) -> None:
    send(harness, meta=META)
    assert refresh_activity_counts() == 1
    assert refresh_activity_counts() == 0
    send(harness, seq=1, events=page_events("/cart", T0 + 2000))
    assert refresh_activity_counts() == 1


def _click(ts: int) -> dict:
    return {"type": 3, "timestamp": ts, "data": {"source": 2, "type": 2, "id": 5}}


def _input(ts: int, node: int, **data) -> dict:
    return {"type": 3, "timestamp": ts, "data": {"source": 5, "id": node, **data}}


def _scroll(ts: int, node: int, y: int) -> dict:
    return {"type": 3, "timestamp": ts, "data": {"source": 3, "id": node, "x": 0, "y": y}}


SNAPSHOT = {
    "type": 2,
    "timestamp": T0,
    "data": {
        "node": {
            "id": 1,
            "childNodes": [
                {"id": 10, "tagName": "input", "attributes": {"value": ""}},
                {"id": 11, "tagName": "input", "attributes": {"type": "checkbox"}},
                {"id": 12, "tagName": "input", "attributes": {"type": "radio"}},
            ],
        },
        "initialOffset": {"left": 0, "top": 0},
    },
}


def test_count_activity_matches_the_activity_log_rules() -> None:
    events = [
        SNAPSHOT,
        _click(T0 + 100),
        # Typing into one field within a second per keystroke: one entry.
        _input(T0 + 200, 10, text="*"),
        _input(T0 + 400, 10, text="**"),
        _input(T0 + 600, 10, text="***"),
        # Same length again: unchanged, skipped.
        _input(T0 + 700, 10, text="***"),
        # Mouse moves, mouse down/up and focus never count.
        {"type": 3, "timestamp": T0 + 800, "data": {"source": 1, "positions": []}},
        {"type": 3, "timestamp": T0 + 900, "data": {"source": 2, "type": 5, "id": 10}},
        # Checkbox toggles count; an unchecked radio does not.
        _input(T0 + 1000, 11, isChecked=True),
        _input(T0 + 1100, 12, isChecked=False),
        # One scroll run, then a scroll more than a second later.
        _scroll(T0 + 2000, 1, 100),
        _scroll(T0 + 2500, 1, 300),
        _scroll(T0 + 4000, 1, 500),
        # A scroll that does not move is skipped.
        _scroll(T0 + 4100, 1, 500),
        {"type": 3, "timestamp": T0 + 5000, "data": {"source": 14, "ranges": [{}]}},
        {"type": 5, "timestamp": T0 + 5001, "data": {"tag": "bl.interaction"}},
    ]
    # click, typing run, checkbox, scroll run, scroll, selection
    assert count_activity(events) == 6
    assert count_activity([]) == 0
