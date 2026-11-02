"""Turns a closed session's events into the numbers stored in session_stats."""

from dataclasses import dataclass, field
from typing import Any

# rrweb event and incremental-source codes.
FULL_SNAPSHOT = 2
INCREMENTAL = 3
META = 4
CUSTOM = 5
SOURCE_MOUSE_INTERACTION = 2
SOURCE_SCROLL = 3
SOURCE_INPUT = 5
MOUSE_CLICK = 2


@dataclass
class ComputedStats:
    duration_ms: int = 0
    page_views: list[str] = field(default_factory=list)
    click_count: int = 0
    input_count: int = 0
    scroll_count: int = 0
    interaction_count: int = 0


def compute_stats(events: list[dict[str, Any]]) -> ComputedStats:
    stats = ComputedStats()
    stamps = [event["timestamp"] for event in events if isinstance(event.get("timestamp"), int)]
    if stamps:
        stats.duration_ms = max(stamps) - min(stamps)
    pending_href: str | None = None
    for event in events:
        kind = event.get("type")
        data = event.get("data") or {}
        if kind == META:
            pending_href = data.get("href")
        elif kind == FULL_SNAPSHOT:
            # Each Meta + FullSnapshot pair is one page view.
            stats.page_views.append(pending_href or "")
            pending_href = None
        elif kind == INCREMENTAL:
            source = data.get("source")
            if source == SOURCE_MOUSE_INTERACTION and data.get("type") == MOUSE_CLICK:
                stats.click_count += 1
            elif source == SOURCE_INPUT:
                stats.input_count += 1
            elif source == SOURCE_SCROLL:
                stats.scroll_count += 1
        elif kind == CUSTOM and data.get("tag") == "bl.interaction":
            stats.interaction_count += 1
    return stats
