import { useCallback, useEffect, useRef } from 'react';
import { useMessageBus } from '../../lib/useMessageBus';

// Space toggles play/pause. isPlayingRef syncs with player state; parent may also trigger via postMessage.
export const useReplaySpaceControls = (playerInstanceRef, options = {}) => {
  const isPlayingRef = useRef(false);
  const beforeToggleRef = useRef(options.beforeToggle);
  beforeToggleRef.current = options.beforeToggle;

  const togglePlay = useCallback(() => {
    if (typeof beforeToggleRef.current === 'function') {
      beforeToggleRef.current();
    }
    const player = playerInstanceRef.current;
    if (!player) {
      return;
    }
    if (isPlayingRef.current) {
      if (typeof player.pause === 'function') {
        isPlayingRef.current = false;
        try {
          player.pause();
        } catch (error) {
          isPlayingRef.current = true;
        }
      }
    } else if (typeof player.play === 'function') {
      isPlayingRef.current = true;
      try {
        player.play();
      } catch (error) {
        isPlayingRef.current = false;
      }
    }
  }, [playerInstanceRef]);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.code !== 'Space' && event.key !== ' ') {
        return;
      }
      const { target } = event;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay]);

  return { togglePlay, isPlayingRef };
};

// When embedded in the AI review dashboard, speak the postMessage protocol with
// the parent: hand up viewport/started/sessionId, answer seek / getPlayerState,
// and toggle play/pause on a forwarded Space press (behaviorlens:toggle).
export const useEmbedReplayBridge = ({
  isEmbedded, payload, playerInstanceRef, togglePlay
}) => {
  const getEmbeddedPlayerState = useCallback(() => {
    const player = playerInstanceRef.current;
    const events = Array.isArray(payload?.events) ? payload.events : [];
    if (!player || !events.length) {
      return null;
    }

    const firstTimestamp = Number(events[0]?.timestamp || 0);
    const lastTimestamp = Number(events[events.length - 1]?.timestamp || 0);
    const totalDurationMs = Math.max(0, lastTimestamp - firstTimestamp);

    let currentTimeMs = 0;
    try {
      const replayer = typeof player.getReplayer === 'function' ? player.getReplayer() : null;
      if (replayer && typeof replayer.getCurrentTime === 'function') {
        currentTimeMs = Math.max(0, replayer.getCurrentTime());
      }
    } catch {
      // Player can still be warming up.
    }

    return {
      currentTimeMs,
      totalDurationMs,
      currentTimeSeconds: currentTimeMs / 1000,
      totalDurationSeconds: totalDurationMs / 1000
    };
  }, [payload, playerInstanceRef]);

  const postPlayerStateToParent = useCallback(() => {
    const playerState = getEmbeddedPlayerState();
    if (!playerState) {
      return;
    }
    window.parent?.postMessage({
      type: 'behaviorlens:playerState',
      playerState
    }, window.location.origin);
  }, [getEmbeddedPlayerState]);

  const seekToSeconds = useCallback(seconds => {
    const player = playerInstanceRef.current;
    if (!player) {
      return;
    }

    const ms = Math.max(0, Number(seconds) || 0) * 1000;

    try {
      if (typeof player.goto === 'function') {
        player.goto(ms, false);
      } else if (typeof player.getReplayer === 'function') {
        const replayer = player.getReplayer();
        if (replayer && typeof replayer.play === 'function') {
          replayer.play(ms);
          if (typeof replayer.pause === 'function') {
            replayer.pause();
          }
        }
      }
    } catch {
      // Seek can fail if the player is still warming up.
    }
  }, [playerInstanceRef]);

  useEffect(() => {
    if (!isEmbedded) {
      return undefined;
    }

    if (payload) {
      const metaForParent = payload.meta || {};
      const viewportForParent = metaForParent.browser_info?.viewport || {};
      window.parent?.postMessage({
        type: 'behaviorlens:meta',
        sessionId: payload.session_id,
        startedAt: metaForParent.started_at || null,
        viewport: viewportForParent.width && viewportForParent.height
          ? `${viewportForParent.width}x${viewportForParent.height}`
          : null
      }, window.location.origin);
    }

    return undefined;
  }, [isEmbedded, payload]);

  useMessageBus({
    allowedOrigins: [window.location.origin],
    on: {
      'behaviorlens:getPlayerState': () => {
        if (!isEmbedded) return;
        postPlayerStateToParent();
      },
      'behaviorlens:toggle': () => {
        if (!isEmbedded) return;
        togglePlay();
      },
      'behaviorlens:seek': data => {
        if (!isEmbedded) return;
        seekToSeconds(data.seconds);
      }
    }
  });
};
