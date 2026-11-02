import { readValidViewport } from './behaviorLensHeatmap';

const RRWEB_FULL_SNAPSHOT = 2;
const RRWEB_INCREMENTAL = 3;
const RRWEB_META = 4;
const SCROLL_SOURCE = 3;
const VIEWPORT_RESIZE_SOURCE = 4;
const ATTENTION_ACTIVITY_SOURCES = new Set([1, 2, 3, 5, 6, 7, 12]);
const DOCUMENT_NODE = 0;
const ATTENTION_BIN_COUNT = 40;
const ATTENTION_MAX_STABLE_INTERVAL_MS = 5_000;
const clampPercentage = value => Math.min(100, Math.max(0, value));

export const formatVisibleDuration = milliseconds => {
  const value = Number(milliseconds);
  if (!(value > 0)) {
    return null;
  }
  const totalSeconds = Math.round(value / 1000);
  if (totalSeconds < 60) {
    return totalSeconds < 10 ? `${(value / 1000).toFixed(1)}s` : `${totalSeconds}s`;
  }
  return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
};

export const measureReconstructedDocumentGeometry = documentNode => {
  const root = documentNode?.documentElement;
  const body = documentNode?.body;
  const width = Math.max(
    Number(root?.scrollWidth) || 0,
    Number(root?.offsetWidth) || 0,
    Number(root?.clientWidth) || 0,
    Number(body?.scrollWidth) || 0,
    Number(body?.offsetWidth) || 0,
    Number(body?.clientWidth) || 0
  );
  const height = Math.max(
    Number(root?.scrollHeight) || 0,
    Number(root?.offsetHeight) || 0,
    Number(root?.clientHeight) || 0,
    Number(body?.scrollHeight) || 0,
    Number(body?.offsetHeight) || 0,
    Number(body?.clientHeight) || 0
  );
  return width > 0 && height > 0 ? { height, width } : null;
};

export const measureReconstructedDocumentGeometryAtViewport = ({
  documentNode, frameElement, viewportHeight
}) => {
  const height = Number(viewportHeight);
  if (!frameElement?.style || !(height > 0)) {
    return measureReconstructedDocumentGeometry(documentNode);
  }

  const previousAttribute = frameElement.getAttribute?.('height');
  const previousHeight = frameElement.style.getPropertyValue('height');
  const previousPriority = frameElement.style.getPropertyPriority('height');
  try {
    frameElement.style.setProperty('height', `${height}px`, 'important');
    frameElement.setAttribute?.('height', String(height));
    return measureReconstructedDocumentGeometry(documentNode);
  } finally {
    if (previousHeight) {
      frameElement.style.setProperty('height', previousHeight, previousPriority);
    } else {
      frameElement.style.removeProperty('height');
    }
    if (previousAttribute === null || previousAttribute === undefined) {
      frameElement.removeAttribute?.('height');
    } else {
      frameElement.setAttribute?.('height', previousAttribute);
    }
  }
};

export const getScrollPositionPercent = ({ documentHeight, scrollY, viewportHeight }) => {
  const safeDocumentHeight = Number(documentHeight);
  if (!(safeDocumentHeight > 0)) {
    return null;
  }
  const safeViewportHeight = Math.min(
    safeDocumentHeight,
    Math.max(0, Number(viewportHeight) || 0)
  );
  const maximumScrollY = Math.max(0, safeDocumentHeight - safeViewportHeight);
  const safeScrollY = Math.min(maximumScrollY, Math.max(0, Number(scrollY) || 0));
  return maximumScrollY > 0
    ? clampPercentage((safeScrollY / maximumScrollY) * 100)
    : 0;
};

export const getFullPageScrollGeometry = ({
  availableWidth, documentHeight, documentWidth, scrollY, viewportHeight
}) => {
  const safeDocumentWidth = Number(documentWidth);
  const safeDocumentHeight = Number(documentHeight);
  const safeAvailableWidth = Number(availableWidth);
  if (!(safeDocumentWidth > 0) || !(safeDocumentHeight > 0) || !(safeAvailableWidth > 0)) {
    return null;
  }
  const scale = Math.min(1, safeAvailableWidth / safeDocumentWidth);
  const safeViewportHeight = Math.min(
    safeDocumentHeight,
    Math.max(0, Number(viewportHeight) || 0)
  );
  const maximumScrollY = Math.max(0, safeDocumentHeight - safeViewportHeight);
  const safeScrollY = Math.min(maximumScrollY, Math.max(0, Number(scrollY) || 0));
  return {
    currentPositionPercent: getScrollPositionPercent({
      documentHeight: safeDocumentHeight,
      scrollY: safeScrollY,
      viewportHeight: safeViewportHeight
    }),
    renderedHeight: safeDocumentHeight * scale,
    renderedWidth: safeDocumentWidth * scale,
    scale,
    viewportHeight: safeViewportHeight * scale,
    viewportTop: safeScrollY * scale
  };
};

