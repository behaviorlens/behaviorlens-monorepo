import React from 'react';
import { IconArrowPointerClickFilled } from '../../ui/icons';
import { createReplayElementResolver } from './behaviorLensReplayElements';

const RRWEB_FULL_SNAPSHOT = 2;
const RRWEB_INCREMENTAL = 3;
const MOUSE_INTERACTION_SOURCE = 2;
const CLICK_TYPE = 2;
const SCROLL_SOURCE = 3;
const INPUT_SOURCE = 5;
const SELECTION_SOURCE = 14;
const SEQUENCE_MAX_GAP_MS = 1000;

export const classifyEvent = event => {
  if (!event || event.type !== 3 || !event.data) {
    return null;
  }

  const { source } = event.data;

  if (source === 2) {
    if (event.data.type === 2) {
      return { kind: 'click', label: `Clicked at (${event.data.x}, ${event.data.y})` };
    }

    return { kind: 'mouse', label: `Mouse moved (${event.data.x}, ${event.data.y})` };
  }

  if (source === 5) {
    return { kind: 'input', label: 'Input changed' };
  }

  if (source === 3) {
    return { kind: 'scroll', label: `Scrolled (${event.data.x}, ${event.data.y})` };
  }

  if (source === 14) {
    return { kind: 'selection', label: 'Text selected' };
  }

  return null;
};

// Keep the original, compact Activity Log glyphs. These deliberately stay
// independent from the richer event copy below so improving a row's wording
// does not also change its familiar icon.
const EVENT_ICONS = {
  mouse: { d: 'M8 2.5v2M8 11.5v2M2.5 8h2M11.5 8h2M8 8h.01' },
  input: { d: 'M2.5 5h11v6h-11zM5 7.5h.01M7.5 7.5h.01M10 7.5h.01M5 9.5h6' },
  scroll: { d: 'M8 2.5v11M5.5 5l2.5-2.5L10.5 5M5.5 11l2.5 2.5 2.5-2.5' },
  selection: { d: 'M5 3H3.5v10H5M11 3h1.5v10H11M6.5 3h3M6.5 13h3' }
};

export const EventTypeIcon = ({ kind }) => {
  if (kind === 'click' || kind === 'rage') {
    return <IconArrowPointerClickFilled aria-hidden="true" />;
  }

  const icon = EVENT_ICONS[kind] || EVENT_ICONS.mouse;

  return (
    <svg
      viewBox="0 0 16 16"
      fill={icon.filled ? 'currentColor' : 'none'}
      stroke={icon.filled ? 'none' : 'currentColor'}
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icon.d} />
    </svg>
  );
};

export const detectRageClickIndexes = events => {
  const clickEvents = events
    .map((event, index) => ({ event, index }))
    .filter(item => item.event?.type === 3 && item.event?.data?.source === 2 && item.event?.data?.type === 2)
    .map(item => ({
      index: item.index,
      ts: Number(item.event?.timestamp || 0),
      x: Number(item.event?.data?.x || 0),
      y: Number(item.event?.data?.y || 0)
    }))
    .filter(item => Number.isFinite(item.ts));

  const rageIndexes = new Set();
  const recent = [];
  const MAX_WINDOW_MS = 1000;
  const MAX_DISTANCE_PX = 30;
  const MIN_CLICKS_FOR_RAGE = 3;

  clickEvents.forEach(click => {
    while (recent.length > 0 && click.ts - recent[0].ts > MAX_WINDOW_MS) {
      recent.shift();
    }

    recent.push(click);

    const nearby = recent.filter(candidate => {
      const dx = candidate.x - click.x;
      const dy = candidate.y - click.y;
      const distance = Math.sqrt((dx * dx) + (dy * dy));
      return distance <= MAX_DISTANCE_PX;
    });

    if (nearby.length >= MIN_CLICKS_FOR_RAGE) {
      nearby.forEach(candidate => rageIndexes.add(candidate.index));
    }
  });

  return rageIndexes;
};

const roleLabel = role => ({
  button: 'Button',
  checkbox: 'Checkbox',
  combobox: 'Dropdown',
  link: 'Link',
  radio: 'Radio option',
  textbox: 'Text field'
}[role] || (role && role !== 'unknown' ? role : 'Page element'));

const targetLabel = element => (
  element?.name ? `“${element.name}”` : roleLabel(element?.role).toLowerCase()
);

const checkedFromSnapshot = node => {
  const checked = node?.attributes?.checked;
  const ariaChecked = node?.attributes?.['aria-checked'];
  return checked === true || checked === 'true' || checked === 'checked' || ariaChecked === 'true';
};

const snapshotInputState = (resolver, nodeId, role) => {
  const node = resolver.state.nodes.get(nodeId);
  if (!node) return null;
  if (role === 'checkbox' || role === 'radio') {
    return { checked: checkedFromSnapshot(node), type: 'checked' };
  }
  const value = node.attributes?.value;
  return typeof value === 'string' ? { length: value.length, type: 'text' } : null;
};

