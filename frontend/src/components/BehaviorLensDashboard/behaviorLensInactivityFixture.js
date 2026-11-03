// TEST/DEV FIXTURE ONLY — never imported by product code.
//
// rrweb-player decides a period is inactive when the gap between two
// consecutive *user interaction* events exceeds its threshold, scaled by
// playback speed:
//
//   nextEvent.delay - currentEvent.delay > SKIP_THRESHOLD_MS * speed
//
// The bundled rrweb-player uses 1e4 (10 seconds) at 1x. A gap of exactly 10s
// therefore does NOT qualify — it must be strictly greater — which is why an
// arbitrary "10 second" fixture cannot verify the feature.
//
// Only events rrweb classifies as user interaction count toward the gap:
// mouse interaction (source 2), scroll (3), input (5), selection (14) and
// similar. Meta/mutation events do not reset the idle window.
export const RRWEB_SKIP_INACTIVE_THRESHOLD_MS = 10000;

// Comfortably past the threshold so the assertion is not borderline.
export const FIXTURE_IDLE_GAP_MS = 15000;

const META_TYPE = 4;
const INCREMENTAL_TYPE = 3;
const MOUSE_INTERACTION_SOURCE = 2;
const MOUSE_CLICK_TYPE = 2;
const INPUT_SOURCE = 5;

const clickAt = (timestamp, x, y, id = 90) => ({
  type: INCREMENTAL_TYPE,
  timestamp,
  data: {
    source: MOUSE_INTERACTION_SOURCE, type: MOUSE_CLICK_TYPE, x, y, id
  }
});

const inputAt = (timestamp, id = 90) => ({
  type: INCREMENTAL_TYPE,
  timestamp,
  data: { source: INPUT_SOURCE, id, text: 'x' }
});

// Builds a replay whose interaction gaps straddle the real threshold:
//
//   t0        activity
//   +15s      activity   <- qualifying idle gap (skippable)
//   +2s       activity   <- ordinary gap (never skipped)
//   +15s      activity   <- second qualifying idle gap
//
// Timestamps are synthetic and belong to the fixture; production replay
// timestamps are never rewritten for testing.
export const buildInactivityFixtureEvents = (startTimestamp = 1000) => {
  const t0 = startTimestamp;
  const firstIdleEnd = t0 + FIXTURE_IDLE_GAP_MS;
  const shortGapEnd = firstIdleEnd + 2000;
  const secondIdleEnd = shortGapEnd + FIXTURE_IDLE_GAP_MS;

  return [
    { type: META_TYPE, timestamp: t0 - 100, data: { width: 1000, height: 800 } },
    clickAt(t0, 100, 100),
    clickAt(firstIdleEnd, 120, 140),
    inputAt(shortGapEnd),
    clickAt(secondIdleEnd, 300, 320)
  ];
};

// The gaps a correct implementation should treat as inactive, as [start, end]
// offsets from the first event.
export const getExpectedInactivityGaps = (startTimestamp = 1000) => {
  const events = buildInactivityFixtureEvents(startTimestamp);
  const interactions = events.filter(event => event.type === INCREMENTAL_TYPE);
  const gaps = [];

  interactions.forEach((event, index) => {
    const next = interactions[index + 1];
    if (!next) {
      return;
    }
    const gap = next.timestamp - event.timestamp;
    if (gap > RRWEB_SKIP_INACTIVE_THRESHOLD_MS) {
      gaps.push([event.timestamp - startTimestamp, next.timestamp - startTimestamp]);
    }
  });

  return gaps;
};