export const getReplayDocumentNodeIds = (events, targetTimestamp = Number.POSITIVE_INFINITY) => {
  let ids = new Set();
  (Array.isArray(events) ? events : []).forEach(event => {
    if (Number(event?.timestamp) > targetTimestamp) {
      return;
    }
    const node = event?.type === RRWEB_FULL_SNAPSHOT ? event.data?.node : null;
    if (node?.type === DOCUMENT_NODE && Number.isFinite(node.id)) {
      // Page Insights renders the last reconstructed page. A navigation can
      // introduce another full snapshot, so older document ids must not be
      // compared with the final page's scrollHeight.
      ids = new Set([node.id]);
    }
  });
  return ids;
};

export const extractSessionScrollPositions = (
  events,
  recordedViewport,
  targetTimestamp = Number.POSITIVE_INFINITY,
  documentTimestamp = targetTimestamp
) => {
  const list = Array.isArray(events) ? events : [];
  const documentNodeIds = getReplayDocumentNodeIds(list, documentTimestamp);
  const pageStartIndex = list.reduce((lastIndex, event, index) => (
    event?.type === RRWEB_FULL_SNAPSHOT && Number(event.timestamp) <= documentTimestamp
      ? index
      : lastIndex
  ), -1);
  const pageStartTimestamp = Number.isFinite(Number(list[pageStartIndex]?.timestamp))
    ? Number(list[pageStartIndex].timestamp)
    : null;
  const nextPage = pageStartIndex >= 0
    ? list.slice(pageStartIndex + 1).find(event => event?.type === RRWEB_FULL_SNAPSHOT)
    : null;
  const pageEndTimestamp = Number.isFinite(Number(nextPage?.timestamp))
    ? Number(nextPage.timestamp)
    : null;
  let currentViewport = readValidViewport(recordedViewport);
  let pageViewport = currentViewport;
  let pageInitialScrollY = 0;
  const allScrolls = [];
  const pageActivityTimestamps = [];
  const pageScrolls = [];
  const pageViewportChanges = [];

  list.forEach((event, eventIndex) => {
    let viewportChanged = false;
    if (event?.type === RRWEB_META) {
      currentViewport = readValidViewport(event.data) || currentViewport;
      viewportChanged = true;
    } else if (event?.type === RRWEB_INCREMENTAL
      && event.data?.source === VIEWPORT_RESIZE_SOURCE) {
      currentViewport = readValidViewport(event.data) || currentViewport;
      viewportChanged = true;
    }

    if (eventIndex === pageStartIndex) {
      pageViewport = currentViewport;
      pageInitialScrollY = Math.max(0, Number(event.data?.initialOffset?.top) || 0);
    }

    if (
      viewportChanged
      && eventIndex >= pageStartIndex
      && Number(event?.timestamp) <= targetTimestamp
      && currentViewport?.height
    ) {
      pageViewportChanges.push({
        eventIndex, timestamp: Number(event.timestamp), viewportHeight: currentViewport.height
      });
    }

    if (
      event?.type === RRWEB_INCREMENTAL
      && ATTENTION_ACTIVITY_SOURCES.has(event.data?.source)
      && eventIndex >= pageStartIndex
      && Number(event?.timestamp) <= targetTimestamp
      && Number.isFinite(Number(event.timestamp))
    ) {
      pageActivityTimestamps.push({ eventIndex, timestamp: Number(event.timestamp) });
    }

    if (Number(event?.timestamp) > targetTimestamp) {
      return;
    }

    if (event?.type !== RRWEB_INCREMENTAL || event.data?.source !== SCROLL_SOURCE) {
      return;
    }
    if (pageStartIndex >= 0 && eventIndex < pageStartIndex) {
      return;
    }
    const y = Number(event.data.y);
    if (!Number.isFinite(y) || y < 0 || !Number.isFinite(event.timestamp)) {
      return;
    }
    const position = {
      eventIndex,
      id: Number.isFinite(event.data.id) ? event.data.id : null,
      timestamp: event.timestamp,
      x: Number.isFinite(Number(event.data.x)) ? Number(event.data.x) : 0,
      y,
      viewportHeight: currentViewport?.height || null
    };
    allScrolls.push(position);
    if (position.id !== null && documentNodeIds.has(position.id)) {
      pageScrolls.push(position);
    }
  });

  return {
    allScrolls,
    documentNodeIds,
    pageActivityTimestamps,
    pageEndTimestamp,
    pageInitialScrollY,
    pageScrolls,
    pageStartTimestamp,
    pageViewport,
    pageViewportChanges
  };
};

