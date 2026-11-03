import { useCallback } from 'react';
import { HEATMAP_VIEW_HEATMAP, pauseReplayPlayer } from './behaviorLensHeatmap';

// Seek/read/pause helpers over the live rrweb-player instance, shared by the
// rail panels, the control bar, and the timeline zones.
export const useReplayTransport = ({
  isPlayingRef, payload, playerInstanceRef, replayDurationMs, setActiveInsightId, viewModeRef
}) => {
  const seekReplay = useCallback((offsetMs, shouldPlay = false) => {
    const player = playerInstanceRef.current;
    const targetOffset = Number(offsetMs);
    if (!player || !Number.isFinite(targetOffset) || targetOffset < 0 || targetOffset > replayDurationMs) {
      return false;
    }

    try {
      if (typeof player.goto === 'function') {
        player.goto(targetOffset, shouldPlay);
        if (shouldPlay) {
          player.play?.();
        } else {
          player.pause?.();
        }
        return true;
      }
      const replayer = typeof player.getReplayer === 'function' ? player.getReplayer() : null;
      if (replayer && typeof replayer.play === 'function') {
        replayer.play(targetOffset);
        if (!shouldPlay && typeof replayer.pause === 'function') {
          replayer.pause();
        }
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }, [replayDurationMs]);

  const getReplayCurrentTime = useCallback(() => {
    const player = playerInstanceRef.current;
    if (!player || typeof player.getReplayer !== 'function') {
      return null;
    }
    try {
      const currentTime = player.getReplayer()?.getCurrentTime?.();
      return Number.isFinite(currentTime) ? Math.max(0, currentTime) : null;
    } catch (error) {
      return null;
    }
  }, []);

  const pauseReplayForNote = useCallback(() => {
    if (!isPlayingRef.current) {
      return;
    }
    try {
      pauseReplayPlayer(playerInstanceRef.current);
      isPlayingRef.current = false;
    } catch (error) {
      // A disposed replay player cannot be paused.
    }
  }, [isPlayingRef]);

  const jumpToEvent = useCallback(insight => {
    if (!insight || !insight.timestamp || !playerInstanceRef.current) {
      return;
    }

    const events = Array.isArray(payload?.events) ? payload.events : [];
    if (!events.length) {
      return;
    }

    const firstTimestamp = Number(events[0]?.timestamp || 0);
    const targetOffset = Math.max(0, insight.timestamp - firstTimestamp);

    if (seekReplay(targetOffset, false)) {
      if (viewModeRef.current === HEATMAP_VIEW_HEATMAP) {
        pauseReplayPlayer(playerInstanceRef.current);
        isPlayingRef.current = false;
      }
      setActiveInsightId(insight.id);
    } else {
      setActiveInsightId(null);
    }
  }, [isPlayingRef, payload, playerInstanceRef, seekReplay, setActiveInsightId, viewModeRef]);

  return {
    getReplayCurrentTime, jumpToEvent, pauseReplayForNote, seekReplay
  };
};