const eventInputState = (event, role) => {
  if (role === 'checkbox' || role === 'radio') {
    return { checked: Boolean(event.data?.isChecked), type: 'checked' };
  }
  const value = event.data?.text;
  return { length: typeof value === 'string' ? value.length : 0, type: 'text' };
};

const sameInputState = (left, right) => {
  if (!left || !right || left.type !== right.type) return false;
  return left.type === 'checked'
    ? left.checked === right.checked
    : left.length === right.length;
};

const inputDetail = (start, end, count) => {
  const changes = count > 1 ? ` · ${count} changes` : '';
  if (start?.type === 'checked' && end?.type === 'checked') {
    return `${start.checked ? 'On' : 'Off'} → ${end.checked ? 'On' : 'Off'}${changes}`;
  }
  const endLength = Math.max(0, Number(end?.length) || 0);
  if (start?.type !== 'text') {
    return `${endLength} character${endLength === 1 ? '' : 's'} · Value masked${changes}`;
  }
  return `${Math.max(0, Number(start.length) || 0)} → ${endLength} characters · Value masked${changes}`;
};

const inputLabel = (element, currentState) => {
  if (element?.role === 'checkbox') {
    return `Turned ${targetLabel(element)} ${currentState.checked ? 'on' : 'off'}`;
  }
  if (element?.role === 'radio') return `Selected ${targetLabel(element)}`;
  return `${element?.role === 'combobox' ? 'Changed' : 'Edited'} ${targetLabel(element)}`;
};

const scrollDirection = (start, end) => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX > 0 ? 'right' : 'left';
  if (deltaY !== 0) return deltaY > 0 ? 'down' : 'up';
  return null;
};

const scrollTargetLabel = (element, nodeId, documentNodeId) => {
  if (nodeId === documentNodeId) return 'page';
  if (element?.name) return `“${element.name}”`;
  if (element?.role && element.role !== 'unknown') return element.role;
  return 'container';
};

const scrollDetail = (start, end, count) => {
  const horizontal = Math.abs(end.x - start.x) > Math.abs(end.y - start.y);
  const startOffset = Math.round(horizontal ? start.x : start.y);
  const endOffset = Math.round(horizontal ? end.x : end.y);
  const updates = count > 1 ? ` · ${count} scroll updates` : '';
  return `${startOffset.toLocaleString('en-US')} → ${endOffset.toLocaleString('en-US')}px${updates}`;
};

const stripActivityInternals = item => {
  const {
    _count,
    _endState,
    _endTimestamp,
    _nodeId,
    _startPosition,
    _startState,
    _target,
    ...publicItem
  } = item;
  return publicItem;
};

export const formatEventTime = timestamp => {
  if (!timestamp) {
    return '-';
  }

  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch (error) {
    return '-';
  }
};

const createClickInsight = ({ baseItem, element, event }) => {
  const x = Number(event.data?.x);
  const y = Number(event.data?.y);
  const coordinates = Number.isFinite(x) && Number.isFinite(y)
    ? ` · x ${Math.round(x)}, y ${Math.round(y)}`
    : '';
  return {
    ...baseItem,
    detail: `${baseItem.isRageClick ? 'Rage click · ' : ''}${roleLabel(element?.role)}${coordinates}`,
    kind: 'click',
    label: `${baseItem.isRageClick ? 'Rage clicked' : 'Clicked'} ${targetLabel(element)}`
  };
};

const appendInputInsight = ({
  baseItem,
  element,
  event,
  inputStates,
  insights,
  nodeId,
  resolver,
  timestamp
}) => {
  const currentState = eventInputState(event, element?.role);
  const previousState = inputStates.has(nodeId)
    ? inputStates.get(nodeId)
    : snapshotInputState(resolver, nodeId, element?.role);
  inputStates.set(nodeId, currentState);
  if (sameInputState(previousState, currentState)) return;
  if (element?.role === 'radio' && !currentState.checked) return;

  const previous = insights[insights.length - 1];
  if (previous?.kind === 'input'
    && previous._nodeId === nodeId
    && timestamp - previous._endTimestamp <= SEQUENCE_MAX_GAP_MS) {
    previous._count += 1;
    previous._endState = currentState;
    previous._endTimestamp = timestamp;
    previous.detail = inputDetail(previous._startState, currentState, previous._count);
    return;
  }

  insights.push({
    ...baseItem,
    _count: 1,
    _endState: currentState,
    _endTimestamp: timestamp,
    _nodeId: nodeId,
    _startState: previousState,
    detail: inputDetail(previousState, currentState, 1),
    kind: 'input',
    label: inputLabel(element, currentState)
  });
};