const addAttentionSegment = ({
  bins, documentHeight, durationMs, focusTimestamp, timestampWeights, scrollY, viewportHeight
}) => {
  const safeViewportHeight = Math.min(documentHeight, Math.max(0, Number(viewportHeight) || 0));
  if (!(durationMs > 0) || !(safeViewportHeight > 0)) {
    return;
  }
  const maximumScrollY = Math.max(0, documentHeight - safeViewportHeight);
  const top = Math.min(maximumScrollY, Math.max(0, Number(scrollY) || 0));
  const bottom = Math.min(documentHeight, top + safeViewportHeight);
  const binHeight = documentHeight / bins.length;
  const firstBin = Math.max(0, Math.floor(top / binHeight));
  const lastBin = Math.min(bins.length - 1, Math.floor((bottom - 1) / binHeight));
  for (let index = firstBin; index <= lastBin; index += 1) {
    const binTop = index * binHeight;
    const binBottom = binTop + binHeight;
    const overlap = Math.max(0, Math.min(bottom, binBottom) - Math.max(top, binTop));
    const contribution = durationMs * (overlap / binHeight);
    bins[index] += contribution;
    timestampWeights[index].total += contribution;
    timestampWeights[index].weighted += contribution * focusTimestamp;
  }
};

export const derivePageViewScrollAttention = ({
  documentHeight,
  extracted,
  maxStableIntervalMs = ATTENTION_MAX_STABLE_INTERVAL_MS,
  timeWindow
}) => {
  const safeDocumentHeight = Number(documentHeight);
  const safeWindowStart = Number(timeWindow?.startTimestamp);
  const safeWindowEnd = Number(timeWindow?.endTimestamp);
  const fallbackViewportHeight = Number(extracted?.pageViewport?.height);
  if (
    !(safeDocumentHeight > 0)
    || !Number.isFinite(safeWindowStart)
    || !Number.isFinite(safeWindowEnd)
    || safeWindowEnd <= safeWindowStart
    || !Number.isFinite(extracted?.pageStartTimestamp)
    || !(fallbackViewportHeight > 0)
  ) {
    return {
      bands: [], mostViewedDepthPercent: null, totalVisibleMs: 0
    };
  }
  const startTimestamp = Math.max(
    safeWindowStart,
    Number.isFinite(extracted.pageStartTimestamp)
      ? extracted.pageStartTimestamp
      : safeWindowStart
  );
  const endTimestamp = Math.min(
    safeWindowEnd,
    Number.isFinite(extracted.pageEndTimestamp)
      ? extracted.pageEndTimestamp
      : safeWindowEnd
  );
  if (endTimestamp <= startTimestamp) {
    return {
      bands: [], mostViewedDepthPercent: null, totalVisibleMs: 0
    };
  }

  const scrolls = extracted.pageScrolls || [];
  const previous = scrolls.filter(position => position.timestamp <= startTimestamp).slice(-1)[0];
  const previousViewport = (extracted.pageViewportChanges || [])
    .filter(change => change.timestamp <= startTimestamp).slice(-1)[0];
  let currentScrollY = previous?.y ?? extracted.pageInitialScrollY ?? 0;
  let currentViewportHeight = previousViewport?.viewportHeight
    || previous?.viewportHeight
    || fallbackViewportHeight;
  let cursor = startTimestamp;
  let totalVisibleMs = 0;
  const bins = Array.from({ length: ATTENTION_BIN_COUNT }, () => 0);
  const timestampWeights = Array.from({ length: ATTENTION_BIN_COUNT }, () => ({
    total: 0, weighted: 0
  }));
  const addSegmentUntil = timestamp => {
    const rawDuration = Math.max(0, timestamp - cursor);
    const durationMs = Math.min(rawDuration, Math.max(0, Number(maxStableIntervalMs) || 0));
    addAttentionSegment({
      bins,
      documentHeight: safeDocumentHeight,
      durationMs,
      focusTimestamp: cursor + (durationMs / 2),
      timestampWeights,
      scrollY: currentScrollY,
      viewportHeight: currentViewportHeight
    });
    totalVisibleMs += durationMs;
    cursor = timestamp;
  };

  const changes = [
    ...scrolls.map(position => ({ ...position, kind: 'scroll' })),
    ...(extracted.pageViewportChanges || []).map(change => ({ ...change, kind: 'viewport' })),
    ...(extracted.pageActivityTimestamps || []).map(change => ({ ...change, kind: 'activity' }))
  ].filter(change => (
    change.timestamp > startTimestamp && change.timestamp <= endTimestamp
  )).sort((first, second) => (
    first.timestamp - second.timestamp || first.eventIndex - second.eventIndex
  ));
  changes.forEach(change => {
    addSegmentUntil(change.timestamp);
    if (change.kind === 'scroll') {
      currentScrollY = change.y;
    }
    currentViewportHeight = change.viewportHeight || currentViewportHeight;
  });
  addSegmentUntil(endTimestamp);

  // A three-band moving average removes single-bin stripes without moving a
  // hotspot to a different part of the page. Raw visibleMs remains available
  // in the probe; only colour intensity uses the smoothed signal.
  const smoothed = bins.map((value, index) => {
    const neighbours = bins.slice(Math.max(0, index - 1), Math.min(bins.length, index + 2));
    return neighbours.reduce((sum, item) => sum + item, 0) / neighbours.length;
  });
  const maximumVisibleMs = Math.max(0, ...smoothed);
  const mostViewedIndex = maximumVisibleMs > 0 ? smoothed.indexOf(maximumVisibleMs) : -1;
  return {
    bands: bins.map((visibleMs, index) => ({
      depthEndPercent: ((index + 1) / bins.length) * 100,
      depthStartPercent: (index / bins.length) * 100,
      focusTimestamp: timestampWeights[index].total > 0
        ? timestampWeights[index].weighted / timestampWeights[index].total
        : null,
      intensity: maximumVisibleMs > 0 ? smoothed[index] / maximumVisibleMs : 0,
      visibleMs
    })),
    maxStableIntervalMs: Math.max(0, Number(maxStableIntervalMs) || 0),
    mostViewedDepthPercent: mostViewedIndex >= 0
      ? ((mostViewedIndex + 0.5) / bins.length) * 100
      : null,
    totalVisibleMs
  };
};

