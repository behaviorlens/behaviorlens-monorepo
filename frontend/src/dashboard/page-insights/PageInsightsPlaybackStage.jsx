import React, {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import RrwebPlayer from 'rrweb-player';
import {
  FullPageOverlay,
  InsightsPlaybackFrame,
  InsightsPlaybackStage,
  InsightsPlaybackSurface,
  InsightsSurfaceSlot,
  InsightsSnapshotMount,
  InsightsStateBody,
  InsightsStatePanel,
  InsightsStateTitle,
  InsightsStateWrap
} from './ScBehaviorLensPageInsights';
import { ReplayTransportDock } from '../workspace/ScBehaviorLensWorkspace';
import DevToolsDrawer from '../workspace/DevToolsDrawer';
import ReplayControlBar from '../replay/ReplayControlBar';
import SessionTimeline from '../replay/SessionTimeline';
import NoteSharePopover from '../notes/NoteSharePopover';
import { PLAYBACK_SPEED_OPTIONS } from '../workspace/sessionDetailConstants';
import { INSIGHTS_MODE_SCROLL_MAPS } from './InsightsModeTabs';
import { WORKSPACE_MODE_PAGE_INSIGHTS } from '../workspace/WorkspaceModeTabs';
import { measureReconstructedDocumentGeometry } from './behaviorLensScrollMap';
import { clampPageInsightsOffset } from './behaviorLensPageInsightsScope';
import {
  getPageInsightsFrameDocument,
  getPageInsightsMirror
} from './usePageInsightsSnapshot';
import { EMPTY_ARRAY, NOOP } from '../../lib/propDefaults';

const getEventPayload = event => (
  event?.payload ?? event?.detail?.payload ?? event?.detail
);

const setExactSize = (node, width, height) => {
  if (!node) return;
  node.style.setProperty('width', `${width}px`, 'important');
  node.style.setProperty('height', `${height}px`, 'important');
};

// rrweb normally applies a responsive transform of its own. Page Insights
// owns the outer scale so overlay coordinates and replay pixels use exactly
// the same transform.
const fitPlaybackViewport = ({
  mountNode, player, width, height
}) => {
  const iframe = player?.getReplayer?.()?.iframe
    || mountNode?.querySelector?.('iframe')
    || null;
  const wrapper = iframe?.closest?.('.replayer-wrapper');
  setExactSize(mountNode, width, height);
  setExactSize(mountNode?.querySelector?.('.rr-player'), width, height);
  setExactSize(mountNode?.querySelector?.('.rr-player__frame'), width, height);
  setExactSize(wrapper, width, height);
  setExactSize(iframe, width, height);
  if (wrapper) {
    wrapper.style.setProperty('left', '0', 'important');
    wrapper.style.setProperty('top', '0', 'important');
    wrapper.style.setProperty('transform', 'none', 'important');
    wrapper.style.setProperty('transform-origin', 'left top', 'important');
  }
};

const usePlaybackCallbacks = ({
  onPlayingChange, onPlayerChange, onTimeChange
}) => {
  const playing = useRef(onPlayingChange);
  const player = useRef(onPlayerChange);
  const time = useRef(onTimeChange);
  playing.current = onPlayingChange;
  player.current = onPlayerChange;
  time.current = onTimeChange;
  return { playing, player, time };
};

const getRecordedViewportSize = recordedViewport => ({
  height: Math.max(240, Number(recordedViewport?.height) || 540),
  width: Math.max(320, Number(recordedViewport?.width) || 960)
});

const useVisibleStageMeasurement = (stageRef, setAvailableSize) => {
  // Ignore display:none / mid-transition collapse so fullscreen does not
  // stamp a 1px scale onto Click Maps and Inspect overlays.
  const measureVisibleStage = useCallback(() => {
    const node = stageRef.current;
    if (!node) return false;
    const rect = node.getBoundingClientRect?.();
    const nextWidth = Number(node.clientWidth) || Number(rect?.width) || 0;
    const nextHeight = Number(node.clientHeight) || Number(rect?.height) || 0;
    if (nextWidth < 2 || nextHeight < 2) return false;
    setAvailableSize({
      height: Math.max(1, nextHeight),
      width: Math.max(1, nextWidth)
    });
    return true;
  }, [setAvailableSize, stageRef]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    measureVisibleStage();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measureVisibleStage);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureVisibleStage, stageRef]);

  return measureVisibleStage;
};

