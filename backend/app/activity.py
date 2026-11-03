"""Counts a session's activity the way the replay's Activity Log and its graph do.

Mirrors buildActivityInsights in frontend (behaviorLensEvents.js), minus the
"mouse" rows the graph hides: every click is one entry; inputs and scrolls on
the same element less than a second apart are one entry; inputs that leave the
value length (or checked state) unchanged, unchecked radios and scrolls that
do not move are skipped; text selections count. Mouse moves, mouse down/up,
focus/blur, DOM mutations and snapshots do not count.
"""

from typing import Any

FULL_SNAPSHOT = 2
INCREMENTAL = 3
SOURCE_MUTATION = 0
SOURCE_MOUSE_INTERACTION = 2
SOURCE_SCROLL = 3
SOURCE_INPUT = 5
SOURCE_SELECTION = 14
MOUSE_CLICK = 2
SEQUENCE_MAX_GAP_MS = 1000
SAFE_EXPLICIT_CHECK_ROLES = {"checkbox", "radio"}


def _index_tree(nodes: dict[int, dict[str, Any]], node: Any) -> None:
    stack = [node]
    while stack:
        current = stack.pop()
        if not isinstance(current, dict):
            continue
        node_id = current.get("id")
        if isinstance(node_id, int):
            nodes[node_id] = {
                "tag": str(current.get("tagName") or "").lower(),
                "attributes": dict(current.get("attributes") or {}),
            }
        stack.extend(current.get("childNodes") or [])


def _apply_mutation(nodes: dict[int, dict[str, Any]], data: dict[str, Any]) -> None:
    for removal in data.get("removes") or []:
        removed_id = (removal or {}).get("id")
        if isinstance(removed_id, int):
            nodes.pop(removed_id, None)
    for add in data.get("adds") or []:
        _index_tree(nodes, (add or {}).get("node"))
    for change in data.get("attributes") or []:
        node_id = (change or {}).get("id")
        node = nodes.get(node_id) if isinstance(node_id, int) else None
        attributes = (change or {}).get("attributes")
        if node is None or not isinstance(attributes, dict):
            continue
        for name, value in attributes.items():
            if value is None or value is False:
                node["attributes"].pop(name, None)
            else:
                node["attributes"][name] = value


def _role(node: dict[str, Any] | None) -> str | None:
    if node is None:
        return None
    attributes = node["attributes"]
    explicit = str(attributes.get("role") or "").strip().lower()
    if explicit in SAFE_EXPLICIT_CHECK_ROLES:
        return explicit
    if node["tag"] == "input":
        kind = str(attributes.get("type") or "").lower()
        if kind in SAFE_EXPLICIT_CHECK_ROLES:
            return kind
    return None


def _snapshot_state(node: dict[str, Any] | None, role: str | None) -> tuple | None:
    if node is None:
        return None
    attributes = node["attributes"]
    if role in SAFE_EXPLICIT_CHECK_ROLES:
        checked = attributes.get("checked")
        aria_checked = attributes.get("aria-checked") == "true"
        return ("checked", checked in (True, "true", "checked") or aria_checked)
    value = attributes.get("value")
    return ("text", len(value)) if isinstance(value, str) else None


def _continues_run(last: list[Any], kind: str, node_id: int, timestamp: int) -> bool:
    return last[0] == kind and last[1] == node_id and timestamp - last[2] <= SEQUENCE_MAX_GAP_MS


def count_activity(events: list[dict[str, Any]]) -> int:
    nodes: dict[int, dict[str, Any]] = {}
    input_states: dict[int, tuple | None] = {}
    scroll_states: dict[int, tuple[int, int]] = {}
    count = 0
    # The last counted entry, for merging runs: (kind, node id, end timestamp).
    last: list[Any] = [None, None, 0]

    for event in events:
        kind = event.get("type")
        data = event.get("data") or {}
        if kind == FULL_SNAPSHOT:
            nodes.clear()
            input_states.clear()
            scroll_states.clear()
            root = data.get("node") or {}
            _index_tree(nodes, root)
            if isinstance(root.get("id"), int):
                offset = data.get("initialOffset") or {}
                scroll_states[root["id"]] = (
                    round(max(0, offset.get("left") or 0)),
                    round(max(0, offset.get("top") or 0)),
                )
            continue
        if kind != INCREMENTAL:
            continue

        source = data.get("source")
        if source == SOURCE_MUTATION:
            _apply_mutation(nodes, data)
            continue
        timestamp = event.get("timestamp") or 0
        node_id = data.get("id")

        if source == SOURCE_MOUSE_INTERACTION and data.get("type") == MOUSE_CLICK:
            count += 1
            last = ["click", None, timestamp]
        elif source == SOURCE_INPUT and isinstance(node_id, int):
            role = _role(nodes.get(node_id))
            if role in SAFE_EXPLICIT_CHECK_ROLES:
                current: tuple = ("checked", bool(data.get("isChecked")))
            else:
                text = data.get("text")
                current = ("text", len(text) if isinstance(text, str) else 0)
            previous = (
                input_states[node_id]
                if node_id in input_states
                else _snapshot_state(nodes.get(node_id), role)
            )
            input_states[node_id] = current
            if previous == current or (role == "radio" and not current[1]):
                continue
            if _continues_run(last, "input", node_id, timestamp):
                last[2] = timestamp
                continue
            count += 1
            last = ["input", node_id, timestamp]
        elif source == SOURCE_SCROLL and isinstance(node_id, int):
            position = (round(data.get("x") or 0), round(data.get("y") or 0))
            previous_position = scroll_states.get(node_id, (0, 0))
            scroll_states[node_id] = position
            if previous_position == position:
                continue
            if _continues_run(last, "scroll", node_id, timestamp):
                last[2] = timestamp
                continue
            count += 1
            last = ["scroll", node_id, timestamp]
        elif source == SOURCE_SELECTION:
            count += 1
            last = ["selection", None, timestamp]
        elif source == SOURCE_MOUSE_INTERACTION:
            # Mouse down/up, focus and blur are "mouse" rows: listed but not counted.
            # They still end a run, as they sit between entries in the log.
            last = ["mouse", None, timestamp]
    return count
