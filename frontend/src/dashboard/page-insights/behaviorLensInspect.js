import { detectRageClickIndexes } from '../shared/behaviorLensEvents';
import { isRrwebClickEvent } from './behaviorLensHeatmap';
import { isTimestampInPageView } from './behaviorLensPageViews';
import { describeReplayNode } from '../shared/behaviorLensElementLabels';

const INSPECTABLE_TAGS = new Set([
  'a', 'button', 'input', 'label', 'select', 'summary', 'textarea'
]);
const INSPECTABLE_ROLES = new Set([
  'button', 'checkbox', 'link', 'menuitem', 'option', 'radio', 'tab'
]);

const isInspectableRecordedNode = node => {
  const tagName = String(node?.tagName || '').toLowerCase();
  const attributes = node?.attributes || {};
  return INSPECTABLE_TAGS.has(tagName)
    || INSPECTABLE_ROLES.has(String(attributes.role || '').toLowerCase())
    || attributes.contenteditable === 'true'
    || Object.prototype.hasOwnProperty.call(attributes, 'tabindex');
};

// Stable Inspect rail catalog for the whole page view. It is intentionally
// derived from recording data rather than the currently rendered iframe, so
// Clicked / Not clicked does not change while the replay is playing. Each row
// carries a real time at which its node existed; selecting it can seek first
// and resolve the live selector after rrweb has reconstructed that frame.
export const buildPageViewInspectCatalog = ({
  events, firstTimestamp = 0, nodeIndex, pageView, presence
}) => {
  const clicksByNode = new Map();
  (Array.isArray(events) ? events : []).forEach(event => {
    if (!isRrwebClickEvent(event) || (pageView && !isTimestampInPageView(event.timestamp, pageView))) {
      return;
    }
    const nodeId = Number(event.data?.id);
    if (!Number.isFinite(nodeId)) return;
    const timestamps = clicksByNode.get(nodeId) || [];
    timestamps.push(Number(event.timestamp));
    clicksByNode.set(nodeId, timestamps);
  });
  const pageStart = Number(pageView?.startTimestamp ?? Number.NEGATIVE_INFINITY);
  const pageEnd = Number(pageView?.endTimestamp ?? Number.POSITIVE_INFINITY);
  return [...(nodeIndex?.entries?.() || [])].reduce((catalog, [nodeId, node]) => {
    const spans = presence?.get?.(nodeId) || [];
    const span = spans.find(item => item.to > pageStart && item.from <= pageEnd);
    const clickTimestamps = clicksByNode.get(nodeId) || [];
    if ((!span && !clickTimestamps.length) || (!isInspectableRecordedNode(node) && !clickTimestamps.length)) {
      return catalog;
    }
    const timestamp = clickTimestamps[0]
      ?? Math.max(pageStart, Number(span?.from) || pageStart);
    return [...catalog, {
      clickCount: clickTimestamps.length,
      focusOffset: Math.max(0, timestamp - Number(firstTimestamp || 0)),
      label: describeReplayNode(node) || String(node?.tagName || 'element').toLowerCase(),
      nodeId,
      tagName: String(node?.tagName || 'element').toLowerCase()
    }];
  }, []).sort((left, right) => (
    right.clickCount - left.clickCount
    || left.focusOffset - right.focusOffset
    || left.label.localeCompare(right.label)
  ));
};

const cssEscape = value => {
  const text = String(value);
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(text);
  }
  return text.replace(/[^a-zA-Z0-9_-]/gu, character => `\\${character}`);
};

