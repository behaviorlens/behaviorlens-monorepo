import { isRrwebClickEvent, readValidViewport } from './behaviorLensHeatmap';

// Page views inside one recording.
//
// rrweb emits a Meta event followed by a FullSnapshot every time it starts
// reconstructing a document. Each of those snapshots is one page view: the
// only unit for which a click map, a scroll map or an inspected element is
// actually comparable. Page Insights analyses one page view at a time, the
// way Clarity and FullStory scope a heatmap to a page.
//
// Everything here comes from the recording itself. No page is invented, no
// URL is normalised into a "page group", and a session with a single snapshot
// simply yields a single page view.

const RRWEB_FULL_SNAPSHOT = 2;
const RRWEB_INCREMENTAL = 3;
const RRWEB_META = 4;
const RRWEB_SOURCE_MUTATION = 0;
const RRWEB_SOURCE_MOUSE_INTERACTION = 2;
// How long after a snapshot the page may still be rendering itself.
const SETTLE_WINDOW_MS = 1000;

// The first frame of a page view that shows its content. Single-page apps are
// often snapshotted before they render, so the frame at the snapshot is an
// empty root. Settle on the last DOM mutation of the initial render burst,
// stopping at the first user interaction so no click lands before the frame.
const findSettledTimestamp = (list, pageView, endTimestamp) => {
  const limit = Math.min(pageView.startTimestamp + SETTLE_WINDOW_MS, endTimestamp);
  let settled = pageView.startTimestamp;
  for (let index = pageView.eventIndex + 1; index < list.length; index += 1) {
    const event = list[index];
    const timestamp = Number(event?.timestamp);
    if (!Number.isFinite(timestamp) || timestamp > limit) {
      break;
    }
    if (event.type === RRWEB_INCREMENTAL && event.data?.source === RRWEB_SOURCE_MOUSE_INTERACTION) {
      break;
    }
    if (event.type === RRWEB_INCREMENTAL && event.data?.source === RRWEB_SOURCE_MUTATION) {
      settled = timestamp;
    }
  }
  return settled;
};

export const readPageViewLabel = href => {
  if (typeof href !== 'string' || !href.trim()) {
    return null;
  }
  try {
    const url = new URL(href);
    const path = `${url.pathname}${url.search}`.replace(/\/$/u, '');
    return path || url.hostname;
  } catch (error) {
    return href.length > 60 ? `${href.slice(0, 57)}…` : href;
  }
};

export const derivePageViews = (events, { fallbackUrl = null } = {}) => {
  const list = Array.isArray(events) ? events : [];
  const lastTimestamp = Number(list[list.length - 1]?.timestamp);
  const firstTimestamp = Number(list[0]?.timestamp);
  const pageViews = [];
  let pendingMeta = null;

  list.forEach((event, eventIndex) => {
    if (event?.type === RRWEB_META) {
      pendingMeta = {
        href: typeof event.data?.href === 'string' ? event.data.href : null,
        viewport: readValidViewport(event.data)
      };
      return;
    }
    if (event?.type !== RRWEB_FULL_SNAPSHOT) {
      return;
    }
    const documentNodeId = Number.isFinite(event.data?.node?.id) ? event.data.node.id : null;
    const startTimestamp = Number(event.timestamp);
    pageViews.push({
      documentNodeId,
      eventIndex,
      href: pendingMeta?.href || (pageViews.length === 0 ? fallbackUrl : null),
      id: `page-view-${eventIndex}`,
      initialScrollX: Math.max(0, Number(event.data?.initialOffset?.left) || 0),
      initialScrollY: Math.max(0, Number(event.data?.initialOffset?.top) || 0),
      startTimestamp: Number.isFinite(startTimestamp) ? startTimestamp : null,
      viewport: pendingMeta?.viewport || null
    });
    pendingMeta = null;
  });

  return pageViews
    .filter(pageView => Number.isFinite(pageView.startTimestamp))
    .map((pageView, index, all) => {
      const next = all[index + 1];
      const endTimestamp = next
        ? next.startTimestamp - 1
        : (Number.isFinite(lastTimestamp) ? lastTimestamp : pageView.startTimestamp);
      const clicks = list.filter(event => (
        isRrwebClickEvent(event)
        && Number(event.timestamp) >= pageView.startTimestamp
        && Number(event.timestamp) <= endTimestamp
      ));
      const baseline = Number.isFinite(firstTimestamp) ? firstTimestamp : 0;
      const pageEndTimestamp = Math.max(pageView.startTimestamp, endTimestamp);
      // rrweb applies only events strictly before a seek target, so seeking to
      // the snapshot's own timestamp leaves the previous document on screen.
      const seekTimestamp = Math.min(
        findSettledTimestamp(list, pageView, pageEndTimestamp) + 1,
        pageEndTimestamp
      );
      return {
        ...pageView,
        clickCount: clicks.length,
        endTimestamp: pageEndTimestamp,
        // Replay-relative offsets, so a page view can be opened in Session Replay.
        endOffset: Math.max(0, pageEndTimestamp - baseline),
        index,
        label: readPageViewLabel(pageView.href) || `Page view ${index + 1}`,
        rank: index + 1,
        // Where Page Insights seeks to show this page view: after its snapshot
        // and its initial render (see findSettledTimestamp).
        seekOffset: Math.max(0, seekTimestamp - baseline),
        startOffset: Math.max(0, pageView.startTimestamp - baseline)
      };
    });
};

// The page view a reviewer most likely wants first: the one this session
// interacted with most. Ties keep recording order.
export const selectDefaultPageView = pageViews => {
  const list = Array.isArray(pageViews) ? pageViews : [];
  if (!list.length) {
    return null;
  }
  return list.reduce((best, pageView) => (
    pageView.clickCount > best.clickCount ? pageView : best
  ), list[0]);
};

export const findPageViewById = (pageViews, id) => (
  (Array.isArray(pageViews) ? pageViews : []).find(pageView => pageView.id === id) || null
);

// The page view that contains a replay offset, used when Session Replay hands
// Page Insights the reviewer's current position.
export const findPageViewAtOffset = (pageViews, offsetMs) => {
  const list = Array.isArray(pageViews) ? pageViews : [];
  const offset = Number(offsetMs);
  if (!list.length || !Number.isFinite(offset)) {
    return null;
  }
  return list.filter(pageView => pageView.startOffset <= offset).slice(-1)[0] || list[0];
};

export const isTimestampInPageView = (timestamp, pageView) => {
  const value = Number(timestamp);
  return Boolean(pageView)
    && Number.isFinite(value)
    && value >= pageView.startTimestamp
    && value <= pageView.endTimestamp;
};

export const filterEventsToPageView = (events, pageView) => (
  (Array.isArray(events) ? events : []).filter(event => (
    !pageView || isTimestampInPageView(event?.timestamp, pageView)
  ))
);
