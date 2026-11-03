import { detectRageClickIndexes } from '../shared/behaviorLensEvents';
import { formatReplayTimestamp } from '../shared/behaviorLensNoteTimestamps';

export const HEATMAP_VIEW_REPLAY = 'replay';
export const HEATMAP_VIEW_HEATMAP = 'heatmap';
export const HEATMAP_FILTER_ALL = 'all';
export const HEATMAP_FILTER_RAGE = 'rage';

export const getHeatmapTimelineCategory = filter => (
  filter === HEATMAP_FILTER_RAGE ? 'rage' : 'click'
);
export const HEATMAP_OVERLAY_HOTSPOT_LIMIT = 40;
export const HEATMAP_CLUSTER_CELL_SIZE = 0.05;
export const HEATMAP_HOTSPOT_MIN_SIZE = 22;
export const HEATMAP_HOTSPOT_MAX_SIZE = 44;
export const DEFAULT_HEATMAP_OPACITY = 0.7;

const RRWEB_INCREMENTAL = 3;
const RRWEB_META = 4;
const RRWEB_FULL_SNAPSHOT = 2;
const MOUSE_INTERACTION_SOURCE = 2;
const MOUSE_CLICK_TYPE = 2;
const SCROLL_SOURCE = 3;
const VIEWPORT_RESIZE_SOURCE = 4;

export const HEATMAP_GRADIENT = [
  { offset: 0, color: [34, 197, 94], hex: '#22C55E' },
  { offset: 0.4, color: [250, 204, 21], hex: '#FACC15' },
  { offset: 0.7, color: [249, 115, 22], hex: '#F97316' },
  { offset: 1, color: [239, 68, 68], hex: '#EF4444' }
];
export const HEATMAP_LEGEND_GRADIENT = `linear-gradient(
  90deg,
  #ef4444 0%,
  #f97316 30%,
  #facc15 60%,
  #22c55e 100%
)`;
const clampNormalizedValue = value => Math.min(1, Math.max(0, value));

export const normalizeClickCount = (count, minimum, maximum) => {
  const safeCount = Number(count);
  const safeMinimum = Number(minimum);
  const safeMaximum = Number(maximum);
  if (![safeCount, safeMinimum, safeMaximum].every(Number.isFinite)) {
    return 0;
  }
  // Every bucket holding the same count means the density is uniform, and
  // uniform density is the top of the scale, not its cold end. Returning 0
  // here is what painted a lone hotspot green.
  if (safeMaximum <= safeMinimum) {
    return 1;
  }
  return clampNormalizedValue((safeCount - safeMinimum) / (safeMaximum - safeMinimum));
};

export const getHeatmapColorForNormalizedValue = value => {
  const normalized = clampNormalizedValue(Number.isFinite(value) ? value : 0);
  const upperIndex = HEATMAP_GRADIENT.findIndex(stop => stop.offset >= normalized);
  if (upperIndex <= 0) {
    return HEATMAP_GRADIENT[0].color.slice();
  }

  const upper = HEATMAP_GRADIENT[upperIndex];
  const lower = HEATMAP_GRADIENT[upperIndex - 1];
  const progress = (normalized - lower.offset) / (upper.offset - lower.offset);
  return lower.color.map((channel, index) => (
    Math.round(channel + ((upper.color[index] - channel) * progress))
  ));
};

export const getHeatmapColorForCount = (count, minimum, maximum) => {
  return getHeatmapColorForNormalizedValue(normalizeClickCount(count, minimum, maximum));
};

// Rage is one finding, so it gets one colour. Density is carried by opacity
// instead of by hue, which keeps a rage map from ever reading as calm green
// and leaves the green-to-red ramp meaning "few to many clicks" only.
export const RAGE_HEATMAP_COLOR = [220, 38, 38];
export const RAGE_HEATMAP_MIN_ALPHA = 0.55;

export const getClickPaint = (count, minimum, maximum, { rage = false } = {}) => {
  const intensity = normalizeClickCount(count, minimum, maximum);
  if (rage) {
    return {
      alpha: RAGE_HEATMAP_MIN_ALPHA + ((1 - RAGE_HEATMAP_MIN_ALPHA) * intensity),
      color: RAGE_HEATMAP_COLOR.slice()
    };
  }
  return { alpha: 1, color: getHeatmapColorForNormalizedValue(intensity) };
};