export const deriveSessionScrollMap = ({ events, recordedViewport, documentHeight }) => {
  const {
    allScrolls, documentNodeIds, pageScrolls, pageViewport
  } = extractSessionScrollPositions(
    events,
    recordedViewport
  );
  const initialViewport = pageViewport || readValidViewport(recordedViewport);
  const safeDocumentHeight = Number(documentHeight);

  if (!allScrolls.length) {
    return {
      status: 'no-scroll', allScrolls, pageScrolls, initialFold: initialViewport?.height || null
    };
  }
  if (!documentNodeIds.size || !pageScrolls.length) {
    return {
      status: 'page-scroll-unavailable',
      allScrolls,
      pageScrolls,
      initialFold: initialViewport?.height || null
    };
  }
  if (!Number.isFinite(safeDocumentHeight) || safeDocumentHeight <= 0) {
    return {
      status: 'document-height-unavailable',
      allScrolls,
      pageScrolls,
      initialFold: initialViewport?.height || null
    };
  }

  const measurable = pageScrolls.filter(position => Number.isFinite(position.viewportHeight));
  if (!measurable.length) {
    return {
      status: 'viewport-unavailable',
      allScrolls,
      pageScrolls,
      documentHeight: safeDocumentHeight,
      initialFold: null
    };
  }
  const maxScrollY = Math.max(...pageScrolls.map(position => position.y));
  const maxReachedPx = Math.min(safeDocumentHeight, Math.max(
    ...measurable.map(position => position.y + position.viewportHeight)
  ));

  return {
    status: 'ready',
    allScrolls,
    pageScrolls,
    documentHeight: safeDocumentHeight,
    initialFold: initialViewport?.height || measurable[0].viewportHeight,
    maxReachedPx,
    maxScrollY,
    reachPercent: (maxReachedPx / safeDocumentHeight) * 100
  };
};

