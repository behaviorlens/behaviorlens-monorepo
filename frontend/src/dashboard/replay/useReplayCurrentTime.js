import { useEffect, useState } from 'react';

const getEventPayload = event => (
  event?.payload ?? event?.detail?.payload ?? event?.detail
);

// Mirrors the rrweb player clock so the rail can mark the event the playhead
// is currently on. rrweb-player supports multiple listeners, so this does not
// disturb the control bar's own subscription.
export const useReplayCurrentTime = (playerInstanceRef, replayReady, subscriptionKey = 0) => {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  useEffect(() => {
    if (!replayReady) {
      setCurrentTimeMs(0);
      return undefined;
    }
    setCurrentTimeMs(0);
    const player = playerInstanceRef.current;
    if (!player) {
      return undefined;
    }
    const updateTime = value => {
      const time = Number(value);
      if (Number.isFinite(time)) {
        setCurrentTimeMs(current => {
          const next = Math.max(0, time);
          return current === next ? current : next;
        });
      }
    };
    const unsubscribe = typeof player.addEventListener === 'function'
      ? player.addEventListener('ui-update-current-time', event => {
        updateTime(getEventPayload(event));
      })
      : null;
    const samplePlayerClock = () => {
      try {
        updateTime(player.getReplayer?.()?.getCurrentTime?.());
      } catch (error) {
        // The event subscription remains available while rrweb is rebuilding.
      }
    };
    samplePlayerClock();
    const interval = window.setInterval(samplePlayerClock, 250);

    return () => {
      window.clearInterval(interval);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [playerInstanceRef, replayReady, subscriptionKey]);

  return currentTimeMs;
};

// The current event is the last one at or before the playhead. Insights are
// already ordered by timestamp, so a reverse scan finds it without sorting.
export const findCurrentInsightId = (insights, firstEventTimestamp, currentTimeMs) => {
  if (!Array.isArray(insights) || insights.length === 0) {
    return null;
  }
  const playheadTimestamp = Number(firstEventTimestamp) + Number(currentTimeMs || 0);
  if (!Number.isFinite(playheadTimestamp)) {
    return null;
  }
  for (let index = insights.length - 1; index >= 0; index -= 1) {
    if (Number(insights[index]?.timestamp) <= playheadTimestamp) {
      return insights[index].id;
    }
  }
  return null;
};

// Convenience wrapper: subscribe to the clock and resolve the current event
// in one call.
export const useCurrentInsightId = (
  playerInstanceRef,
  replayReady,
  insights,
  firstEventTimestamp,
  subscriptionKey = 0
) => {
  const currentTimeMs = useReplayCurrentTime(playerInstanceRef, replayReady, subscriptionKey);
  return findCurrentInsightId(insights, firstEventTimestamp, currentTimeMs);
};

export default useReplayCurrentTime;