const quoteAttribute = value => String(value).replace(/\\/gu, '\\\\').replace(/"/gu, '\\"');

const isUnique = (element, selector) => {
  try {
    const matches = element.ownerDocument.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element;
  } catch (error) {
    return false;
  }
};

const elementSegment = (element, { includeClasses = false } = {}) => {
  const tag = element.tagName.toLowerCase();
  const siblings = Array.from(element.parentElement?.children || [])
    .filter(sibling => sibling.tagName === element.tagName);
  const position = siblings.indexOf(element);
  const nth = siblings.length > 1 && position >= 0 ? `:nth-of-type(${position + 1})` : '';
  if (includeClasses) {
    const stableClass = Array.from(element.classList || []).find(token => (
      token.length > 1 && token.length < 40 && !/\d{4,}|[_-][a-f0-9]{6,}/iu.test(token)
    ));
    if (stableClass) {
      return `${tag}.${cssEscape(stableClass)}${nth}`;
    }
  }
  return `${tag}${nth}`;
};

export const buildOptimizedSelector = element => {
  if (!element?.tagName) {
    return null;
  }
  const id = element.getAttribute('id');
  if (id) {
    const selector = `#${cssEscape(id)}`;
    if (isUnique(element, selector)) {
      return selector;
    }
  }

  const tag = element.tagName.toLowerCase();
  const attributes = ['aria-label', 'data-testid', 'data-test', 'data-qa', 'data-cy', 'name', 'title'];
  for (let index = 0; index < attributes.length; index += 1) {
    const name = attributes[index];
    const value = element.getAttribute(name);
    if (value) {
      const selector = `${tag}[${name}="${quoteAttribute(value)}"]`;
      if (isUnique(element, selector)) {
        return selector;
      }
    }
  }

  const role = element.getAttribute('role');
  if (role) {
    const selector = `${tag}[role="${quoteAttribute(role)}"]`;
    if (isUnique(element, selector)) {
      return selector;
    }
  }

  const ancestry = [];
  let current = element;
  while (current?.tagName && ancestry.length < 6) {
    ancestry.unshift(elementSegment(current, { includeClasses: true }));
    const selector = ancestry.join(' > ');
    if (isUnique(element, selector)) {
      return selector;
    }
    current = current.parentElement;
  }
  return ancestry.join(' > ') || tag;
};

export const buildFullSelector = element => {
  if (!element?.tagName) {
    return null;
  }
  const path = [];
  let current = element;
  while (current?.tagName) {
    path.unshift(elementSegment(current));
    current = current.parentElement;
  }
  return path.join(' > ');
};

export const getExactNodeClickMetrics = (events, nodeId) => {
  if (!Number.isFinite(nodeId)) {
    return { clicks: 0, rageClicks: 0 };
  }
  const list = Array.isArray(events) ? events : [];
  const rageIndexes = detectRageClickIndexes(list);
  let clicks = 0;
  let rageClicks = 0;
  list.forEach((event, index) => {
    if (!isRrwebClickEvent(event) || event.data?.id !== nodeId) {
      return;
    }
    clicks += 1;
    if (rageIndexes.has(index)) {
      rageClicks += 1;
    }
  });
  return { clicks, rageClicks };
};

// Real click evidence for one rrweb node, scoped to a page view.
//
// Page Insights is page-scoped, not moment-scoped, so "clicks on this page
// view" is the honest headline number and the session total sits beside it.
export const getNodeClickEvidence = (events, nodeId, pageView) => {
  if (!Number.isFinite(nodeId)) {
    return {
      clicksInPageView: 0,
      firstOffsetTimestamp: null,
      rageClicks: 0,
      rageTimestamps: [],
      sessionClicks: 0,
      timestamps: []
    };
  }
  const list = Array.isArray(events) ? events : [];
  const rageIndexes = detectRageClickIndexes(list);
  const timestamps = [];
  const pageViewTimestamps = [];
  // Which of the element's clicks were part of a rage burst, so the rail can
  // mark those exact moments instead of only counting them.
  const rageTimestamps = [];
  let rageClicks = 0;
  list.forEach((event, index) => {
    if (!isRrwebClickEvent(event) || event.data?.id !== nodeId) {
      return;
    }
    timestamps.push(event.timestamp);
    const inPageView = !pageView || isTimestampInPageView(event.timestamp, pageView);
    if (inPageView) {
      pageViewTimestamps.push(event.timestamp);
      if (rageIndexes.has(index)) {
        rageClicks += 1;
        rageTimestamps.push(event.timestamp);
      }
    } else if (rageIndexes.has(index)) {
      rageTimestamps.push(event.timestamp);
    }
  });
  return {
    clicksInPageView: pageViewTimestamps.length,
    firstOffsetTimestamp: pageViewTimestamps[0] ?? timestamps[0] ?? null,
    rageClicks,
    rageTimestamps,
    sessionClicks: timestamps.length,
    timestamps: pageViewTimestamps.length ? pageViewTimestamps : timestamps
  };
};

// Clicks per rrweb node id inside one page view, so the inspect target list
// can show real usage beside every element without re-scanning the events for
// each row.
export const getPageViewClickCountsByNode = (events, pageView) => {
  const counts = new Map();
  (Array.isArray(events) ? events : []).forEach(event => {
    if (!isRrwebClickEvent(event)) {
      return;
    }
    const nodeId = Number(event.data?.id);
    if (!Number.isFinite(nodeId)) {
      return;
    }
    if (pageView && !isTimestampInPageView(event.timestamp, pageView)) {
      return;
    }
    counts.set(nodeId, (counts.get(nodeId) || 0) + 1);
  });
  return counts;
};