// Scroll evidence for one page view, start to end.
//
// Page Insights is not scoped to a playback moment: this covers the whole
// visit to the selected page, the unit Clarity and FullStory both use. Every
// number is measured — scroll offsets, the viewport height in force at each
// offset, and the dwell intervals between real replay activity.
export const derivePageViewScrollMap = ({
  documentHeight, events, pageView, recordedViewport
}) => {
  const scope = pageView || {
    endTimestamp: Number.POSITIVE_INFINITY,
    startTimestamp: Number.NEGATIVE_INFINITY
  };
  const extracted = extractSessionScrollPositions(
    events,
    recordedViewport,
    scope.endTimestamp,
    scope.startTimestamp
  );
  const visitScrolls = extracted.pageScrolls.filter(position => (
    position.timestamp >= scope.startTimestamp && position.timestamp <= scope.endTimestamp
  ));
  const safeDocumentHeight = Number(documentHeight);
  const measurable = visitScrolls.filter(position => Number.isFinite(position.viewportHeight));
  const initialViewportHeight = Number(pageView?.viewport?.height)
    || extracted.pageViewport?.height
    || readValidViewport(recordedViewport)?.height
    || null;
  const initialScrollY = Number.isFinite(Number(pageView?.initialScrollY))
    ? Number(pageView.initialScrollY)
    : (extracted.pageInitialScrollY || 0);
  const lastScroll = visitScrolls.slice(-1)[0] || null;
  const maxReachedPx = Number.isFinite(safeDocumentHeight) && safeDocumentHeight > 0
    && initialViewportHeight
    ? Math.min(safeDocumentHeight, Math.max(
      initialScrollY + initialViewportHeight,
      ...measurable.map(position => position.y + position.viewportHeight)
    ))
    : null;
  const attention = derivePageViewScrollAttention({
    documentHeight: safeDocumentHeight,
    extracted,
    timeWindow: {
      endTimestamp: Math.min(
        scope.endTimestamp,
        Number.isFinite(extracted.pageEndTimestamp) ? extracted.pageEndTimestamp : scope.endTimestamp
      ),
      startTimestamp: extracted.pageStartTimestamp
    }
  });
  const firstTimestamp = Number(events?.[0]?.timestamp || 0);
  const attentionWithOffsets = {
    ...attention,
    bands: attention.bands.map(band => ({
      ...band,
      focusOffset: Number.isFinite(band.focusTimestamp)
        ? Math.max(0, band.focusTimestamp - firstTimestamp)
        : null
    }))
  };
  const hasDocument = Number.isFinite(safeDocumentHeight) && safeDocumentHeight > 0;

  return {
    ...extracted,
    attention: attentionWithOffsets,
    documentHeight: hasDocument ? safeDocumentHeight : null,
    // The fold: what this recording shows was on screen when the page opened.
    foldPercent: hasDocument && initialViewportHeight
      ? clampPercentage(((initialScrollY + initialViewportHeight) / safeDocumentHeight) * 100)
      : null,
    initialFoldPx: initialViewportHeight,
    initialScrollY,
    lastScrollY: lastScroll?.y ?? initialScrollY,
    maxReachedPx,
    // Depth is only meaningful when the page is taller than the fold.
    pageIsScrollable: hasDocument && initialViewportHeight
      ? safeDocumentHeight > initialViewportHeight + 1
      : null,
    reachPercent: Number.isFinite(maxReachedPx) && hasDocument
      ? clampPercentage((maxReachedPx / safeDocumentHeight) * 100)
      : null,
    scrollEventCount: visitScrolls.length,
    viewportHeight: initialViewportHeight,
    visitScrolls
  };
};

export const SCROLL_ATTENTION_RAMP = [
  { at: 0, rgb: [66, 118, 255] },
  { at: 0.35, rgb: [33, 178, 162] },
  { at: 0.65, rgb: [249, 199, 45] },
  { at: 1, rgb: [234, 67, 53] }
];

export const SCROLL_ATTENTION_LEGEND_GRADIENT = `linear-gradient(90deg, ${
  SCROLL_ATTENTION_RAMP.map(stop => (
    `rgb(${stop.rgb.join(', ')}) ${Math.round(stop.at * 100)}%`
  )).join(', ')
})`;

