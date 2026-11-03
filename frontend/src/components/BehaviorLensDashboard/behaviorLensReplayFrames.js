import { isRrwebClickEvent } from './behaviorLensHeatmap';

// Which frame of a page view should Page Insights draw the click map on?
//
// The last frame is the wrong default. A reviewer who opened a properties
// panel, a modal or a preview and then closed it leaves the recording ending
// on a page that no longer contains anything they clicked, so those clicks
// fall back to bare page coordinates and land on empty background.
//
// This module answers the question from the event stream alone — no repeated
// rrweb renders. rrweb already tells us when every node entered and left the
// document (the full snapshot, then mutation `adds` and `removes`), so the
// frame that still contains the most clicked elements can be scored directly.
//
// "Present" here means the recording still holds that node at that instant.
// It is not a visibility claim: a node can be present and scrolled away or
// hidden by CSS. Nothing is estimated beyond what the mutations state.

const RRWEB_FULL_SNAPSHOT = 2;
const RRWEB_INCREMENTAL = 3;
const MUTATION_SOURCE = 0;

export const BACKDROP_CANDIDATE_LIMIT = 24;

const collectSnapshotNodes = (node, onNode, parentId = null) => {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Number.isFinite(node.id)) {
    onNode(node.id, parentId);
  }
  if (Array.isArray(node.childNodes)) {
    node.childNodes.forEach(child => collectSnapshotNodes(
      child, onNode, Number.isFinite(node.id) ? node.id : parentId
    ));
  }
};

// nodeId -> the intervals during which the recording contained that node.
export const buildNodePresence = events => {
  const list = Array.isArray(events) ? events : [];
  const intervals = new Map();
  const childrenByParent = new Map();

  const open = (id, timestamp) => {
    const spans = intervals.get(id) || [];
    if (spans.length && spans[spans.length - 1].to === Number.POSITIVE_INFINITY) {
      return;
    }
    spans.push({ from: timestamp, to: Number.POSITIVE_INFINITY });
    intervals.set(id, spans);
  };
  const close = (id, timestamp, seen = new Set()) => {
    if (seen.has(id)) {
      return;
    }
    seen.add(id);
    const spans = intervals.get(id);
    const last = spans && spans[spans.length - 1];
    if (last && last.to === Number.POSITIVE_INFINITY) {
      last.to = timestamp;
    }
    // rrweb only names the top of a removed subtree; its descendants leave
    // with it, so they have to be closed too or a stale panel would still
    // look present.
    (childrenByParent.get(id) || []).forEach(child => close(child, timestamp, seen));
  };
  const link = (id, parentId) => {
    if (!Number.isFinite(parentId)) {
      return;
    }
    const siblings = childrenByParent.get(parentId) || [];
    if (!siblings.includes(id)) {
      siblings.push(id);
      childrenByParent.set(parentId, siblings);
    }
  };

  list.forEach(event => {
    const timestamp = Number(event?.timestamp);
    if (!Number.isFinite(timestamp)) {
      return;
    }
    if (event.type === RRWEB_FULL_SNAPSHOT) {
      // A new document replaces the previous one wholesale.
      intervals.forEach((spans, id) => {
        const last = spans[spans.length - 1];
        if (last && last.to === Number.POSITIVE_INFINITY) {
          close(id, timestamp);
        }
      });
      collectSnapshotNodes(event.data?.node, (id, parentId) => {
        link(id, parentId);
        open(id, timestamp);
      });
      return;
    }
    if (event.type !== RRWEB_INCREMENTAL || event.data?.source !== MUTATION_SOURCE) {
      return;
    }
    (event.data.removes || []).forEach(removal => {
      if (Number.isFinite(removal?.id)) {
        close(removal.id, timestamp);
      }
    });
    (event.data.adds || []).forEach(addition => {
      collectSnapshotNodes(addition?.node, (id, parentId) => {
        link(id, Number.isFinite(parentId) ? parentId : addition?.parentId);
        open(id, timestamp);
      }, Number.isFinite(addition?.parentId) ? addition.parentId : null);
    });
  });

  return intervals;
};

export const isNodePresentAt = (presence, nodeId, timestamp) => {
  const spans = presence?.get?.(nodeId);
  if (!Array.isArray(spans)) {
    return false;
  }
  return spans.some(span => timestamp >= span.from && timestamp < span.to);
};

// Evenly sample the page view's click times so a long visit costs the same as
// a short one. The page view's own end always stays a candidate.
export const getBackdropCandidates = (events, pageView, limit = BACKDROP_CANDIDATE_LIMIT) => {
  const list = Array.isArray(events) ? events : [];
  const clickTimes = [...new Set(list
    .filter(event => isRrwebClickEvent(event)
      && (!pageView || (Number(event.timestamp) >= pageView.startTimestamp
        && Number(event.timestamp) <= pageView.endTimestamp)))
    .map(event => Number(event.timestamp))
    .filter(Number.isFinite))].sort((left, right) => left - right);

  const sampled = clickTimes.length <= limit
    ? clickTimes
    : Array.from({ length: limit }, (unused, index) => (
      clickTimes[Math.round((index / (limit - 1)) * (clickTimes.length - 1))]
    ));
  const end = Number(pageView?.endTimestamp);
  return [...new Set([...sampled, ...(Number.isFinite(end) ? [end] : [])])]
    .sort((left, right) => left - right);
};

// The frame whose DOM still contains the most of what was clicked.
//
// Score is clicks, not distinct elements: a button clicked twenty times is
// worth more to a click map than twenty controls clicked once.
export const selectBackdropFrame = ({
  events, firstTimestamp = 0, pageView, presence
}) => {
  const list = Array.isArray(events) ? events : [];
  const clicks = list
    .filter(event => isRrwebClickEvent(event)
      && Number.isFinite(Number(event.data?.id))
      && (!pageView || (Number(event.timestamp) >= pageView.startTimestamp
        && Number(event.timestamp) <= pageView.endTimestamp)))
    .map(event => Number(event.data.id));
  const endTimestamp = Number(pageView?.endTimestamp);
  const fallback = {
    offset: Math.max(0, (Number.isFinite(endTimestamp) ? endTimestamp : firstTimestamp)
      - Number(firstTimestamp || 0)),
    resolvedClicks: 0,
    timestamp: Number.isFinite(endTimestamp) ? endTimestamp : null,
    totalClicks: clicks.length
  };
  if (!clicks.length || !presence) {
    return fallback;
  }

  const candidates = getBackdropCandidates(list, pageView);
  const scored = candidates.map(timestamp => ({
    resolvedClicks: clicks.filter(nodeId => isNodePresentAt(presence, nodeId, timestamp)).length,
    timestamp
  }));
  // Ties go to the later frame: the more complete version of the page.
  const best = scored.reduce((winner, candidate) => (
    !winner || candidate.resolvedClicks > winner.resolvedClicks
    || (candidate.resolvedClicks === winner.resolvedClicks && candidate.timestamp > winner.timestamp)
      ? candidate
      : winner
  ), null);
  if (!best || best.resolvedClicks === 0) {
    return fallback;
  }
  return {
    offset: Math.max(0, best.timestamp - Number(firstTimestamp || 0)),
    resolvedClicks: best.resolvedClicks,
    timestamp: best.timestamp,
    totalClicks: clicks.length
  };
};