const usePlaybackProjection = ({
  availableSize,
  height,
  mountRef,
  playerRef,
  setRevision,
  width
}) => {
  const scale = useMemo(() => {
    if (!availableSize) return 1;
    return Math.min(1, availableSize.width / width, availableSize.height / height);
  }, [availableSize, height, width]);
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;

  const documentPointToRendered = useCallback((x, y) => {
    const frameDocument = getPageInsightsFrameDocument(mountRef.current, playerRef.current);
    const view = frameDocument?.defaultView;
    return {
      x: (Number(x) - (Number(view?.scrollX) || 0)) * scale,
      y: (Number(y) - (Number(view?.scrollY) || 0)) * scale
    };
  }, [mountRef, playerRef, scale]);
  const documentRectToRendered = useCallback(rect => {
    if (!rect) return null;
    const point = documentPointToRendered(rect.left, rect.top);
    return {
      height: rect.height * scale,
      left: point.x,
      top: point.y,
      width: rect.width * scale
    };
  }, [documentPointToRendered, scale]);
  const renderedPointToDocument = useCallback((x, y) => {
    const frameDocument = getPageInsightsFrameDocument(mountRef.current, playerRef.current);
    const view = frameDocument?.defaultView;
    return {
      x: (Number(x) / scale) + (Number(view?.scrollX) || 0),
      y: (Number(y) / scale) + (Number(view?.scrollY) || 0)
    };
  }, [mountRef, playerRef, scale]);
  const scrollToDocumentY = useCallback(documentY => {
    const frameDocument = getPageInsightsFrameDocument(mountRef.current, playerRef.current);
    frameDocument?.defaultView?.scrollTo?.({ behavior: 'smooth', top: Math.max(0, documentY - (height / 2)) });
    setRevision(value => value + 1);
  }, [height, mountRef, playerRef, setRevision]);

  return {
    documentPointToRendered,
    documentRectToRendered,
    renderedHeight,
    renderedPointToDocument,
    renderedWidth,
    scale,
    scrollToDocumentY
  };
};

const buildPlaybackStage = ({
  documentGeometry,
  documentPointToRendered,
  documentRectToRendered,
  mountRef,
  playerState,
  renderedHeight,
  renderedPointToDocument,
  renderedWidth,
  revision,
  scale,
  scrollToDocumentY
}) => {
  const ready = Boolean(playerState);
  return {
    ready,
    stage: ready ? {
      documentGeometry,
      documentPointToRendered,
      documentRectToRendered,
      frameDocument: getPageInsightsFrameDocument(mountRef.current, playerState),
      mirror: getPageInsightsMirror(playerState),
      mountNode: mountRef.current,
      renderedHeight,
      renderedPointToDocument,
      renderedWidth,
      revision,
      scale,
      scrollToDocumentY,
      viewportMode: true
    } : null
  };
};

const getEffectiveTransportRefs = ({
  fullscreenRef,
  localSkipInactivePreferenceRef,
  skipInactivePreferenceRef,
  stageRef
}) => ({
  effectiveFullscreenRef: fullscreenRef || stageRef,
  effectiveSkipInactivePreferenceRef: skipInactivePreferenceRef
    || localSkipInactivePreferenceRef
});

