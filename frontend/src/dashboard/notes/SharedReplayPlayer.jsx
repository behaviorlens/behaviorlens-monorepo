import React, {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import {
  IconExpand, IconPauseFilled, IconPlayFilled, IconXmark
} from '../../ui/icons';
import RrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { getReplay } from '../../services/BehaviorLensService';
import { buildActivityInsights } from '../shared/behaviorLensEvents';
import { formatReplayTimestamp } from '../shared/behaviorLensNoteTimestamps';
import { ReplayClickToggle } from '../workspace/ScBehaviorLensDashboard';
import {
  PanePlayerExpandButton,
  PanePlayerFrame,
  PanePlayerFullscreenTransport,
  PanePlayerMount,
  PanePlayerPlayButton,
  PanePlayerRange,
  PanePlayerShell,
  PanePlayerStatus,
  PanePlayerTime,
  PanePlayerTransport,
  SharedPlayerPreviewClose,
  SharedPlayerPreviewModal,
  SharedPlayerPreviewSurface,
  SharedWorkspaceModalBody
} from './ScBehaviorLensSharedWithMe';
import ReplayControlBar from '../replay/ReplayControlBar';
import SessionTimeline from '../replay/SessionTimeline';
import { PLAYBACK_SPEED_OPTIONS } from '../workspace/sessionDetailConstants';
import { buildActivitySparklineOptions } from '../workspace/useSessionInsightsPanel';

const DEFAULT_PLAYER_WIDTH = 306;
const PLAYER_ASPECT_RATIO = 16 / 9;

const eventPayload = event => event?.payload ?? event?.detail?.payload ?? event?.detail;

const getReplayDuration = events => {
  if (!Array.isArray(events) || events.length < 2) return 0;
  const first = Number(events[0]?.timestamp);
  const last = Number(events[events.length - 1]?.timestamp);
  return Number.isFinite(first) && Number.isFinite(last) ? Math.max(0, last - first) : 0;
};

const clampTime = (value, duration) => Math.min(
  Math.max(0, Number(value) || 0),
  Math.max(0, Number(duration) || 0)
);

const SharedReplayPlayer = ({ offsetSeconds, sessionId }) => {
  const mountRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);
  const playerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const skipInactivePreferenceRef = useRef(false);
  const confirmSeekTimerRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [playerRevision, setPlayerRevision] = useState(0);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const durationMs = useMemo(() => getReplayDuration(events), [events]);
  const activitySparklineOptions = useMemo(() => buildActivitySparklineOptions(
    buildActivityInsights(events),
    {
      durationMs,
      firstTimestamp: Number(events[0]?.timestamp || 0)
    }
  ), [durationMs, events]);
  const targetTimeMs = clampTime(Number(offsetSeconds) * 1000, durationMs);
  const targetTimeRef = useRef(targetTimeMs);
  targetTimeRef.current = targetTimeMs;

  const assignMountNode = useCallback(node => {
    // The inline player and modal player exchange places through a portal.
    // Ignore the departing node's null callback so it cannot overwrite the
    // newly mounted destination node during the same React commit.
    if (!node) return;
    mountRef.current = node;
    setMountNode(current => (current === node ? current : node));
  }, []);

  const refitPlayer = useCallback(() => {
    const currentMountNode = mountRef.current;
    const player = playerRef.current;
    if (!currentMountNode || !player) return;
    window.requestAnimationFrame(() => {
      if (playerRef.current !== player) return;
      const width = Math.max(1, currentMountNode.clientWidth);
      const height = Math.max(1, currentMountNode.clientHeight);
      try {
        player.$set?.({ width, height });
        player.triggerResize?.();
      } catch (error) {
        // A disposed player cannot be refitted.
      }
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    setReady(false);
    setEvents([]);
    getReplay(sessionId).then(payload => {
      if (!active) return;
      const nextEvents = Array.isArray(payload?.events) ? payload.events : [];
      setEvents(nextEvents);
      setFailed(nextEvents.length === 0);
    }).catch(() => {
      if (active) setFailed(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [sessionId]);

  useLayoutEffect(() => {
    if (!mountNode || events.length === 0) return undefined;

    setReady(false);
    mountNode.innerHTML = '';
    const width = Math.max(240, mountNode.clientWidth || DEFAULT_PLAYER_WIDTH);
    let player;
    try {
      player = new RrwebPlayer({
        target: mountNode,
        props: {
          events,
          autoPlay: false,
          skipInactive: false,
          showController: false,
          width,
          height: Math.round(width / PLAYER_ASPECT_RATIO),
          mouseTail: {
            duration: 350,
            lineCap: 'round',
            lineWidth: 2,
            strokeStyle: '#ff6100'
          }
        }
      });
      playerRef.current = player;
      setPlayerRevision(revision => revision + 1);
      player.goto?.(targetTimeRef.current, false);
      player.pause?.();
      setCurrentTimeMs(targetTimeRef.current);
      currentTimeRef.current = targetTimeRef.current;
      isPlayingRef.current = false;
      setPlaying(false);
      setReady(true);
      // rrweb creates its iframe synchronously, but the reconstructed document
      // finishes attaching on the next event-loop turn. A session switch can
      // otherwise let that first frame overwrite the requested note offset
      // and visibly jump back to 00:00.
      confirmSeekTimerRef.current = setTimeout(() => {
        if (playerRef.current !== player) return;
        player.goto?.(targetTimeRef.current, false);
        player.pause?.();
        setCurrentTimeMs(targetTimeRef.current);
        currentTimeRef.current = targetTimeRef.current;
        isPlayingRef.current = false;
      }, 50);
    } catch (error) {
      setFailed(true);
      return undefined;
    }

    const unsubscribeTime = player.addEventListener?.('ui-update-current-time', event => {
      const next = Number(eventPayload(event));
      if (Number.isFinite(next)) {
        const clamped = clampTime(next, durationMs);
        currentTimeRef.current = clamped;
        setCurrentTimeMs(clamped);
      }
    });
    const unsubscribeState = player.addEventListener?.('ui-update-player-state', event => {
      const nextPlaying = eventPayload(event) === 'playing';
      isPlayingRef.current = nextPlaying;
      setPlaying(nextPlaying);
    });

    return () => {
      clearTimeout(confirmSeekTimerRef.current);
      confirmSeekTimerRef.current = null;
      if (typeof unsubscribeTime === 'function') unsubscribeTime();
      if (typeof unsubscribeState === 'function') unsubscribeState();
      try { player.$destroy?.(); } catch (error) { /* disposed */ }
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [durationMs, events, mountNode]);

  useLayoutEffect(() => {
    if (!ready || !mountNode || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(refitPlayer);
    observer.observe(mountNode);
    refitPlayer();
    return () => observer.disconnect();
  }, [mountNode, ready, refitPlayer]);

  // Notes in the same session share one player. Moving between them seeks the
  // existing instance instead of downloading and reconstructing it again.
  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player) return;
    try {
      clearTimeout(confirmSeekTimerRef.current);
      player.goto?.(targetTimeMs, false);
      player.pause?.();
      setCurrentTimeMs(targetTimeMs);
      currentTimeRef.current = targetTimeMs;
      isPlayingRef.current = false;
      setPlaying(false);
      confirmSeekTimerRef.current = setTimeout(() => {
        if (playerRef.current !== player) return;
        player.goto?.(targetTimeRef.current, false);
        player.pause?.();
        setCurrentTimeMs(targetTimeRef.current);
        currentTimeRef.current = targetTimeRef.current;
        isPlayingRef.current = false;
      }, 50);
    } catch (error) {
      setFailed(true);
    }
  }, [ready, targetTimeMs]);

  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (playing) {
        player.pause?.();
        isPlayingRef.current = false;
        setPlaying(false);
      } else {
        player.play?.();
        isPlayingRef.current = true;
        setPlaying(true);
      }
    } catch (error) {
      setFailed(true);
    }
  }, [playing]);

  const seekReplay = useCallback((value, playAfterSeek = isPlayingRef.current) => {
    const next = clampTime(value, durationMs);
    const player = playerRef.current;
    if (!player) return;
    try {
      player.goto?.(next, Boolean(playAfterSeek));
      currentTimeRef.current = next;
      setCurrentTimeMs(next);
    } catch (error) {
      setFailed(true);
    }
  }, [durationMs]);

  const seek = useCallback(event => {
    seekReplay(event.target.value, playing);
  }, [playing, seekReplay]);

  const getReplayCurrentTime = useCallback(() => currentTimeRef.current, []);

  const openPreview = useCallback(() => {
    playerRef.current?.pause?.();
    isPlayingRef.current = false;
    setPlaying(false);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    const noteTimeMs = targetTimeRef.current;
    playerRef.current?.goto?.(noteTimeMs, false);
    playerRef.current?.pause?.();
    currentTimeRef.current = noteTimeMs;
    isPlayingRef.current = false;
    setCurrentTimeMs(noteTimeMs);
    setPlaying(false);
    setPreviewOpen(false);
  }, []);

  useEffect(() => {
    if (!previewOpen) return undefined;

    const handleBackdropPointerDown = event => {
      const previewPanel = document.querySelector('[data-shared-player-preview-panel]');
      if (previewPanel && !previewPanel.contains(event.target)) closePreview();
    };
    document.addEventListener('pointerdown', handleBackdropPointerDown, true);
    return () => document.removeEventListener('pointerdown', handleBackdropPointerDown, true);
  }, [closePreview, previewOpen]);

  const player = (
    <PanePlayerShell $preview={previewOpen} data-testid="behaviorlens-shared-player">
      <PanePlayerFrame data-shared-player-frame>
        <PanePlayerMount ref={assignMountNode} aria-label="Session replay" />
        <ReplayClickToggle aria-hidden="true" onClick={togglePlayback} />
        {(loading || failed) && (
          <PanePlayerStatus role="status">
            {loading ? 'Loading session replay…' : 'Session replay is unavailable.'}
          </PanePlayerStatus>
        )}
      </PanePlayerFrame>
      <PanePlayerTransport
        data-shared-player-transport="compact"
        data-testid="behaviorlens-shared-player-transport"
      >
        <PanePlayerPlayButton
          type="button"
          onClick={togglePlayback}
          disabled={!ready || failed}
          aria-label={playing ? 'Pause replay' : 'Play replay'}
        >
          {playing
            ? <IconPauseFilled className="behaviorlens-transport-glyph" aria-hidden="true" />
            : <IconPlayFilled className="behaviorlens-transport-glyph" aria-hidden="true" />}
        </PanePlayerPlayButton>
        <PanePlayerRange
          type="range"
          min="0"
          max={Math.max(1, durationMs)}
          step="100"
          value={clampTime(currentTimeMs, durationMs)}
          disabled={!ready || failed}
          onChange={seek}
          aria-label="Session replay position"
        />
        <PanePlayerTime>
          {`${formatReplayTimestamp(currentTimeMs)} / ${formatReplayTimestamp(durationMs)}`}
        </PanePlayerTime>
        <PanePlayerExpandButton
          type="button"
          onClick={openPreview}
          aria-label="Open replay preview"
        >
          <IconExpand aria-hidden="true" />
        </PanePlayerExpandButton>
      </PanePlayerTransport>
      <PanePlayerFullscreenTransport data-shared-player-transport="fullscreen">
        <SessionTimeline
          activitySparklineOptions={activitySparklineOptions}
          events={events}
          isPlayingRef={isPlayingRef}
          playerInstanceRef={playerRef}
          replayDurationMs={durationMs}
          replayReady={ready}
          replayRevision={playerRevision}
          seekReplay={seekReplay}
          showNotes={false}
        />
        <ReplayControlBar
          canFullscreen={false}
          events={events}
          getReplayCurrentTime={getReplayCurrentTime}
          isPlayingRef={isPlayingRef}
          noteSlot={null}
          onClosePreview={closePreview}
          playerInstanceRef={playerRef}
          replayDurationMs={durationMs}
          replayReady={ready}
          replayRevision={playerRevision}
          seekReplay={seekReplay}
          skipInactivePreferenceRef={skipInactivePreferenceRef}
          speedOptions={PLAYBACK_SPEED_OPTIONS}
          togglePlay={togglePlayback}
        />
      </PanePlayerFullscreenTransport>
    </PanePlayerShell>
  );

  return (
    <>
      {!previewOpen && player}
      <SharedPlayerPreviewModal
        open={previewOpen}
        fitOnMobile
        size="xxlarge"
        ariaLabel="Session replay preview"
        onClose={closePreview}
        data-shared-player-preview-panel
        data-testid="behaviorlens-shared-replay-preview"
      >
        <SharedWorkspaceModalBody noPadding>
          <SharedPlayerPreviewSurface>
            <SharedPlayerPreviewClose
              type="button"
              aria-label="Close replay preview"
              onClick={closePreview}
            >
              <IconXmark aria-hidden="true" />
            </SharedPlayerPreviewClose>
            {previewOpen && player}
          </SharedPlayerPreviewSurface>
        </SharedWorkspaceModalBody>
      </SharedPlayerPreviewModal>
    </>
  );
};

SharedReplayPlayer.propTypes = {
  offsetSeconds: PropTypes.number.isRequired,
  sessionId: PropTypes.string.isRequired
};

export default SharedReplayPlayer;
