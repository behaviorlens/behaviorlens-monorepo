import { getClickPaint } from './behaviorLensHeatmap';

// Document-space click mapping for Page Insights.
//
// rrweb records a click as viewport coordinates (clientX/clientY) plus the
// document scroll offset at that instant, which extractSessionHeatmapPoints
// already carries on every point. Page Insights renders the whole page, so a
// click has to be resolved in document space instead:
//
//   1. element first — the clicked rrweb node is looked up in the mirror of
//      the reconstructed document and the click is anchored to that element's
//      real box, which is how a click map survives dynamic layout;
//   2. coordinate fallback — pageX/pageY = click + the recorded scroll, used
//      when the node is no longer present in the rendered page.
//
// Nothing here estimates a position it cannot derive: a click that resolves to
// neither an element nor an in-document coordinate is dropped.

export const INTERACTIVE_SELECTOR = [
  'a[href]', 'button', 'input', 'select', 'textarea', 'label', 'summary',
  '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
  '[role="checkbox"]', '[role="radio"]', '[role="option"]',
  '[contenteditable="true"]', '[tabindex]'
].join(',');

export const CLICK_GRID_CELL_PX = 48;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

// The rendered Page Insights iframe is the full document anchored at 0,0, so a
// bounding rect is already in document coordinates.
export const readDocumentRect = element => {
  const rect = element?.nodeType === 1 ? element.getBoundingClientRect?.() : null;
  if (!rect || !(rect.width > 0) || !(rect.height > 0)) {
    return null;
  }
  const view = element.ownerDocument?.defaultView;
  const scrollX = Number(view?.scrollX) || 0;
  const scrollY = Number(view?.scrollY) || 0;
  return {
    bottom: rect.bottom + scrollY,
    height: rect.height,
    left: rect.left + scrollX,
    right: rect.right + scrollX,
    top: rect.top + scrollY,
    width: rect.width
  };
};

// Climb to the element a person would say they clicked: an icon span inside a
// button is the button. Falls back to the node itself.
export const resolveClickableElement = element => {
  if (element?.nodeType !== 1) {
    return null;
  }
  if (typeof element.closest !== 'function') {
    return element;
  }
  return element.closest(INTERACTIVE_SELECTOR) || element;
};

export const projectClickToDocument = ({ documentGeometry, mirror, point }) => {
  const documentWidth = Number(documentGeometry?.width);
  const documentHeight = Number(documentGeometry?.height);
  if (!(documentWidth > 0) || !(documentHeight > 0)) {
    return null;
  }

  const rawNode = Number.isFinite(point?.nodeId) ? mirror?.getNode?.(point.nodeId) : null;
  const element = resolveClickableElement(rawNode?.nodeType === 1 ? rawNode : rawNode?.parentElement);
  const rect = readDocumentRect(element);
  const coordinateX = Number(point?.x) + Number(point?.recordedScrollX || 0);
  const coordinateY = Number(point?.y) + Number(point?.recordedScrollY || 0);
  const hasCoordinate = Number.isFinite(coordinateX) && Number.isFinite(coordinateY);

  if (rect) {
    // The recorded coordinate is kept whenever it still lands on the element,
    // so repeated clicks stay spread across a wide control instead of stacking
    // on its centre. Otherwise the element box is the honest anchor.
    const insideElement = hasCoordinate
      && coordinateX >= rect.left - 2 && coordinateX <= rect.right + 2
      && coordinateY >= rect.top - 2 && coordinateY <= rect.bottom + 2;
    return {
      ...point,
      anchor: insideElement ? 'element-coordinate' : 'element',
      documentX: clamp(insideElement ? coordinateX : rect.left + (rect.width / 2), 0, documentWidth),
      documentY: clamp(insideElement ? coordinateY : rect.top + (rect.height / 2), 0, documentHeight),
      elementRect: rect,
      targetId: Number.isFinite(mirror?.getId?.(element)) && mirror.getId(element) >= 0
        ? mirror.getId(element)
        : point.nodeId
    };
  }

  if (!hasCoordinate || coordinateX < 0 || coordinateY < 0
    || coordinateX > documentWidth || coordinateY > documentHeight) {
    return null;
  }
  return {
    ...point,
    anchor: 'coordinate',
    documentX: coordinateX,
    documentY: coordinateY,
    elementRect: null,
    targetId: point.nodeId
  };
};