const appendScrollInsight = ({
  baseItem,
  documentNodeId,
  element,
  event,
  insights,
  nodeId,
  scrollStates,
  timestamp
}) => {
  const current = {
    x: Number(event.data?.x) || 0,
    y: Number(event.data?.y) || 0
  };
  const previousPosition = scrollStates.get(nodeId) || { x: 0, y: 0 };
  scrollStates.set(nodeId, current);
  if (Math.round(previousPosition.x) === Math.round(current.x)
    && Math.round(previousPosition.y) === Math.round(current.y)) return;

  const previous = insights[insights.length - 1];
  if (previous?.kind === 'scroll'
    && previous._nodeId === nodeId
    && timestamp - previous._endTimestamp <= SEQUENCE_MAX_GAP_MS) {
    previous._count += 1;
    previous._endTimestamp = timestamp;
    const direction = scrollDirection(previous._startPosition, current);
    previous.label = `Scrolled ${previous._target}${direction ? ` ${direction}` : ''}`;
    previous.detail = scrollDetail(previous._startPosition, current, previous._count);
    return;
  }

  const target = scrollTargetLabel(element, nodeId, documentNodeId);
  const direction = scrollDirection(previousPosition, current);
  insights.push({
    ...baseItem,
    _count: 1,
    _endTimestamp: timestamp,
    _nodeId: nodeId,
    _startPosition: previousPosition,
    _target: target,
    detail: scrollDetail(previousPosition, current, 1),
    kind: 'scroll',
    label: `Scrolled ${target}${direction ? ` ${direction}` : ''}`
  });
};

// Builds privacy-safe, human-readable Activity Log rows from rrweb's raw
// incrementals. Snapshot state supplies the "before" side of input and scroll
// changes; rapid changes on the same target are condensed into one row.
export const buildActivityInsights = events => {
  const list = Array.isArray(events) ? events : [];
  const rageClickIndexes = detectRageClickIndexes(list);
  const resolver = createReplayElementResolver();
  const inputStates = new Map();
  const scrollStates = new Map();
  const insights = [];
  let documentNodeId = null;

  list.forEach((event, index) => {
    if (event?.type === RRWEB_FULL_SNAPSHOT) {
      documentNodeId = Number(event.data?.node?.id);
      inputStates.clear();
      scrollStates.clear();
      if (Number.isFinite(documentNodeId)) {
        scrollStates.set(documentNodeId, {
          x: Math.max(0, Number(event.data?.initialOffset?.left) || 0),
          y: Math.max(0, Number(event.data?.initialOffset?.top) || 0)
        });
      }
    }
    resolver.processEvent(event);
    if (event?.type !== RRWEB_INCREMENTAL) return;

    const source = event.data?.source;
    const nodeId = Number(event.data?.id);
    const timestamp = Number(event.timestamp || 0);
    const element = Number.isFinite(nodeId) ? resolver.resolve(nodeId) : null;
    const baseItem = {
      id: `${index}-${timestamp}`,
      isRageClick: rageClickIndexes.has(index),
      timeLabel: formatEventTime(timestamp),
      timestamp
    };

    if (source === MOUSE_INTERACTION_SOURCE && event.data?.type === CLICK_TYPE) {
      insights.push(createClickInsight({ baseItem, element, event }));
      return;
    }

    if (source === INPUT_SOURCE && Number.isFinite(nodeId)) {
      appendInputInsight({
        baseItem,
        element,
        event,
        inputStates,
        insights,
        nodeId,
        resolver,
        timestamp
      });
      return;
    }

    if (source === SCROLL_SOURCE && Number.isFinite(nodeId)) {
      appendScrollInsight({
        baseItem,
        documentNodeId,
        element,
        event,
        insights,
        nodeId,
        scrollStates,
        timestamp
      });
      return;
    }

    const classified = classifyEvent(event);
    if (!classified) return;
    const ranges = Array.isArray(event.data?.ranges) ? event.data.ranges.length : 0;
    insights.push({
      ...baseItem,
      detail: source === SELECTION_SOURCE && ranges > 0
        ? `${ranges} selected range${ranges === 1 ? '' : 's'}`
        : null,
      kind: classified.kind,
      label: classified.label
    });
  });

  return insights.map(stripActivityInternals);
};

// Consecutive detected rage clicks within this gap belong to one timeline zone.
export const RAGE_ZONE_GAP_MS = 2000;
export const RAGE_ZONE_MIN_MS = 400;

export const clusterRageClickZones = events => {
  const sessionEvents = Array.isArray(events) ? events : [];
  const timestamps = Array.from(detectRageClickIndexes(sessionEvents))
    .map(index => Number(sessionEvents[index]?.timestamp || 0))
    .filter(timestamp => timestamp > 0)
    .sort((left, right) => left - right);

  return timestamps.reduce((zones, timestamp) => {
    const last = zones[zones.length - 1];
    if (last && timestamp - last.endTs <= RAGE_ZONE_GAP_MS) {
      last.endTs = timestamp;
      last.count += 1;
      return zones;
    }

    zones.push({
      count: 1,
      endTs: timestamp,
      startTs: timestamp
    });
    return zones;
  }, []);
};