const PageInsightsPlaybackStage = ({
  active = true,
  activeMode = null,
  children,
  comments = EMPTY_ARRAY,
  devToolsOpen = false,
  events,
  fullscreenRef = null,
  onPlayingChange = NOOP,
  onPlayInSessionReplay,
  onPlayerChange = NOOP,
  onSelectNote,
  onSeek,
  onTimeChange = NOOP,
  recordedViewport = null,
  replayDurationMs = 0,
  scrollStage = null,
  scrollStageVisible = false,
  sessionId,
  skipInactivePreferenceRef = null,
  targetOffset = 0,
  targetRevision = 0,
  targetShouldPlay = false,
  telemetry = null,
  url = null
}) => {
  const stageRef = useRef(null);
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const lastTargetRef = useRef(null);
  const lastTargetRevisionRef = useRef(null);
  const callbacks = usePlaybackCallbacks({
    onPlayingChange, onPlayerChange, onTimeChange
  });
  const settleTimersRef = useRef([]);
  const localSkipInactivePreferenceRef = useRef(false);
  const [availableSize, setAvailableSize] = useState(null);
  const [documentGeometry, setDocumentGeometry] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const [playerState, setPlayerState] = useState(null);
  // Two different signals, deliberately kept apart.
  //
  // `revision` means "the reconstructed frame moved" and fires on every time
  // update, so overlays re-project. `playerRevision` means "a new player was
  // built" and only fires then. ReplayControlBar resets its own state — play
  // flag, clock, speed — whenever the revision it is given changes, so feeding
  // it the frame counter reset the play button several times a second and the
  // control bar could never show that playback was running.
  const [revision, setRevision] = useState(0);
  const [playerRevision, setPlayerRevision] = useState(0);
  const { height, width } = getRecordedViewportSize(recordedViewport);
  const playbackLocked = activeMode === INSIGHTS_MODE_SCROLL_MAPS;
  const playbackLockedRef = useRef(playbackLocked);
  playbackLockedRef.current = playbackLocked;
  const heldPlaybackRef = useRef(null);

  const settleFrame = useCallback(() => {
    settleTimersRef.current.forEach(timer => clearTimeout(timer));
    settleTimersRef.current = [80, 260].map(delay => setTimeout(() => {
      const player = playerRef.current;
      if (!player) return;
      fitPlaybackViewport({
        height, mountNode: mountRef.current, player, width
      });
      setRevision(value => value + 1);
    }, delay));
  }, [height, width]);

  const measureVisibleStage = useVisibleStageMeasurement(stageRef, setAvailableSize);

  const handleFullscreenChange = useCallback(() => {
    const refit = () => {
      // The Click Maps / Inspect iframe is display:none on Scroll Maps. Refitting
      // it from a 0×0 box (or from fullscreen mid-transition) stamps a broken
      // scale onto that surface; skip until the stage is actually visible.
      if (!measureVisibleStage()) {
        return;
      }
      const player = playerRef.current;
      const mountNode = mountRef.current;
      if (player && mountNode) {
        fitPlaybackViewport({
          height, mountNode, player, width
        });
        try {
          player.triggerResize?.();
        } catch (error) {
          /* A disposed player cannot be refitted. */
        }
      }
      settleFrame();
      setRevision(value => value + 1);
    };
    refit();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(refit);
    }
  }, [height, measureVisibleStage, settleFrame, width]);

  useLayoutEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode || !events.length) {
      setPlayerState(false);
      return undefined;
    }
    mountNode.innerHTML = '';
    setPlayerState(null);
    let player;
    let settleTimer;
    const unsubscribers = [];
    try {
      player = new RrwebPlayer({
        target: mountNode,
        props: {
          events,
          autoPlay: false,
          useVirtualDom: false,
          skipInactive: false,
          showController: false,
          mouseTail: false,
          width,
          height
        }
      });
      playerRef.current = player;
      fitPlaybackViewport({
        height, mountNode, player, width
      });
      const replayer = player.getReplayer?.();
      const totalTime = Number(replayer?.getMetaData?.()?.totalTime);
      const initialOffset = clampPageInsightsOffset(
        targetOffset,
        Number.isFinite(totalTime) ? totalTime : replayDurationMs
      );
      const shouldPlay = playbackLockedRef.current ? false : Boolean(targetShouldPlay);
      player.goto?.(initialOffset, shouldPlay);
      if (shouldPlay) {
        player.play?.();
        setIsPlaying(true);
        callbacks.playing.current(true);
      } else {
        player.pause?.();
        setIsPlaying(false);
        callbacks.playing.current(false);
      }
      lastTargetRef.current = initialOffset;
      lastTargetRevisionRef.current = targetRevision;
      setPlayerState(player);
      callbacks.player.current(player);
      // Only a genuinely new player resets the control bar.
      setPlayerRevision(value => value + 1);
      callbacks.time.current(initialOffset);
      const subscribe = (name, listener) => {
        const unsubscribe = player.addEventListener?.(name, listener);
        if (typeof unsubscribe === 'function') unsubscribers.push(unsubscribe);
      };
      subscribe('ui-update-current-time', event => {
        const next = Math.max(0, Number(getEventPayload(event)) || 0);
        callbacks.time.current(next);
        setRevision(value => value + 1);
      });
      subscribe('ui-update-player-state', event => {
        const playing = getEventPayload(event) === 'playing';
        setIsPlaying(playing);
        callbacks.playing.current(playing);
      });
      settleTimer = setTimeout(() => {
        if (playerRef.current !== player) return;
        fitPlaybackViewport({
          height, mountNode, player, width
        });
        setRevision(value => value + 1);
      }, 80);
    } catch (error) {
      playerRef.current = null;
      setPlayerState(false);
      callbacks.player.current(null);
      return undefined;
    }
    return () => {
      clearTimeout(settleTimer);
      settleTimersRef.current.forEach(timer => clearTimeout(timer));
      unsubscribers.forEach(unsubscribe => unsubscribe());
      try {
        const time = player?.getReplayer?.()?.getCurrentTime?.();
        if (Number.isFinite(time)) callbacks.time.current(Math.max(0, time));
      } catch (error) { /* disposed player */ }
      try { player?.$destroy?.(); } catch (error) { /* noop */ }
      if (playerRef.current === player) playerRef.current = null;
      callbacks.player.current(null);
    };
  }, [events, height, replayDurationMs, settleFrame, width]);

  useLayoutEffect(() => {
    const player = playerRef.current;
    const next = clampPageInsightsOffset(targetOffset, replayDurationMs);
    if (!player || playbackLockedRef.current) return;
    if (lastTargetRef.current === next
      && lastTargetRevisionRef.current === targetRevision) return;
    try {
      const shouldPlay = playbackLockedRef.current ? false : Boolean(targetShouldPlay);
      player.goto?.(next, shouldPlay);
      if (shouldPlay) {
        player.play?.();
        setIsPlaying(true);
        callbacks.playing.current(true);
      } else {
        player.pause?.();
        setIsPlaying(false);
        callbacks.playing.current(false);
      }
      lastTargetRef.current = next;
      lastTargetRevisionRef.current = targetRevision;
      callbacks.time.current(next);
      setRevision(value => value + 1);
      settleFrame();
    } catch (error) { /* disposed player */ }
  }, [replayDurationMs, settleFrame, targetOffset, targetRevision, targetShouldPlay]);

  useEffect(() => {
    if (active) return;
    const held = heldPlaybackRef.current;
    heldPlaybackRef.current = null;
    try { playerRef.current?.pause?.(); } catch (error) { /* noop */ }
    setIsPlaying(false);
    if (held) {
      callbacks.time.current(held.offset);
      callbacks.playing.current(held.playing);
      return;
    }
    callbacks.playing.current(false);
  }, [active]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return undefined;
    const publish = () => {
      const frameDocument = getPageInsightsFrameDocument(mountRef.current, player);
      const geometry = measureReconstructedDocumentGeometry(frameDocument);
      if (geometry) setDocumentGeometry(geometry);
      setRevision(value => value + 1);
    };
    const interval = window.setInterval(publish, isPlaying ? 200 : 500);
    publish();
    return () => window.clearInterval(interval);
  }, [isPlaying, playerState]);

  const {
    documentPointToRendered,
    documentRectToRendered,
    renderedHeight,
    renderedPointToDocument,
    renderedWidth,
    scale,
    scrollToDocumentY
  } = usePlaybackProjection({
    availableSize,
    height,
    mountRef,
    playerRef,
    setRevision,
    width
  });

  const seek = useCallback(nextOffset => {
    if (playbackLocked) {
      return false;
    }
    const next = clampPageInsightsOffset(nextOffset, replayDurationMs);
    const play = false;
    try {
      const player = playerRef.current;
      if (!player) return false;
      player.goto?.(next, play);
      if (play) player.play?.();
      else player.pause?.();
      lastTargetRef.current = next;
      setIsPlaying(play);
      callbacks.playing.current(play);
      callbacks.time.current(next);
      setRevision(value => value + 1);
      settleFrame();
      return true;
    } catch (error) {
      return false;
    }
  }, [playbackLocked, replayDurationMs, settleFrame]);
  const getCurrentTime = useCallback(() => {
    try {
      const current = playerRef.current?.getReplayer?.()?.getCurrentTime?.();
      return Number.isFinite(current) ? Math.max(0, current) : null;
    } catch (error) {
      return null;
    }
  }, []);
  useEffect(() => {
    if (playbackLocked) {
      if (heldPlaybackRef.current == null) {
        const offset = getCurrentTime();
        heldPlaybackRef.current = {
          offset: Number.isFinite(offset) ? offset : (Number(lastTargetRef.current) || 0),
          playing: Boolean(isPlayingRef.current)
        };
      }
      try { playerRef.current?.pause?.(); } catch (error) { /* noop */ }
      setIsPlaying(false);
      return undefined;
    }
    const held = heldPlaybackRef.current;
    if (held == null) {
      return undefined;
    }
    heldPlaybackRef.current = null;
    seek(held.offset, held.playing);
    return undefined;
  }, [getCurrentTime, playbackLocked, seek]);
  const togglePlay = useCallback(() => {
    if (playbackLocked) {
      return;
    }
    const current = getCurrentTime();
    const offset = Number.isFinite(current)
      ? current
      : (Number(lastTargetRef.current) || 0);
    try { playerRef.current?.pause?.(); } catch (error) { /* noop */ }
    isPlayingRef.current = false;
    setIsPlaying(false);
    callbacks.playing.current(false);
    callbacks.time.current(offset);
    onPlayInSessionReplay?.(offset);
  }, [getCurrentTime, onPlayInSessionReplay, playbackLocked]);
  const pauseForNote = useCallback(() => {
    try { playerRef.current?.pause?.(); } catch (error) { /* noop */ }
    setIsPlaying(false);
    callbacks.playing.current(false);
  }, []);

  if (playerState === false) {
    return (
      <>
        <InsightsPlaybackStage>
          <InsightsStateWrap>
            <InsightsStatePanel role="status">
              <InsightsStateTitle>The replay could not be rendered</InsightsStateTitle>
              <InsightsStateBody>This page view cannot be reconstructed from this recording.</InsightsStateBody>
            </InsightsStatePanel>
          </InsightsStateWrap>
        </InsightsPlaybackStage>
        {devToolsOpen && (
          <DevToolsDrawer
            onSeek={onSeek}
            resizable={false}
            telemetry={telemetry}
            url={url}
          />
        )}
      </>
    );
  }

  const { ready, stage } = buildPlaybackStage({
    documentGeometry,
    documentPointToRendered,
    documentRectToRendered,
    mountRef,
    playerState,
    renderedHeight,
    renderedPointToDocument,
    renderedWidth,
    revision,
    scale,
    scrollToDocumentY
  });
  const {
    effectiveFullscreenRef,
    effectiveSkipInactivePreferenceRef
  } = getEffectiveTransportRefs({
    fullscreenRef,
    localSkipInactivePreferenceRef,
    skipInactivePreferenceRef,
    stageRef
  });

  return (
    <>
      <InsightsSurfaceSlot
        $active={!scrollStageVisible}
        $devToolsOpen={devToolsOpen}
      >
        <InsightsPlaybackStage
          ref={stageRef}
          className="behaviorlens-workspace-stage"
          data-active-mode={activeMode}
          data-testid="behaviorlens-insights-playback-stage"
        >
          <InsightsPlaybackFrame $height={renderedHeight} $width={renderedWidth}>
            <InsightsPlaybackSurface $height={height} $scale={scale} $width={width}>
              <InsightsSnapshotMount ref={mountRef} aria-label="Playable replay for this page view" />
            </InsightsPlaybackSurface>
            {stage && (
              <FullPageOverlay $height={renderedHeight} $width={renderedWidth}>
                {children(stage)}
              </FullPageOverlay>
            )}
          </InsightsPlaybackFrame>
          {!ready && (
            <InsightsStateWrap $overlay>
              <InsightsStatePanel role="status">
                <InsightsStateTitle>Preparing replay</InsightsStateTitle>
                <InsightsStateBody>Reconstructing this page view.</InsightsStateBody>
              </InsightsStatePanel>
            </InsightsStateWrap>
          )}
        </InsightsPlaybackStage>
      </InsightsSurfaceSlot>
      <InsightsSurfaceSlot
        $active={scrollStageVisible}
        $devToolsOpen={devToolsOpen}
      >
        {scrollStage}
      </InsightsSurfaceSlot>
      {devToolsOpen && (
        <DevToolsDrawer
          onSeek={onSeek}
          resizable={false}
          telemetry={telemetry}
          url={url}
        />
      )}
      <ReplayTransportDock data-testid="behaviorlens-insights-transport-dock">
        <SessionTimeline
          comments={comments}
          events={events}
          isPlayingRef={isPlayingRef}
          onSelectNote={onSelectNote}
          playbackLocked={playbackLocked}
          playerInstanceRef={playerRef}
          replayDurationMs={replayDurationMs}
          replayReady={ready}
          replayRevision={playerRevision}
          seekReplay={seek}
          sessionId={sessionId}
        />
        <ReplayControlBar
          events={events}
          getReplayCurrentTime={getCurrentTime}
          isPlayingRef={isPlayingRef}
          noteSlot={(
            <NoteSharePopover
              disabled={playbackLocked}
              getReplayCurrentTime={getCurrentTime}
              onOpenPopover={pauseForNote}
              shareMode={WORKSPACE_MODE_PAGE_INSIGHTS}
            />
          )}
          playbackLocked={playbackLocked}
          playerInstanceRef={playerRef}
          replayDurationMs={replayDurationMs}
          replayReady={ready}
          replayRevision={playerRevision}
          seekReplay={seek}
          skipInactivePreferenceRef={effectiveSkipInactivePreferenceRef}
          speedOptions={PLAYBACK_SPEED_OPTIONS}
          stageRef={effectiveFullscreenRef}
          onFullscreenChange={handleFullscreenChange}
          togglePlay={togglePlay}
        />
      </ReplayTransportDock>
    </>
  );
};

PageInsightsPlaybackStage.propTypes = {
  active: PropTypes.bool,
  activeMode: PropTypes.string,
  children: PropTypes.func.isRequired,
  comments: PropTypes.array,
  devToolsOpen: PropTypes.bool,
  events: PropTypes.array.isRequired,
  fullscreenRef: PropTypes.shape({ current: PropTypes.any }),
  onPlayingChange: PropTypes.func,
  onPlayInSessionReplay: PropTypes.func,
  onPlayerChange: PropTypes.func,
  onSelectNote: PropTypes.func,
  onSeek: PropTypes.func,
  onTimeChange: PropTypes.func,
  recordedViewport: PropTypes.object,
  replayDurationMs: PropTypes.number,
  scrollStage: PropTypes.node,
  scrollStageVisible: PropTypes.bool,
  sessionId: PropTypes.string.isRequired,
  skipInactivePreferenceRef: PropTypes.shape({ current: PropTypes.bool }),
  targetOffset: PropTypes.number,
  targetRevision: PropTypes.number,
  targetShouldPlay: PropTypes.bool,
  telemetry: PropTypes.object,
  url: PropTypes.string
};

export default PageInsightsPlaybackStage;
