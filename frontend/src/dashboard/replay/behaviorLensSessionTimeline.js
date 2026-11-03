import { detectRageClickIndexes, clusterRageClickZones } from '../shared/behaviorLensEvents';
import { parseBehaviorLensNoteTimestamps } from '../shared/behaviorLensNoteTimestamps';

export const SESSION_TIMELINE_KINDS = {
  rage: { label: 'Rage click', color: '#dc3434', shape: 'diamond' },
  submit: { label: 'Form submit', color: '#0795a2', shape: 'square' },
  navigation: { label: 'Navigation', color: '#07865e', shape: 'circle' },
  comment: { label: 'Comment', color: '#bd7900', shape: 'circle' },
  click: { label: 'Mouse click', color: '#1477c9', shape: 'tick' },
  input: { label: 'Keyboard', color: '#8456bd', shape: 'tick' },
  scroll: { label: 'Scroll', color: '#aaa79e', shape: 'tick' }
};

const CUSTOM_SIGNALS = {
  'behaviorlens-page-start': { kind: 'navigation', label: 'Form Builder' },
  'behaviorlens-add-field': { kind: 'click', label: 'Add field' },
  'behaviorlens-advanced-settings': { kind: 'click', label: 'Advanced settings' },
  'advanced-designer-opened': { kind: 'navigation', label: 'Advanced Designer' },
  'behaviorlens-preview-form': { kind: 'submit', label: 'Preview form' },
  'behaviorlens-form-submitted': { kind: 'submit', label: 'Form submitted' },
  'behaviorlens-page-result': { kind: 'navigation', label: 'Form preview' }
};

const clampOffset = (offsetMs, duration) => Math.min(duration, Math.max(0, offsetMs));

const toOffset = (timestamp, firstTimestamp, duration) => (
  clampOffset(Number(timestamp) - firstTimestamp, duration)
);

const buildCustomSignals = (events, firstTimestamp, duration) => events
  .filter(event => Number(event?.type) === 5 && CUSTOM_SIGNALS[event?.data?.tag])
  .map((event, index) => {
    const definition = CUSTOM_SIGNALS[event.data.tag];
    return {
      id: `custom-${event.data.tag}-${index}`,
      kind: definition.kind,
      label: event.data?.payload?.label || definition.label,
      offsetMs: toOffset(event.timestamp, firstTimestamp, duration),
      source: 'replay'
    };
  });

const buildRageSignals = (events, firstTimestamp, duration) => (
  clusterRageClickZones(events).map((zone, index) => ({
    id: `rage-${index}-${zone.startTs}`,
    kind: 'rage',
    label: `${zone.count} clicks · Submit`,
    offsetMs: toOffset(zone.startTs, firstTimestamp, duration),
    source: 'replay',
    count: zone.count
  }))
);

export const getNoteSignal = (note, duration) => {
  const tokens = parseBehaviorLensNoteTimestamps(note?.text);
  const legacyTimestamp = tokens.find(token => token.type === 'timestamp');
  const storedOffset = Number(note?.replay_time_ms);
  const offsetMs = Number.isFinite(storedOffset) && storedOffset >= 0
    ? storedOffset
    : legacyTimestamp?.offsetMs;
  if (!Number.isFinite(offsetMs)) {
    return null;
  }
  const label = String(note?.text || '')
    .trim()
    .replace(/^[-–—·:\s]+/, '')
    .slice(0, 44) || 'Session note';
  const author = String(note?.created_by || '').trim();
  return {
    id: `note-${note.id}`,
    kind: 'comment',
    label: author ? `${author}: ${label}` : label,
    offsetMs: clampOffset(offsetMs, duration),
    noteId: note.id,
    source: 'note'
  };
};

export const collectTimestampedNotes = (notes, duration) => (
  (Array.isArray(notes) ? notes : [])
    .map(note => getNoteSignal(note, duration))
    .filter(Boolean)
);

const buildCommentSignals = (notes, comments, duration) => {
  const realNotes = collectTimestampedNotes(notes, duration);
  if (realNotes.length > 0) {
    return realNotes;
  }
  return (Array.isArray(comments) ? comments : []).map((comment, index) => ({
    id: comment.id || `comment-${index}`,
    kind: 'comment',
    label: comment.label,
    offsetMs: clampOffset(Number(comment.offsetMs) || 0, duration),
    source: 'mock-display'
  }));
};