export const scrollAttentionColor = intensity => {
  const value = Math.max(0, Math.min(1, Number(intensity) || 0));
  if (value <= 0) {
    return 'rgba(47, 109, 246, 0)';
  }
  // Cool -> warm, matching the rail legend.
  const ramp = SCROLL_ATTENTION_RAMP;
  const upperIndex = ramp.findIndex(stop => value <= stop.at);
  const upper = ramp[upperIndex <= 0 ? 1 : upperIndex];
  const lower = ramp[(upperIndex <= 0 ? 1 : upperIndex) - 1];
  const span = upper.at - lower.at;
  const ratio = span > 0 ? (value - lower.at) / span : 0;
  const [red, green, blue] = upper.rgb.map((channel, index) => (
    Math.round(lower.rgb[index] + ((channel - lower.rgb[index]) * ratio))
  ));
  const alpha = 0.14 + (value * 0.46);
  return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
};

// Continuous CSS ramp for the attention overlay, built from the real dwell
// bins. Depth with no measured dwell stays transparent rather than being
// painted a "cold" colour it did not earn.
export const buildScrollAttentionGradient = attention => {
  const bands = Array.isArray(attention?.bands) ? attention.bands : [];
  if (!bands.length || !(Number(attention?.totalVisibleMs) > 0)) {
    return null;
  }
  const stops = bands.map(band => {
    const intensity = Math.max(0, Math.min(1, Number(band.intensity) || 0));
    const midpoint = (band.depthStartPercent + band.depthEndPercent) / 2;
    return `${scrollAttentionColor(intensity)} ${midpoint.toFixed(2)}%`;
  });
  return `linear-gradient(180deg, ${stops.join(', ')})`;
};

// What this visit did at one depth, for the draggable probe.
export const getScrollDepthReadout = (scrollMap, depthPercent) => {
  const depth = Math.max(0, Math.min(100, Number(depthPercent) || 0));
  const documentHeight = Number(scrollMap?.documentHeight);
  const bands = Array.isArray(scrollMap?.attention?.bands) ? scrollMap.attention.bands : [];
  const band = bands.find(item => (
    depth >= item.depthStartPercent && depth <= item.depthEndPercent
  )) || null;
  const reachPercent = Number(scrollMap?.reachPercent);
  return {
    depthPercent: depth,
    pixels: documentHeight > 0 ? Math.round((depth / 100) * documentHeight) : null,
    reached: Number.isFinite(reachPercent) ? depth <= reachPercent : null,
    visibleMs: band ? band.visibleMs : null,
    focusOffset: Number.isFinite(band?.focusOffset) ? band.focusOffset : null
  };
};

export default deriveSessionScrollMap;

// The depth probe stays in the stage's visible window instead of scrolling
// away with the page.
//
// A 9,000px page scrolls inside a ~600px stage, so a marker pinned to the
// document disappears the moment the reviewer scrolls — and its readout with
// it. Keeping it in view is what lets the rail drop its duplicate card:
// scrolling changes the depth, dragging fine-tunes it, and the answer is
// always on screen. `ratio` is where the marker sits inside that window.
export const getPinnedProbe = ({
  ratio = 0.5, renderedHeight, scrollTop = 0, viewportHeight
}) => {
  const height = Number(renderedHeight);
  const view = Number(viewportHeight);
  if (!(height > 0) || !(view > 0)) {
    return null;
  }
  const safeRatio = Math.min(1, Math.max(0, Number(ratio) || 0));
  const offset = Math.min(
    height,
    Math.max(0, Number(scrollTop) || 0) + (Math.min(view, height) * safeRatio)
  );
  return {
    depthPercent: clampPercentage((offset / height) * 100),
    top: offset
  };
};

// Horizontal twin of getPinnedProbe: the middle of the visible window rather
// than the middle of the rendered page. Returns null when the stage has not
// measured itself yet, so the caller can fall back to a plain 50%.
export const getPinnedProbeCenterX = ({
  renderedWidth, scrollLeft = 0, viewportWidth
}) => {
  const width = Number(renderedWidth);
  const view = Number(viewportWidth);
  if (!(width > 0) || !(view > 0)) {
    return null;
  }
  const left = Math.min(Math.max(0, Number(scrollLeft) || 0), Math.max(0, width - view));
  return left + (Math.min(view, width) / 2);
};

// Dragging reports a position inside the visible window, not a page depth.
export const getProbeRatioFromPointer = ({ clientY, viewportHeight, windowTop }) => {
  const view = Number(viewportHeight);
  if (!(view > 0)) {
    return null;
  }
  return Math.min(1, Math.max(0, (Number(clientY) - Number(windowTop || 0)) / view));
};