export const getHeatmapDensityRangeFromClusters = clusters => {
  const counts = (Array.isArray(clusters) ? clusters : [])
    .map(cluster => Number(cluster?.count))
    .filter(count => Number.isFinite(count) && count > 0);
  if (!counts.length) {
    return null;
  }
  return {
    minimumClickCount: Math.min(...counts),
    maximumClickCount: Math.max(...counts)
  };
};

export const isRrwebClickEvent = event => (
  event?.type === RRWEB_INCREMENTAL
  && event?.data?.source === MOUSE_INTERACTION_SOURCE
  && event?.data?.type === MOUSE_CLICK_TYPE
);

const isValidCoordinate = value => Number.isFinite(value) && value >= 0;

export const readValidViewport = value => {
  const width = Number(value?.width);
  const height = Number(value?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
};

const readViewportFromEvent = event => {
  if (!event) {
    return null;
  }
  if (event.type === RRWEB_META) {
    return readValidViewport(event.data);
  }
  if (event.type === RRWEB_INCREMENTAL && event.data?.source === VIEWPORT_RESIZE_SOURCE) {
    return readValidViewport(event.data);
  }
  return null;
};

export const isMappableHeatmapPoint = point => (
  Number.isFinite(point?.normalizedX)
  && Number.isFinite(point?.normalizedY)
  && Number.isFinite(point?.recordedViewportWidth)
  && Number.isFinite(point?.recordedViewportHeight)
  && point.recordedViewportWidth > 0
  && point.recordedViewportHeight > 0
);

export const extractSessionHeatmapPoints = (events, recordedViewport) => {
  const list = Array.isArray(events) ? events : [];
  const rageIndexes = detectRageClickIndexes(list);
  let currentViewport = readValidViewport(recordedViewport);
  let currentDocumentId = null;
  let currentScrollX = 0;
  let currentScrollY = 0;
  const points = [];

  list.forEach((event, eventIndex) => {
    const nextViewport = readViewportFromEvent(event);
    if (nextViewport) {
      currentViewport = nextViewport;
    }

    if (event?.type === RRWEB_FULL_SNAPSHOT) {
      currentDocumentId = Number.isFinite(event.data?.node?.id) ? event.data.node.id : null;
      currentScrollX = Number(event.data?.initialOffset?.left) || 0;
      currentScrollY = Number(event.data?.initialOffset?.top) || 0;
    } else if (
      event?.type === RRWEB_INCREMENTAL
      && event.data?.source === SCROLL_SOURCE
      && event.data?.id === currentDocumentId
    ) {
      currentScrollX = Number(event.data.x) || 0;
      currentScrollY = Number(event.data.y) || 0;
    }

    if (!isRrwebClickEvent(event)) {
      return;
    }

    const { timestamp } = event;
    const { x, y } = event.data;
    if (!Number.isFinite(timestamp) || !isValidCoordinate(x) || !isValidCoordinate(y)) {
      return;
    }

    const point = {
      eventIndex,
      timestamp,
      x,
      y,
      // Session-local rrweb node id for the clicked element. Used only to
      // look up real attributes within this recording; never as a
      // cross-session element identity.
      nodeId: Number.isFinite(event.data.id) ? event.data.id : null,
      recordedScrollX: currentScrollX,
      recordedScrollY: currentScrollY,
      isRageClick: rageIndexes.has(eventIndex)
    };

    if (currentViewport) {
      point.recordedViewportWidth = currentViewport.width;
      point.recordedViewportHeight = currentViewport.height;
      point.normalizedX = x / currentViewport.width;
      point.normalizedY = y / currentViewport.height;
    }

    points.push(point);
  });

  return points;
};

export const filterHeatmapPoints = (points, filter) => {
  const list = Array.isArray(points) ? points : [];
  if (filter === HEATMAP_FILTER_RAGE) {
    return list.filter(point => point.isRageClick);
  }
  return list;
};

export const getHeatmapStatus = (points, filter) => {
  const filtered = filterHeatmapPoints(points, filter);
  if (filter === HEATMAP_FILTER_RAGE && filtered.length === 0) {
    return {
      kind: 'empty-rage',
      message: 'No rage clicks were detected in this session.',
      count: 0,
      points: []
    };
  }
  if (filtered.length === 0) {
    return {
      kind: 'empty-clicks',
      message: 'No clicks were recorded for this session.',
      count: 0,
      points: []
    };
  }

  const mappable = filtered.filter(isMappableHeatmapPoint);
  if (mappable.length === 0) {
    return {
      kind: 'unavailable-viewport',
      message: 'Heatmap is unavailable because the recorded viewport could not be determined.',
      count: filtered.length,
      points: []
    };
  }

  return {
    kind: 'ready',
    message: null,
    count: filtered.length,
    points: mappable
  };
};

export const formatClickCount = (count, { rage = false } = {}) => {
  const safeCount = Number.isFinite(count) ? count : 0;
  if (rage) {
    return safeCount === 1 ? '1 rage click' : `${safeCount} rage clicks`;
  }
  return safeCount === 1 ? '1 click' : `${safeCount} clicks`;
};

export const getHeatmapTimelineInsightId = point => `${point.eventIndex}-${point.timestamp || 0}`;

export const findHeatmapPointByInsightId = (points, insightId) => {
  if (!insightId) {
    return null;
  }
  return (Array.isArray(points) ? points : []).find(
    point => getHeatmapTimelineInsightId(point) === insightId
  ) || null;
};

export const getHeatmapOverlayPoint = (point, overlayBox) => {
  if (!isMappableHeatmapPoint(point)) {
    return null;
  }
  const width = Number(overlayBox?.width);
  const height = Number(overlayBox?.height);
  if (!(width > 0) || !(height > 0)) {
    return null;
  }
  return {
    left: Math.min(width, Math.max(0, point.normalizedX * width)),
    top: Math.min(height, Math.max(0, point.normalizedY * height))
  };
};

export const clusterHeatmapPoints = (points, {
  cellSize = HEATMAP_CLUSTER_CELL_SIZE,
  limit = HEATMAP_OVERLAY_HOTSPOT_LIMIT
} = {}) => {
  const list = Array.isArray(points) ? points : [];
  const buckets = new Map();

  list.forEach(point => {
    const col = Math.floor(point.normalizedX / cellSize);
    const row = Math.floor(point.normalizedY / cellSize);
    const key = `${col}:${row}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.points.push(point);
      return;
    }
    buckets.set(key, { key, points: [point] });
  });

  return Array.from(buckets.values()).map(bucket => {
    const count = bucket.points.length;
    const centerX = bucket.points.reduce((sum, point) => sum + point.normalizedX, 0) / count;
    const centerY = bucket.points.reduce((sum, point) => sum + point.normalizedY, 0) / count;
    const representative = bucket.points.slice().sort((left, right) => {
      const leftDistance = ((left.normalizedX - centerX) ** 2) + ((left.normalizedY - centerY) ** 2);
      const rightDistance = ((right.normalizedX - centerX) ** 2) + ((right.normalizedY - centerY) ** 2);
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }
      return left.eventIndex - right.eventIndex;
    })[0];

    return {
      id: bucket.key,
      count,
      centerX,
      centerY,
      representative,
      points: bucket.points
    };
  }).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return left.representative.eventIndex - right.representative.eventIndex;
  }).slice(0, limit);
};

export const getHeatmapDensityRange = points => {
  const clusters = clusterHeatmapPoints(points, { limit: Number.POSITIVE_INFINITY });
  return getHeatmapDensityRangeFromClusters(clusters);
};

export const HEATMAP_WHEEL_STEP_THRESHOLD = 40;

export const getHotspotClicks = cluster => {
  const source = Array.isArray(cluster?.points) && cluster.points.length
    ? cluster.points
    : (cluster?.representative ? [cluster.representative] : []);
  return source.slice().sort((left, right) => {
    const time = Number(left.timestamp || 0) - Number(right.timestamp || 0);
    if (time !== 0) {
      return time;
    }
    return Number(left.eventIndex || 0) - Number(right.eventIndex || 0);
  });
};

export const clampHotspotClickIndex = (clickCount, index) => {
  const count = Number(clickCount) || 0;
  if (count <= 0) {
    return 0;
  }
  const current = Number.isFinite(index) ? Math.trunc(index) : 0;
  return Math.min(count - 1, Math.max(0, current));
};

export const stepHotspotClickIndex = (clickCount, currentIndex, direction) => {
  const count = Number(clickCount) || 0;
  if (count <= 0) {
    return 0;
  }
  const step = direction < 0 ? -1 : (direction > 0 ? 1 : 0);
  return (clampHotspotClickIndex(count, currentIndex) + step + count) % count;
};

export const consumeHotspotWheelDelta = (delta, remainder = 0) => {
  const nextRemainder = Number(remainder) + Number(delta);
  if (!Number.isFinite(nextRemainder)) {
    return { remainder: 0, step: 0 };
  }
  if (Math.abs(nextRemainder) < HEATMAP_WHEEL_STEP_THRESHOLD) {
    return { remainder: nextRemainder, step: 0 };
  }
  return {
    remainder: 0,
    step: nextRemainder > 0 ? 1 : -1
  };
};

export const getHotspotTimeLabels = (cluster, firstTimestamp = 0) => {
  const labels = getHotspotClicks(cluster).map(point => formatReplayTimestamp(
    Math.max(0, Number(point.timestamp || 0) - Number(firstTimestamp || 0))
  ));

  return labels.filter((label, index) => labels.indexOf(label) === index);
};

export const formatHotspotLabel = (cluster, { firstTimestamp = 0, rage = false, clickIndex } = {}) => {
  const clicks = getHotspotClicks(cluster);
  const count = cluster?.count || clicks.length || 0;
  const hasStep = clicks.length > 1 && Number.isFinite(clickIndex);
  const index = hasStep ? clampHotspotClickIndex(clicks.length, clickIndex) : 0;
  const point = hasStep
    ? clicks[index]
    : (cluster?.representative || clicks[index]);
  const offsetMs = Math.max(0, Number(point?.timestamp || 0) - Number(firstTimestamp || 0));
  const clock = formatReplayTimestamp(offsetMs);
  if (hasStep) {
    return `View click ${index + 1} of ${count} around ${clock}`;
  }
  const noun = rage
    ? (count === 1 ? 'rage click' : 'rage clicks')
    : (count === 1 ? 'click' : 'clicks');
  return `View ${count} ${noun} around ${clock}`;
};

export const formatHotspotTooltip = (cluster, { firstTimestamp = 0, rage = false, clickIndex } = {}) => {
  const countLabel = formatClickCount(cluster?.count, { rage });
  const clicks = getHotspotClicks(cluster);
  if (clicks.length > 1 && Number.isFinite(clickIndex)) {
    const index = clampHotspotClickIndex(clicks.length, clickIndex);
    const point = clicks[index];
    const clock = formatReplayTimestamp(
      Math.max(0, Number(point?.timestamp || 0) - Number(firstTimestamp || 0))
    );
    return `${countLabel} · ${index + 1} of ${clicks.length} at ${clock}`;
  }
  const times = getHotspotTimeLabels(cluster, firstTimestamp);
  if (!times.length) {
    return countLabel;
  }
  if (times.length === 1) {
    return `${countLabel} at ${times[0]}`;
  }
  return `${countLabel} at ${times.join(', ')}`;
};

export const getHeatmapHotspotSize = count => {
  const safeCount = Number.isFinite(count) ? Math.max(1, count) : 1;
  return Math.min(HEATMAP_HOTSPOT_MAX_SIZE, HEATMAP_HOTSPOT_MIN_SIZE + ((safeCount - 1) * 4));
};

export const getReplayViewportElement = mountNode => {
  if (!mountNode || typeof mountNode.querySelector !== 'function') {
    return null;
  }
  return mountNode.querySelector('.replayer-wrapper')
    || mountNode.querySelector('.rr-player__frame')
    || null;
};

export const measureHeatmapOverlayBox = (stageNode, viewportNode) => {
  if (!stageNode || !viewportNode || typeof stageNode.getBoundingClientRect !== 'function') {
    return null;
  }
  const stageRect = stageNode.getBoundingClientRect();
  const viewRect = viewportNode.getBoundingClientRect();
  if (!(viewRect.width > 0) || !(viewRect.height > 0)) {
    return null;
  }
  return {
    left: viewRect.left - stageRect.left,
    top: viewRect.top - stageRect.top,
    width: viewRect.width,
    height: viewRect.height
  };
};

export const getHeatmapDevicePixelRatio = () => {
  const dpr = Number(typeof window === 'undefined' ? 1 : window.devicePixelRatio);
  if (!Number.isFinite(dpr) || dpr <= 0) {
    return 1;
  }
  return Math.min(dpr, 3);
};

const paintHeatmapClusters = (
  context,
  clusters,
  cssWidth,
  cssHeight,
  minimumClickCount,
  maximumClickCount
) => {
  const radius = Math.max(
    cssWidth * HEATMAP_CLUSTER_CELL_SIZE,
    cssHeight * HEATMAP_CLUSTER_CELL_SIZE
  ) * 0.85;
  const blobs = clusters.slice().sort((left, right) => left.count - right.count);

  context.globalCompositeOperation = 'source-over';
  blobs.forEach(cluster => {
    const [red, green, blue] = getHeatmapColorForCount(
      cluster.count,
      minimumClickCount,
      maximumClickCount
    );
    const centerX = cluster.centerX * cssWidth;
    const centerY = cluster.centerY * cssHeight;
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 1)`);
    gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
  });
};

