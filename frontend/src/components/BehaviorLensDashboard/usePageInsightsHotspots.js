import {
  extractSessionHeatmapPoints,
  HEATMAP_FILTER_ALL,
  filterHeatmapPoints
} from './behaviorLensHeatmap';
import {
  clusterDocumentClicks,
  getDocumentClickDensityRange,
  projectClickToDocument
} from './behaviorLensClickMap';
import { getHotspotLabel } from './behaviorLensElementLabels';
import { isTimestampInPageView } from './behaviorLensPageViews';

// Ranked click hotspots for the Click Map.
//
// Clicks still come from the one existing parser, extractSessionHeatmapPoints;
// Page Insights only re-projects them into the rendered page's document space
// and groups them by the element they landed on. That grouping is the real
// "most clicked element" ranking — the same points, counted per target.
//
// Every cluster is ranked and drawn — nothing is hidden behind a cap, so the
// numbers on the page always add up to the counts in the rail.
//
// SCOPE: one session, one page view. BehaviorLens has no aggregate click endpoint,
// so every count here is a real per-session click count. Nothing derives
// unique users or cross-session ranking from this module.

export const buildPageInsightsHotspots = ({
  documentGeometry,
  events,
  filter,
  mirror,
  nodeIndex,
  pageView,
  recordedViewport,
  // A finite timestamp hides clicks that have not happened yet. Null means
  // the whole page view — that is what the rail uses. The overlay always
  // passes the playhead, playing or paused.
  visibleUntilTimestamp = null
}) => {
  const empty = {
    clusters: [],
    densityRange: null,
    elementAnchoredClicks: 0,
    hotspots: [],
    projected: [],
    totalClicks: 0,
    totalRageClicks: 0,
    unmappedClicks: 0
  };
  if (!documentGeometry) {
    return empty;
  }

  const pagePoints = extractSessionHeatmapPoints(events, recordedViewport)
    .filter(point => !pageView || isTimestampInPageView(point.timestamp, pageView));
  const allPoints = filterHeatmapPoints(pagePoints, filter || HEATMAP_FILTER_ALL);
  const points = allPoints.filter(point => !Number.isFinite(visibleUntilTimestamp)
    || Number(point.timestamp) <= visibleUntilTimestamp);
  if (points.length === 0) {
    return empty;
  }

  // Playback may gate which clicks are currently visible, but it must not
  // redefine what green and red mean every few milliseconds. Project the
  // complete page-view evidence once and use it as the stable colour domain;
  // the time gate below still controls which points, ranks and counts appear.
  const allProjected = allPoints
    .map(point => projectClickToDocument({ documentGeometry, mirror, point }))
    // A click outside the reconstructed document maps to null. Optional
    // chaining alone is not enough here: `undefined !== 'coordinate'` is true
    // and used to leak that null into the clustering pass.
    .filter(item => item && item.anchor !== 'coordinate');
  const projected = allProjected.filter(point => !Number.isFinite(visibleUntilTimestamp)
    || Number(point.timestamp) <= visibleUntilTimestamp);
  if (projected.length === 0) {
    return { ...empty, unmappedClicks: points.length };
  }

  const clusters = clusterDocumentClicks(projected);
  const densityClusters = Number.isFinite(visibleUntilTimestamp)
    ? clusterDocumentClicks(allProjected)
    : clusters;
  const ranked = clusters.map((cluster, index) => {
    const element = Number.isFinite(cluster.representative?.targetId)
      ? mirror?.getNode?.(cluster.representative.targetId)
      : null;
    const { fromElement, label, tagName } = getHotspotLabel(
      { ...cluster, targetId: cluster.representative?.targetId },
      nodeIndex,
      element?.nodeType === 1 ? element : null
    );
    return {
      ...cluster,
      label,
      labelFromElement: fromElement,
      // Rank is the real position in the count-sorted list.
      rank: index + 1,
      tagName
    };
  });

  return {
    // Colour normalises across every cluster, not only the ranked ones, so the
    // painted heat and the badge colours share one scale.
    clusters,
    densityRange: getDocumentClickDensityRange(densityClusters),
    elementAnchoredClicks: projected.filter(point => point.anchor !== 'coordinate').length,
    hotspots: ranked,
    projected,
    // Shares use every click in scope, including a click that could not be
    // drawn, so the denominator stays honest.
    totalClicks: points.length,
    totalRageClicks: points.filter(point => point.isRageClick).length,
    unmappedClicks: points.length - projected.length
  };
};

export default buildPageInsightsHotspots;
