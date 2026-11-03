// Shared replay-offset helpers for Page Insights.
//
// Page Insights is scoped to a page view (see behaviorLensPageViews.js): rail
// totals and click lists stay that whole view. The Click Map overlay follows
// the playhead so a future click is not painted. These helpers only convert
// between absolute recording timestamps and replay-relative offsets.

export const clampPageInsightsOffset = (offsetMs, replayDurationMs) => {
  const duration = Number(replayDurationMs);
  const offset = Number(offsetMs);
  if (!Number.isFinite(offset)) {
    return 0;
  }
  if (!Number.isFinite(duration) || duration < 0) {
    return Math.max(0, offset);
  }
  return Math.min(duration, Math.max(0, offset));
};

export const getReplayOffsetForTimestamp = (timestamp, firstTimestamp) => (
  Math.max(0, Number(timestamp) - Number(firstTimestamp || 0))
);

export const getReplayFirstTimestamp = events => {
  const first = Number((Array.isArray(events) ? events : [])[0]?.timestamp);
  return Number.isFinite(first) ? first : 0;
};
