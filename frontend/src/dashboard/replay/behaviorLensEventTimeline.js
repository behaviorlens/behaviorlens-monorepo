import { RAGE_ZONE_MIN_MS } from '../shared/behaviorLensEvents';

// Interaction flags on the replay progress bar.
//
// rrweb-player only draws markers for custom events (type 5) and inactive
// periods, so clicks/inputs/scrolls/selections were invisible on the
// timeline. This mounts a marker layer using the same DOM approach as
// behaviorLensRageTimeline: an absolutely positioned layer inside .rr-progress,
// so rrweb keeps ownership of the track itself and its drag/seek behaviour.
//
// Every marker is placed from a REAL derived event timestamp. Nothing is
// synthesised, and event kinds/colours come from the existing derivation.

// Kinds that earn a flag. Mouse-move is deliberately excluded: it would
// carpet the track without telling the reviewer anything.
const FLAGGED_KINDS = new Set(['click', 'input', 'scroll', 'selection']);
const ACTIVITY_TICK_WIDTH_PERCENT = 0.7;

export const EVENT_MARKER_COLORS = {
  click: '#1463ff',
  input: '#7c3aed',
  scroll: '#0f9d58',
  selection: '#d97706',
  rage: '#dc2626'
};

// Markers closer together than this share one slot, so a dense burst renders
// as a single readable flag rather than an unreadable smear.
export const MARKER_MERGE_MS = 400;
export const MARKER_MAX_SLOTS = 64;

const MARKER_KIND_PRIORITY = {
  scroll: 0,
  selection: 1,
  click: 2,
  input: 3,
  rage: 4
};

export const buildTimelineMarkers = (insights, { durationMs, firstTimestamp } = {}) => {
  if (!Array.isArray(insights) || !(durationMs > 0)) {
    return [];
  }

  const candidates = insights
    .filter(item => FLAGGED_KINDS.has(item?.kind) || item?.isRageClick)
    .map(item => ({
      kind: item.isRageClick ? 'rage' : item.kind,
      label: item.label,
      offsetMs: Math.max(0, Math.min(durationMs, Number(item.timestamp) - Number(firstTimestamp)))
    }))
    .filter(item => Number.isFinite(item.offsetMs))
    .sort((left, right) => left.offsetMs - right.offsetMs);

  // Keep at most roughly one marker per visual slot. Long recordings otherwise
  // turn the timeline into a barcode even when events are seconds apart.
  const mergeWindowMs = Math.max(MARKER_MERGE_MS, durationMs / MARKER_MAX_SLOTS);

  // Collapse near-simultaneous markers; the most actionable kind wins its slot.
  return candidates.reduce((markers, candidate) => {
    const previous = markers[markers.length - 1];
    if (previous && candidate.offsetMs - previous.offsetMs < mergeWindowMs) {
      previous.count += 1;
      if (MARKER_KIND_PRIORITY[candidate.kind] > MARKER_KIND_PRIORITY[previous.kind]) {
        previous.kind = candidate.kind;
        previous.label = candidate.label;
      }
      return markers;
    }
    markers.push({ ...candidate, count: 1 });
    return markers;
  }, []);
};

const clampOffset = (value, durationMs) => Math.min(durationMs, Math.max(0, value));

// Colored activity strip above the workspace scrubber. Rage is painted as a
// zone; other derived events are ticks. Mouse-moves stay out.
export const buildActivityStripSegments = ({
  durationMs, firstTimestamp, insights, zones
} = {}) => {
  if (!(durationMs > 0)) {
    return [];
  }

  const ticks = buildTimelineMarkers(insights, { durationMs, firstTimestamp }).map(marker => ({
    color: EVENT_MARKER_COLORS[marker.kind] || EVENT_MARKER_COLORS.click,
    id: `tick-${marker.kind}-${marker.offsetMs}`,
    kind: marker.kind,
    label: marker.count > 1 ? `${marker.label} (${marker.count} events)` : marker.label,
    offsetMs: marker.offsetMs,
    startPercent: (marker.offsetMs / durationMs) * 100,
    type: 'tick',
    widthPercent: ACTIVITY_TICK_WIDTH_PERCENT
  }));

  const rageZones = (Array.isArray(zones) ? zones : []).map((zone, index) => {
    const startOffset = clampOffset(Number(zone.startTs) - Number(firstTimestamp), durationMs);
    const rawEndOffset = clampOffset(Number(zone.endTs) - Number(firstTimestamp), durationMs);
    const endOffset = clampOffset(
      Math.max(rawEndOffset, startOffset + RAGE_ZONE_MIN_MS),
      durationMs
    );
    const width = Math.max(0, endOffset - startOffset);
    if (!(width > 0)) {
      return null;
    }
    return {
      color: EVENT_MARKER_COLORS.rage,
      id: `rage-${index}-${zone.startTs}`,
      kind: 'rage',
      label: zone.count > 1 ? `${zone.count} rage clicks` : 'Rage click',
      offsetMs: startOffset,
      startPercent: (startOffset / durationMs) * 100,
      type: 'zone',
      widthPercent: (width / durationMs) * 100
    };
  }).filter(Boolean);

  return [...rageZones, ...ticks];
};

export const mountEventTimelineMarkers = ({
  durationMs,
  firstTimestamp,
  insights,
  onSeek,
  progressEl
}) => {
  const markers = buildTimelineMarkers(insights, { durationMs, firstTimestamp });
  if (!progressEl || markers.length === 0) {
    return () => {};
  }

  const layer = document.createElement('div');
  layer.className = 'behaviorlens-event-markers';
  layer.dataset.testid = 'behaviorlens-event-markers';

  markers.forEach(marker => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'behaviorlens-event-marker';
    button.dataset.testid = 'behaviorlens-event-marker';
    button.dataset.kind = marker.kind;
    button.style.left = `${(marker.offsetMs / durationMs) * 100}%`;
    button.style.setProperty('--behaviorlens-marker-color', EVENT_MARKER_COLORS[marker.kind] || EVENT_MARKER_COLORS.click);

    const suffix = marker.count > 1 ? ` (${marker.count} events)` : '';
    const description = `${marker.label}${suffix}`;
    button.setAttribute('aria-label', description);
    button.setAttribute('title', description);

    // mousedown, matching the rage zones: rrweb starts its drag-to-seek on
    // mousedown, so seeking here first keeps the two from fighting.
    const seek = event => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onSeek === 'function') {
        onSeek(marker.offsetMs);
      }
    };
    button.addEventListener('mousedown', seek);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    layer.appendChild(button);
  });

  progressEl.appendChild(layer);
  return () => {
    if (layer.parentNode) {
      layer.parentNode.removeChild(layer);
    }
  };
};