// Clicks group by the element they landed on — the real "most clicked element"
// ranking. Coordinate-only clicks fall back to a fixed document grid so they
// still aggregate instead of each becoming its own hotspot.
export const clusterDocumentClicks = (points, { cellSizePx = CLICK_GRID_CELL_PX, limit } = {}) => {
  // Treat this utility as a data boundary too. Older recordings can contain
  // malformed or out-of-document clicks and callers must never be able to
  // crash the Page Insights render by passing an unresolved projection.
  const list = (Array.isArray(points) ? points : []).filter(point => (
    point
    && Number.isFinite(point.documentX)
    && Number.isFinite(point.documentY)
  ));
  const buckets = new Map();

  list.forEach(point => {
    const key = Number.isFinite(point.targetId) && point.elementRect
      ? `node:${point.targetId}`
      : `grid:${Math.floor(point.documentX / cellSizePx)}:${Math.floor(point.documentY / cellSizePx)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.points.push(point);
      return;
    }
    buckets.set(key, { key, points: [point] });
  });

  const clusters = Array.from(buckets.values()).map(bucket => {
    const count = bucket.points.length;
    const documentX = bucket.points.reduce((sum, point) => sum + point.documentX, 0) / count;
    const documentY = bucket.points.reduce((sum, point) => sum + point.documentY, 0) / count;
    const representative = bucket.points.slice().sort((left, right) => {
      const leftDistance = ((left.documentX - documentX) ** 2) + ((left.documentY - documentY) ** 2);
      const rightDistance = ((right.documentX - documentX) ** 2) + ((right.documentY - documentY) ** 2);
      return leftDistance - rightDistance || left.eventIndex - right.eventIndex;
    })[0];
    return {
      anchor: representative.anchor,
      count,
      documentX,
      documentY,
      elementRect: representative.elementRect || null,
      id: bucket.key,
      points: bucket.points,
      rageClickCount: bucket.points.filter(point => point.isRageClick).length,
      representative
    };
  }).sort((left, right) => (
    right.count - left.count || left.representative.eventIndex - right.representative.eventIndex
  ));

  return Number.isFinite(limit) ? clusters.slice(0, limit) : clusters;
};

export const getDocumentClickDensityRange = clusters => {
  const counts = (Array.isArray(clusters) ? clusters : []).map(cluster => cluster.count);
  if (!counts.length) {
    return null;
  }
  return {
    maximumClickCount: Math.max(...counts),
    minimumClickCount: Math.min(...counts)
  };
};

// Soft blobs in rendered pixels. The intensity ramp is the shared heatmap
// gradient, so Click Maps and the replay heatmap keep one colour language.
export const drawDocumentClickHeatmap = (canvas, blobs, {
  devicePixelRatio = 1, height, maximumClickCount, minimumClickCount, radius, rage = false, width
} = {}) => {
  if (!canvas) {
    return false;
  }
  const cssWidth = Math.max(0, Number(width) || 0);
  const cssHeight = Math.max(0, Number(height) || 0);
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  const context = canvas.getContext('2d');
  if (!context) {
    return false;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const list = Array.isArray(blobs) ? blobs : [];
  if (!list.length || cssWidth <= 0 || cssHeight <= 0) {
    return false;
  }
  const minimum = Number.isFinite(minimumClickCount) ? minimumClickCount : 0;
  const maximum = Number.isFinite(maximumClickCount) ? maximumClickCount : 0;
  const baseRadius = Number.isFinite(radius) && radius > 0
    ? radius
    : clamp(cssWidth * 0.045, 26, 70);

  context.globalCompositeOperation = 'source-over';
  list.slice().sort((left, right) => left.count - right.count).forEach(blob => {
    const { alpha, color: [red, green, blue] } = getClickPaint(
      blob.count, minimum, maximum, { rage }
    );
    const spread = maximum > minimum ? (blob.count - minimum) / (maximum - minimum) : 1;
    const blobRadius = baseRadius * (0.72 + (0.5 * spread));
    const gradient = context.createRadialGradient(
      blob.x, blob.y, 0, blob.x, blob.y, blobRadius
    );
    gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha})`);
    gradient.addColorStop(0.55, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.45})`);
    gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(blob.x, blob.y, blobRadius, 0, Math.PI * 2);
    context.fill();
  });
  return true;
};

// A cluster's share of the clicks actually recorded on this page view.
export const formatClickShare = (count, total) => {
  const safeTotal = Number(total);
  const safeCount = Number(count);
  if (!(safeTotal > 0) || !Number.isFinite(safeCount)) {
    return null;
  }
  const percent = (safeCount / safeTotal) * 100;
  return percent < 1 ? '< 1%' : `${Math.round(percent)}%`;
};