export const drawClickHeatmap = (canvas, points, {
  width,
  height,
  devicePixelRatio = 1,
  minimumClickCount,
  maximumClickCount
} = {}) => {
  if (!canvas) {
    return;
  }

  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const cssWidth = Math.max(0, Number(width) || 0);
  const cssHeight = Math.max(0, Number(height) || 0);
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const list = Array.isArray(points) ? points : [];
  if (!list.length || cssWidth <= 0 || cssHeight <= 0) {
    return;
  }

  const clusters = clusterHeatmapPoints(list, { limit: Number.POSITIVE_INFINITY });
  const sharedRange = Number.isFinite(minimumClickCount) && Number.isFinite(maximumClickCount)
    ? { minimumClickCount, maximumClickCount }
    : getHeatmapDensityRangeFromClusters(clusters);
  if (sharedRange) {
    paintHeatmapClusters(
      context,
      clusters,
      cssWidth,
      cssHeight,
      sharedRange.minimumClickCount,
      sharedRange.maximumClickCount
    );
  }
};

export const observeHeatmapLayout = ({
  mountNode,
  stageNode,
  onBoxChange
} = {}) => {
  let frame = 0;
  let viewportNode = getReplayViewportElement(mountNode);

  const publish = () => {
    frame = 0;
    viewportNode = getReplayViewportElement(mountNode);
    if (typeof onBoxChange === 'function') {
      onBoxChange(measureHeatmapOverlayBox(stageNode, viewportNode), viewportNode);
    }
  };

  const schedule = () => {
    if (frame) {
      return;
    }
    if (typeof requestAnimationFrame === 'function') {
      frame = requestAnimationFrame(publish);
      return;
    }
    publish();
  };

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  if (resizeObserver) {
    if (mountNode) {
      resizeObserver.observe(mountNode);
    }
    if (stageNode) {
      resizeObserver.observe(stageNode);
    }
    if (viewportNode) {
      resizeObserver.observe(viewportNode);
    }
  }

  const mutationObserver = typeof MutationObserver === 'undefined' || !mountNode
    ? null
    : new MutationObserver(() => {
      const nextViewport = getReplayViewportElement(mountNode);
      if (resizeObserver && nextViewport && nextViewport !== viewportNode) {
        if (viewportNode) {
          try {
            resizeObserver.unobserve(viewportNode);
          } catch (error) {
            // The previous viewport node may already have been removed.
          }
        }
        resizeObserver.observe(nextViewport);
      }
      schedule();
    });

  if (mutationObserver) {
    mutationObserver.observe(mountNode, { childList: true, subtree: true });
  }

  schedule();

  return () => {
    if (frame && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frame);
    }
    frame = 0;
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
  };
};

export const pauseReplayPlayer = player => {
  if (!player) {
    return false;
  }
  try {
    if (typeof player.pause === 'function') {
      player.pause();
      return true;
    }
    const replayer = typeof player.getReplayer === 'function' ? player.getReplayer() : null;
    if (replayer && typeof replayer.pause === 'function') {
      replayer.pause();
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
};
