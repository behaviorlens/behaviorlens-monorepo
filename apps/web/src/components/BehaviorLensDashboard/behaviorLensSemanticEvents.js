import { createReplayElementResolver, unresolvedReplayElement } from './behaviorLensReplayElements';
import { sanitizeCustomEventTag, sanitizeSemanticString } from './behaviorLensSemanticSafety';

const RRWEB_INCREMENTAL = 3;
const RRWEB_CUSTOM = 5;
const MOUSE_INTERACTION_SOURCE = 2;
const CLICK_TYPE = 2;
const INPUT_SOURCE = 5;
const SCROLL_SOURCE = 3;
const SELECTION_SOURCE = 14;
const SCROLL_SEQUENCE_MAX_GAP_MS = 1000;

const CUSTOM_EVENT_PAYLOAD_ALLOWLIST = new Map([
  ['behaviorlens-page-start', ['label', 'navigation']],
  ['behaviorlens-add-field', ['label']],
  ['behaviorlens-advanced-settings', ['label']],
  ['advanced-designer-opened', ['label']],
  ['behaviorlens-preview-form', ['label']],
  ['behaviorlens-page-result', ['label']],
  ['behaviorlens-session-end', ['label']]
]);

const relativeTime = (event, baseTimestamp) => Math.max(0, Number(event?.timestamp) - baseTimestamp);

const elementKey = element => JSON.stringify([
  element?.name || null, element?.role || 'unknown', element?.nodeResolved === true
]);

const customSemanticEvent = (event, atMs, originalOrder) => {
  const tag = sanitizeCustomEventTag(event?.data?.tag);
  if (!tag) return null;
  const result = {
    type: 'custom_event', atMs, originalOrder, tag
  };
  const allowed = CUSTOM_EVENT_PAYLOAD_ALLOWLIST.get(tag);
  if (allowed) {
    allowed.forEach(field => {
      const value = sanitizeSemanticString(event?.data?.payload?.[field], 80);
      if (value) result[field] = value;
    });
  }
  return result;
};

const scrollDirection = (startY, endY) => {
  if (!Number.isFinite(startY) || !Number.isFinite(endY) || startY === endY) return null;
  return endY > startY ? 'down' : 'up';
};

export const buildSemanticTimeline = events => {
  const list = Array.isArray(events) ? events : [];
  const firstTimestamp = Number(list[0]?.timestamp);
  const baseTimestamp = Number.isFinite(firstTimestamp) ? firstTimestamp : 0;
  const resolver = createReplayElementResolver();
  const timeline = [];

  list.forEach((event, originalOrder) => {
    resolver.processEvent(event);
    const timestamp = Number(event?.timestamp);
    if (!Number.isFinite(timestamp)) return;
    const atMs = relativeTime(event, baseTimestamp);

    if (event?.type === RRWEB_CUSTOM) {
      const semantic = customSemanticEvent(event, atMs, originalOrder);
      if (semantic) timeline.push(semantic);
      return;
    }
    if (event?.type !== RRWEB_INCREMENTAL) return;

    const source = event.data?.source;
    const nodeId = Number(event.data?.id);
    const element = Number.isFinite(nodeId) ? resolver.resolve(nodeId) : unresolvedReplayElement();

    if (source === MOUSE_INTERACTION_SOURCE && event.data?.type === CLICK_TYPE) {
      timeline.push({
        type: 'click', atMs, originalOrder, element
      });
      return;
    }
    if (source === INPUT_SOURCE) {
      const previous = timeline[timeline.length - 1];
      if (previous?.type === 'input_sequence' && elementKey(previous.element) === elementKey(element)) {
        previous.endMs = atMs;
        previous.count += 1;
      } else {
        timeline.push({
          type: 'input_sequence', atMs, endMs: atMs, count: 1, originalOrder, element
        });
      }
      return;
    }
    if (source === SCROLL_SOURCE) {
      const y = Number(event.data?.y);
      const previous = timeline[timeline.length - 1];
      if (previous?.type === 'scroll_sequence'
        && elementKey(previous.element) === elementKey(element)
        && atMs - previous.endMs <= SCROLL_SEQUENCE_MAX_GAP_MS) {
        previous.endMs = atMs;
        previous.count += 1;
        previous.direction = scrollDirection(previous.startY, y) || previous.direction;
        previous.lastY = y;
      } else {
        timeline.push({
          type: 'scroll_sequence',
          atMs,
          endMs: atMs,
          count: 1,
          direction: null,
          originalOrder,
          element,
          startY: y,
          lastY: y
        });
      }
      return;
    }
    if (source === SELECTION_SOURCE) {
      timeline.push({ type: 'selection', atMs, originalOrder });
    }
  });

  return timeline
    .sort((left, right) => (
      (left.atMs - right.atMs) || (left.originalOrder - right.originalOrder)
    ))
    .map((item, index) => {
      const {
        startY, lastY, originalOrder, ...safeItem
      } = item;
      return { id: `E${index + 1}`, ...safeItem };
    });
};