const buildRoutineCandidates = (events, firstTimestamp, duration) => {
  const rageIndexes = detectRageClickIndexes(events);
  return events.map((event, index) => {
    if (Number(event?.type) !== 3) {
      return null;
    }
    const source = Number(event?.data?.source);
    if (source === 2 && Number(event?.data?.type) === 2 && !rageIndexes.has(index)) {
      return { kind: 'click', label: 'Mouse click' };
    }
    if (source === 5) {
      return { kind: 'input', label: 'Keyboard input' };
    }
    if (source === 3) {
      return { kind: 'scroll', label: 'Scroll' };
    }
    return null;
  }).map((item, index) => item && ({
    ...item,
    id: `routine-${index}-${events[index].timestamp}`,
    offsetMs: toOffset(events[index].timestamp, firstTimestamp, duration),
    source: 'replay'
  })).filter(Boolean);
};

const sampleRoutineEvents = (events, maximum = 18) => {
  if (events.length <= maximum) {
    return events;
  }
  const selected = new Set();
  for (let index = 0; index < maximum; index += 1) {
    selected.add(Math.round((index * (events.length - 1)) / (maximum - 1)));
  }
  return events.filter((event, index) => selected.has(index));
};

const buildClusters = routineEvents => {
  const groups = [];
  routineEvents.forEach(event => {
    const current = groups[groups.length - 1];
    if (current && event.offsetMs - current.items[current.items.length - 1].offsetMs <= 1800) {
      current.items.push(event);
      current.endMs = event.offsetMs;
    } else {
      groups.push({ items: [event], startMs: event.offsetMs, endMs: event.offsetMs });
    }
  });
  return groups.filter(group => group.items.length >= 3).slice(0, 4).map((group, index) => ({
    id: `cluster-${index}-${group.startMs}`,
    count: group.items.length,
    offsetMs: Math.round((group.startMs + group.endMs) / 2),
    items: group.items
  }));
};

const buildFlagGroups = items => {
  const groups = [];
  items.slice().sort((left, right) => left.offsetMs - right.offsetMs).forEach(item => {
    const current = groups[groups.length - 1];
    if (current && item.offsetMs - current.offsetMs <= 6500) {
      current.items.push(item);
      current.count = current.items.length;
      return;
    }
    groups.push({
      id: `flag-${groups.length}-${item.offsetMs}`,
      color: SESSION_TIMELINE_KINDS[item.kind]?.color || '#8456bd',
      count: 1,
      items: [item],
      offsetMs: item.offsetMs
    });
  });
  return groups.slice(0, 9);
};

export const buildSessionTimelineModel = ({
  events, durationMs, notes, comments
}) => {
  const replayEvents = Array.isArray(events) ? events : [];
  const firstTimestamp = Number(replayEvents[0]?.timestamp || 0);
  const lastTimestamp = Number(replayEvents[replayEvents.length - 1]?.timestamp || 0);
  const duration = Math.max(0, Number(durationMs) || (lastTimestamp - firstTimestamp));
  if (!firstTimestamp || duration <= 0) {
    return {
      duration, categories: [], signals: [], routineEvents: [], clusters: [], groups: []
    };
  }

  const signals = [
    ...buildCustomSignals(replayEvents, firstTimestamp, duration),
    ...buildRageSignals(replayEvents, firstTimestamp, duration),
    ...buildCommentSignals(notes, comments, duration)
  ].sort((left, right) => left.offsetMs - right.offsetMs);
  const routineEvents = sampleRoutineEvents(
    buildRoutineCandidates(replayEvents, firstTimestamp, duration)
  );
  const categoryCounts = [...signals, ...routineEvents].reduce((counts, item) => {
    counts[item.kind] = (counts[item.kind] || 0) + (item.count || 1);
    return counts;
  }, {});
  const categories = Object.keys(SESSION_TIMELINE_KINDS)
    .filter(kind => categoryCounts[kind] > 0)
    .map(kind => ({
      kind,
      count: categoryCounts[kind],
      ...SESSION_TIMELINE_KINDS[kind]
    }));

  return {
    duration,
    categories,
    signals,
    routineEvents,
    clusters: buildClusters(routineEvents),
    groups: buildFlagGroups([...signals, ...routineEvents])
  };
};
