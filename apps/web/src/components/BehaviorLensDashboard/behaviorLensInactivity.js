export const INACTIVITY_THRESHOLD_MS = 10000;

const USER_ACTIVITY_SOURCES = new Set([2, 3, 4, 5, 6, 12]);

export const buildInactivityGaps = (events, thresholdMs = INACTIVITY_THRESHOLD_MS) => {
  const replayEvents = Array.isArray(events) ? events : [];
  const firstTimestamp = Number(replayEvents[0]?.timestamp || 0);
  if (!firstTimestamp) {
    return [];
  }
  const activityOffsets = replayEvents
    .filter(event => Number(event?.type) === 3 && USER_ACTIVITY_SOURCES.has(Number(event?.data?.source)))
    .map(event => Math.max(0, Number(event.timestamp) - firstTimestamp))
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  const anchors = [0, ...activityOffsets];
  return anchors.slice(0, -1).map((startMs, index) => ({
    id: `${startMs}-${anchors[index + 1]}`,
    startMs,
    endMs: anchors[index + 1]
  })).filter(gap => gap.endMs - gap.startMs > thresholdMs);
};
