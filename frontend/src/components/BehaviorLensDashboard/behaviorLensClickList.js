import { getHotspotLabel } from './behaviorLensElementLabels';
import {
  extractSessionHeatmapPoints,
  filterHeatmapPoints,
  HEATMAP_FILTER_ALL
} from './behaviorLensHeatmap';
import { getReplayOffsetForTimestamp } from './behaviorLensPageInsightsScope';
import { isTimestampInPageView } from './behaviorLensPageViews';

// Every click of the page view, listed by the element it landed on.
//
// The map can only draw a click whose element still exists in the frame on
// screen. The rail lists all of them: a drawn element keeps the rank it wears
// on the page, and the rest are grouped underneath so a click that cannot be
// painted is still readable and still seekable.
//
// SCOPE: one session, one page view. Every count here is a real recorded
// click; nothing is estimated and nothing is aggregated across sessions.

export const groupClickTimes = (points, firstTimestamp) => {
  const groups = new Map();
  (Array.isArray(points) ? points : [])
    .slice()
    .sort((left, right) => (
      Number(left.timestamp || 0) - Number(right.timestamp || 0)
      || Number(left.eventIndex || 0) - Number(right.eventIndex || 0)
    ))
    .forEach(point => {
      const offset = getReplayOffsetForTimestamp(point.timestamp, firstTimestamp);
      const second = Math.floor(offset / 1000);
      const existing = groups.get(second);
      if (existing) {
        existing.count += 1;
        existing.rageClickCount += point.isRageClick ? 1 : 0;
        existing.isRageClick = existing.isRageClick || Boolean(point.isRageClick);
        return;
      }
      groups.set(second, {
        count: 1,
        isRageClick: Boolean(point.isRageClick),
        key: `second-${second}`,
        offset,
        rageClickCount: point.isRageClick ? 1 : 0
      });
    });
  return Array.from(groups.values());
};

export const buildClickListRows = ({
  analysis,
  events,
  filter,
  firstTimestamp,
  nodeIndex,
  pageView,
  recordedViewport
}) => {
  const drawn = (analysis?.hotspots || []).map(hotspot => ({
    clickable: true,
    count: hotspot.count,
    id: hotspot.id,
    label: hotspot.label,
    rageClickCount: hotspot.rageClickCount || 0,
    rank: hotspot.rank,
    times: groupClickTimes(hotspot.points, firstTimestamp)
  }));

  const points = filterHeatmapPoints(
    extractSessionHeatmapPoints(events, recordedViewport)
      .filter(point => !pageView || isTimestampInPageView(point.timestamp, pageView)),
    filter || HEATMAP_FILTER_ALL
  );
  // A projected click carries its original event index, so "what the map drew"
  // is an exact set rather than a re-derived guess.
  const drawnEventIndexes = new Set(
    (analysis?.projected || []).map(point => point.eventIndex)
  );

  const buckets = new Map();
  points
    .filter(point => !drawnEventIndexes.has(point.eventIndex))
    .forEach(point => {
      const key = Number.isFinite(point.nodeId) ? `node:${point.nodeId}` : 'node:unknown';
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(point);
        return;
      }
      buckets.set(key, [point]);
    });

  const undrawn = Array.from(buckets.entries()).map(([key, list]) => {
    const { label } = getHotspotLabel(
      { representative: list[0], targetId: list[0].nodeId },
      nodeIndex,
      null
    );
    return {
      clickable: false,
      count: list.length,
      id: `undrawn:${key}`,
      label,
      rageClickCount: list.filter(point => point.isRageClick).length,
      rank: null,
      times: groupClickTimes(list, firstTimestamp)
    };
  }).sort((left, right) => (
    right.count - left.count || left.times[0].offset - right.times[0].offset
  ));

  return { drawn, undrawn };
};

export default buildClickListRows;
