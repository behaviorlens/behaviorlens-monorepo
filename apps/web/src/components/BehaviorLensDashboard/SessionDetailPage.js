import React, {
  useCallback, useContext, useEffect, useMemo, useRef, useState
} from 'react';
import {
  Link, useHistory, useLocation, useParams
} from 'react-router-dom';
import PropTypes from 'prop-types';
import { IconAngleLeft, IconXmark } from '../../ui/icons';
import { getUrlParameter } from '../../lib/storage';
import RrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { getReplay, isReplayTooLargeError, setSessionEntered } from '../../services/BehaviorLensService';
import { UserContext } from '../../store';
import { whenWarm } from './replayWarmup';
import {
  EMBEDDED_PLAYER_MAX_SCALE,
  fitEmbeddedPlayerToMount,
  getPlayerSize,
  useBehaviorLensEmbedConfig,
  WORKSPACE_PLAYER_CONTROLLER_H
} from './behaviorLensEmbed';
import {
  Layout,
  Body,
  ReplayColumn,
  ReplayPane,
  InsightsPane,
  InsightTabPanels,
  InsightTabs,
  PlayerControllerStyles
} from './ScBehaviorLensDashboard';
import {
  StageColumn,
  WorkspaceBackLink,
  WorkspaceOverlayClose,
  WorkspaceBody,
  WorkspaceLayout,
  WorkspaceRail,
  WorkspaceShell,
  WorkspaceTopLeft,
  WorkspaceTopRight,
  WorkspaceTopRow
} from './ScBehaviorLensWorkspace';
import WorkspaceModeTabs, {
  WORKSPACE_MODE_PAGE_INSIGHTS,
  WORKSPACE_MODE_SESSION_NOTES,
  WORKSPACE_MODE_SESSION_REPLAY
} from './WorkspaceModeTabs';
import PageInsightsWorkspace from './PageInsightsWorkspace';
import { useReplayTransport } from './useReplayTransport';
import { useCurrentInsightId } from './useReplayCurrentTime';
import { useEmbedReplayBridge } from './behaviorLensReplayControls';
import { useSessionHeatmapView } from './SessionHeatmap';
import {
  getHeatmapTimelineCategory,
  HEATMAP_VIEW_HEATMAP,
  pauseReplayPlayer
} from './behaviorLensHeatmap';
import { useSessionInsightsPanel } from './useSessionInsightsPanel';
import { SessionReviewMetadataFeature } from './SessionReviewMetadataPanel';
import SessionEventRail from './SessionEventRail';
import SessionNotesRail from './SessionNotesRail';
import WorkspaceSessionActions from './WorkspaceSessionActions';
import renderBlockingState from './renderSessionBlockingState';
import ReplayStageView from './ReplayStageView';
import SessionDetailRailPanels from './SessionDetailRailPanels';
import SessionInsightTabList, { getInsightTabId } from './SessionInsightTabList';
import { readSessionReplayPlaybackPreference } from './behaviorLensLayoutPreferences';
import SessionReplayPlayerStack from './SessionReplayPlayerStack';
import useReplayLayoutRefit from './useReplayLayoutRefit';
import useWorkspaceChrome from './useWorkspaceChrome';
import {
  readInsightsModeFromSearch,
  readWorkspaceModeFromSearch,
  writeInsightsModeToSearch,
  writeWorkspaceModeToSearch
} from './behaviorLensWorkspaceUrl';
import { readShareMomentOffsetMs } from './behaviorLensShareMomentUrl';
import WorkspaceRailSplitter, { useWorkspaceRailWidth } from './WorkspaceRailSplitter';
import { CUSTOM_EVENT_TAG_COLORS, getListReturnPath, PLAYBACK_SPEED_OPTIONS } from './sessionDetailConstants';
import useAssignedReviewerReviewCompletion from './useAssignedReviewerReviewCompletion';

import {
  REPLAY_UP_NEXT_COUNTDOWN_SECONDS,
  useInsightTabState,
  useIntentAwarePlayback,
  useReplayPlayerMount,
  useReplayRefs,
  useSessionRailNavigation,
  useSessionReplayEvents
} from './sessionDetailHooks';

const EMPTY_ENRICHMENT = Object.freeze({
  telemetry: { console: [], network: [] },
  timeline: { comments: [] }
});

// The page intentionally coordinates replay, insight and shared enrichment lifecycles.
const SessionDetailPage = ({
  locationOverride = null,
  onWorkspaceOverlayClose = null,
  sessionIdOverride = null,
  workspaceOverlayBanner = null
}) => {
  const history = useHistory();
  const routeLocation = useLocation();
  const routeParams = useParams();
  const sessionId = sessionIdOverride || routeParams.sessionId;
  const isWorkspaceOverlay = Boolean(onWorkspaceOverlayClose);
  const [overlaySearch, setOverlaySearch] = useState(locationOverride?.search || '');
  const location = locationOverride
    ? { ...locationOverride, search: overlaySearch }
    : routeLocation;
  const { state: userState } = useContext(UserContext);
  const currentUsername = typeof userState?.user?.username === 'string'
    ? userState.user.username.trim()
    : '';
  useEffect(() => {
    if (!currentUsername || !sessionId) return;
    setSessionEntered(sessionId).catch(() => {});
  }, [currentUsername, sessionId]);
  const {
    listReturnPath, sessionSlug, targetedNoteId, targetedReplyId
  } = useMemo(() => {
    const detailParams = new URLSearchParams(location.search);
    return {
      listReturnPath: getListReturnPath(location.state?.returnTo || detailParams.get('returnTo')),
      sessionSlug: location.state?.slug || detailParams.get('slug') || undefined,
      targetedNoteId: detailParams.get('note') || null,
      targetedReplyId: detailParams.get('reply') || null
    };
  }, [location.search, location.state]);
  const shareMomentOffsetMs = useMemo(
    () => readShareMomentOffsetMs(location.search),
    [location.search]
  );
  const {
    isEmbedded,
    isAIReviewDashboardEmbed,
    showAgentUserActivityBar
  } = useBehaviorLensEmbedConfig(location.search);
  useAssignedReviewerReviewCompletion({
    currentReviewerUsername: currentUsername,
    enabled: !isEmbedded,
    sessionId
  });
  const [loading, setLoading] = useState(true);
  const [replayWarming, setReplayWarming] = useState(false);
  const storedPlayback = readSessionReplayPlaybackPreference();
  const autoplayRef = useRef(!isEmbedded);
  const replayHasPlayedRef = useRef(false);
  const [payload, setPayload] = useState(null);
  const [upNextState, setUpNextState] = useState(null);
  const loadedSessionIdRef = useRef(null);
  const [activeInsightId, setActiveInsightId] = useState(null);
  const [replayReady, setReplayReady] = useState(false);
  const [workspaceRailWidth, setWorkspaceRailWidth] = useWorkspaceRailWidth();
  const [activeInsightTab, selectInsightTab, insightTabs] = useInsightTabState(isEmbedded);
  const heatmapBeforeToggleRef = useRef(() => {});
  // Survives session navigation, leaving the replay, and full reloads.
  const skipInactivePreferenceRef = useRef(storedPlayback.skipInactive);
  const {
    insightsPaneRef,
    playerInstanceRef,
    playerMountRef,
    replayPaneRef,
    warmupTimerRef
  } = useReplayRefs();
  const handlePlayerUnmount = useCallback(() => setReplayReady(false), []);
  const {
    isPlayingRef, togglePlay, userToggledPlaybackRef
  } = useIntentAwarePlayback(playerInstanceRef, heatmapBeforeToggleRef);
  const {
    assignPlayerMount, playerMountEl, playerMountRevision, resumePlayingRef, resumeTimeRef
  } = useReplayPlayerMount(
    playerMountRef, playerInstanceRef, handlePlayerUnmount, isPlayingRef
  );
  const {
    playerEvents, replayDurationMs
  } = useSessionReplayEvents(payload);
  const {
    handleViewModeChange,
    heatmapFilter,
    setHeatmapFilter,
    viewMode,
    viewModeRef
  } = useSessionHeatmapView({
    beforeToggleRef: heatmapBeforeToggleRef,
    isPlayingRef,
    playerInstanceRef,
    sessionId
  });
  const {
    getReplayCurrentTime, jumpToEvent, pauseReplayForNote, seekReplay
  } = useReplayTransport({
    isPlayingRef, payload, playerInstanceRef, replayDurationMs, setActiveInsightId, viewModeRef
  });
  const {
    devToolsOpen,
    scrollToReplayTop,
    setWorkspaceMode,
    toggleDevTools,
    workspaceFullscreenRef,
    workspaceMode
  } = useWorkspaceChrome({
    initialWorkspaceMode: readWorkspaceModeFromSearch(location.search),
    replayPaneRef
  });
  const rememberedInsightsModeRef = useRef(readInsightsModeFromSearch(location.search));
  useEffect(() => {
    if (readWorkspaceModeFromSearch(location.search) === WORKSPACE_MODE_PAGE_INSIGHTS) {
      rememberedInsightsModeRef.current = readInsightsModeFromSearch(location.search);
    }
  }, [location.search]);
  const replaceWorkspaceSearch = useCallback(params => {
    const query = params.toString();
    const search = query ? `?${query}` : '';
    if (isWorkspaceOverlay) {
      setOverlaySearch(search);
      return;
    }
    history.replace({
      pathname: location.pathname,
      search,
      state: location.state
    });
  }, [history, isWorkspaceOverlay, location.pathname, location.state]);
  // Frozen at the moment the reviewer opens Page Insights so later clock
  // ticks (written to resumeTimeRef) cannot re-seek and pause that surface.
  const [insightsEntry, setInsightsEntry] = useState({ offsetMs: 0 });
  const [noteReveal, setNoteReveal] = useState(null);
  const [noteShareOpenRequest, setNoteShareOpenRequest] = useState(0);
  const noteRevealRequestRef = useRef(0);
  useEffect(() => {
    if (targetedNoteId == null) return;
    noteRevealRequestRef.current += 1;
    setNoteReveal({
      noteId: targetedNoteId,
      offsetMs: shareMomentOffsetMs ?? 0,
      replyId: targetedReplyId,
      requestId: noteRevealRequestRef.current
    });
  }, [sessionId, shareMomentOffsetMs, targetedNoteId, targetedReplyId]);
  const handleWorkspaceModeChange = useCallback(nextMode => {
    setUpNextState(null);
    if (nextMode === WORKSPACE_MODE_PAGE_INSIGHTS && workspaceMode !== WORKSPACE_MODE_PAGE_INSIGHTS) {
      const live = getReplayCurrentTime();
      const offsetMs = Number.isFinite(live)
        ? Math.max(0, live)
        : (Number(resumeTimeRef.current) || 0);
      resumeTimeRef.current = offsetMs;
      resumePlayingRef.current = false;
      isPlayingRef.current = false;
      pauseReplayPlayer(playerInstanceRef.current);
      setInsightsEntry({ offsetMs });
    }
    replaceWorkspaceSearch(writeWorkspaceModeToSearch(
      location.search,
      nextMode,
      rememberedInsightsModeRef.current
    ));
    setWorkspaceMode(nextMode);
  }, [
    getReplayCurrentTime,
    location.search,
    replaceWorkspaceSearch,
    setWorkspaceMode,
    workspaceMode
  ]);
  const handleInsightsModeChange = useCallback(nextMode => {
    rememberedInsightsModeRef.current = nextMode;
    replaceWorkspaceSearch(writeInsightsModeToSearch(location.search, nextMode));
  }, [location.search, replaceWorkspaceSearch]);
  const handleSelectTimelineNote = useCallback((noteId, offsetMs) => {
    if (Number.isFinite(offsetMs)) {
      resumeTimeRef.current = Math.max(0, offsetMs);
    }
    resumePlayingRef.current = false;
    isPlayingRef.current = false;
    noteRevealRequestRef.current += 1;
    setNoteReveal({
      noteId,
      offsetMs,
      requestId: noteRevealRequestRef.current
    });
    handleWorkspaceModeChange(WORKSPACE_MODE_SESSION_NOTES);
  }, [handleWorkspaceModeChange]);
  const refitReplayLayout = useReplayLayoutRefit({
    isAIReviewDashboardEmbed, isEmbedded, playerInstanceRef, playerMountRef
  });
  const { navigateToSession, recentSessions } = useSessionRailNavigation({
    enabled: !isEmbedded, listReturnPath, sessionId
  });
  const recentSessionsRef = useRef(recentSessions);
  const navigateToSessionRef = useRef(navigateToSession);
  recentSessionsRef.current = recentSessions;
  navigateToSessionRef.current = navigateToSession;
  const cancelUpNext = useCallback(() => setUpNextState(null), []);
  const openNoteShare = useCallback(() => {
    cancelUpNext();
    pauseReplayForNote();
  }, [cancelUpNext, pauseReplayForNote]);
  const openSessionNotesAfterNoteSaved = useCallback(() => {
    setNoteReveal(null);
    handleWorkspaceModeChange(WORKSPACE_MODE_SESSION_NOTES);
  }, [handleWorkspaceModeChange]);
  const openNoteShareFromRail = useCallback(() => {
    setNoteShareOpenRequest(request => request + 1);
  }, []);
  const toggleReplayPlayback = useCallback(() => {
    cancelUpNext();
    togglePlay();
  }, [cancelUpNext, togglePlay]);
  const playNextNow = useCallback(() => {
    const target = upNextState?.target;
    if (!target) {
      return;
    }
    setUpNextState(null);
    navigateToSessionRef.current(target);
  }, [upNextState]);
  useEffect(() => {
    if (!upNextState) {
      return undefined;
    }
    if (upNextState.countdown <= 0) {
      const { target } = upNextState;
      setUpNextState(null);
      navigateToSessionRef.current(target);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setUpNextState(current => (current ? {
        ...current,
        countdown: current.countdown - 1
      } : null));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [upNextState]);
  useEffect(() => {
    let active = true;
    const loadReplay = async () => {
      loadedSessionIdRef.current = null;
      if (typeof warmupTimerRef.current === 'function') {
        warmupTimerRef.current();
        warmupTimerRef.current = null;
      }
      if (playerInstanceRef.current && typeof playerInstanceRef.current.$destroy === 'function') {
        playerInstanceRef.current.$destroy();
        playerInstanceRef.current = null;
      }

      setReplayReady(false);
      setReplayWarming(false);
      setLoading(true);
      setPayload(null);
      setUpNextState(null);
      setActiveInsightId(null);
      userToggledPlaybackRef.current = false;
      replayHasPlayedRef.current = false;
      isPlayingRef.current = false;
      resumeTimeRef.current = shareMomentOffsetMs ?? 0;
      resumePlayingRef.current = shareMomentOffsetMs !== null;
      setInsightsEntry({ offsetMs: 0 });
      try {
        const response = await getReplay(sessionId, sessionSlug);
        if (active) {
          loadedSessionIdRef.current = sessionId;
          setPayload(response || null);
        }
      } catch (error) {
        if (active) {
          loadedSessionIdRef.current = sessionId;
          setPayload(isReplayTooLargeError(error) ? { replayTooLarge: true } : null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadReplay();
    return () => {
      active = false;
      loadedSessionIdRef.current = null;
    };
  }, [sessionId, sessionSlug, shareMomentOffsetMs]);

  useEffect(() => {
    if (loading) {
      return;
    }

    replayPaneRef.current?.scrollTo(0, 0);
    insightsPaneRef.current?.scrollTo(0, 0);
  }, [loading, sessionId]);

  useEffect(() => {
    const mountNode = playerMountRef.current;
    const events = playerEvents;

    if (
      !mountNode
      || events.length === 0
      || playerInstanceRef.current
      || loadedSessionIdRef.current !== sessionId
    ) {
      return;
    }

    mountNode.innerHTML = '';
    setReplayWarming(true);


    const player = new RrwebPlayer({
      target: mountNode,
      props: {
        events,
        UNSAFE_replayCanvas: payload?.meta?.browser_info?.source === 'draw-mode' || !!getUrlParameter('replayCanvas'),
        useVirtualDom: false,
        autoPlay: false,
        skipInactive: skipInactivePreferenceRef.current,
        speedOption: PLAYBACK_SPEED_OPTIONS,
        ...(isAIReviewDashboardEmbed ? { maxScale: EMBEDDED_PLAYER_MAX_SCALE } : {}),
        tags: CUSTOM_EVENT_TAG_COLORS,
        mouseTail: {
          duration: 350,
          lineCap: 'round',
          lineWidth: 2,
          strokeStyle: '#ff6100'
        },
        ...getPlayerSize(
          mountNode,
          isEmbedded,
          isAIReviewDashboardEmbed,
          isEmbedded ? undefined : WORKSPACE_PLAYER_CONTROLLER_H
        )
      }
    });
    playerInstanceRef.current = player;
    // Keep rrweb paused while the replay and optional audio warm up. Ordinary
    // workspace entries start below once those resources are ready.
    try {
      player.pause?.();
      isPlayingRef.current = false;
    } catch (error) {
      /* noop: the transport can still control playback after initialization */
    }
    requestAnimationFrame(() => {
      if (
        playerInstanceRef.current === player
        && !autoplayRef.current
        && !userToggledPlaybackRef.current
      ) {
        pauseReplayPlayer(player);
        isPlayingRef.current = false;
      }
    });
    setReplayReady(true);

    // Returning from Page Insights resumes the same offset and play/pause
    // the reviewer left with, so a playing replay keeps playing.
    if (resumeTimeRef.current > 0 || resumePlayingRef.current) {
      try {
        const resumeOffsetMs = Math.min(
          replayDurationMs,
          Math.max(0, Number(resumeTimeRef.current) || 0)
        );
        if (resumeOffsetMs > 0) {
          player.goto(resumeOffsetMs, resumePlayingRef.current);
        }
        if (resumePlayingRef.current) {
          player.play?.();
          isPlayingRef.current = true;
        } else {
          player.pause?.();
          isPlayingRef.current = false;
        }
        userToggledPlaybackRef.current = true;
      } catch (error) {
        /* noop: fall back to the start of the replay */
      }
    }

    {
      // Finish warming while preserving the paused state.
      warmupTimerRef.current = whenWarm(() => {
        warmupTimerRef.current = null;
        setReplayWarming(false);
        if (
          !isEmbedded
          && autoplayRef.current
          && !userToggledPlaybackRef.current
          && viewModeRef.current !== HEATMAP_VIEW_HEATMAP
          && playerInstanceRef.current
          && typeof playerInstanceRef.current.play === 'function'
        ) {
          playerInstanceRef.current.play();
        }
      });
    }

    // Track play state so the Space-key shortcut can toggle play/pause.
    if (typeof playerInstanceRef.current.addEventListener === 'function') {
      playerInstanceRef.current.addEventListener('ui-update-player-state', event => {
        const statePayload = event?.payload ?? event?.detail?.payload ?? event?.detail;
        const playing = statePayload === 'playing';
        isPlayingRef.current = playing;
        if (playing) {
          replayHasPlayedRef.current = true;
        }
        if (playing && !autoplayRef.current && !userToggledPlaybackRef.current) {
          pauseReplayPlayer(playerInstanceRef.current);
          isPlayingRef.current = false;
          return;
        }
        if (playing && viewModeRef.current === HEATMAP_VIEW_HEATMAP) {
          pauseReplayPlayer(playerInstanceRef.current);
          isPlayingRef.current = false;
          return;
        }
        if (playing) {
          setActiveInsightId(null);
        }
      });
    }

    // Embedded review delegates completion to its parent. The full workspace
    // owns its own cancellable countdown to the next session in the same list.
    if (typeof playerInstanceRef.current.addEventListener === 'function') {
      playerInstanceRef.current.addEventListener('finish', () => {
        if (isEmbedded) {
          window.parent?.postMessage({
            type: 'behaviorlens:ended',
            sessionId: payload?.session_id || null
          }, window.location.origin);
          return;
        }
        const nextSession = recentSessionsRef.current.next;
        if ((replayHasPlayedRef.current || isPlayingRef.current) && nextSession) {
          replayHasPlayedRef.current = false;
          isPlayingRef.current = false;
          setUpNextState({
            countdown: REPLAY_UP_NEXT_COUNTDOWN_SECONDS,
            target: nextSession
          });
        }
      });
    }

    if (isAIReviewDashboardEmbed) {
      fitEmbeddedPlayerToMount(
        playerInstanceRef.current,
        mountNode,
        isEmbedded,
        isAIReviewDashboardEmbed
      );
      requestAnimationFrame(() => {
        fitEmbeddedPlayerToMount(
          playerInstanceRef.current,
          mountNode,
          isEmbedded,
          isAIReviewDashboardEmbed
        );
      });
    }
  }, [
    payload,
    playerEvents,
    isEmbedded,
    isAIReviewDashboardEmbed,
    playerMountEl,
    playerMountRevision,
    sessionId
  ]);
  // Re-fit the player when its container resizes (rrweb is built once); $set + triggerResize preserves playback and audio sync.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const mountNode = playerMountRef.current;
    if (!mountNode) {
      return undefined;
    }
    let lastW = 0;
    let lastH = 0;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const player = playerInstanceRef.current;
      if (!player) {
        return;
      }
      const { width, height } = getPlayerSize(
        mountNode,
        isEmbedded,
        isAIReviewDashboardEmbed,
        isEmbedded ? undefined : WORKSPACE_PLAYER_CONTROLLER_H
      );
      if (Math.abs(width - lastW) < 2 && Math.abs(height - lastH) < 2) {
        return;
      }
      lastW = width;
      lastH = height;
      if (isAIReviewDashboardEmbed) {
        fitEmbeddedPlayerToMount(player, mountNode, isEmbedded, isAIReviewDashboardEmbed);
        return;
      }
      try {
        if (typeof player.$set === 'function') {
          player.$set({ width, height });
        }
        if (typeof player.triggerResize === 'function') {
          player.triggerResize();
        }
      } catch (error) {
        /* noop */
      }
    };
    const observer = new ResizeObserver(() => {
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(apply);
    });
    observer.observe(mountNode);
    requestAnimationFrame(() => requestAnimationFrame(apply));
    return () => {
      observer.disconnect();
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [isAIReviewDashboardEmbed, isEmbedded, payload, playerMountEl]);


  useEffect(() => {
    return () => {
      if (typeof warmupTimerRef.current === 'function') {
        warmupTimerRef.current();
        warmupTimerRef.current = null;
      }
      if (playerInstanceRef.current && typeof playerInstanceRef.current.$destroy === 'function') {
        playerInstanceRef.current.$destroy();
      }
    };
  }, []);

  useEmbedReplayBridge({
    isEmbedded, payload, playerInstanceRef, togglePlay
  });

  const {
    categoryFilter,
    eventFilter,
    eventTypeCounts,
    setEventFilter,
    setCategoryFilter,
    filteredInsights,
    rageClickCount,
    frustration,
    activitySparklineOptions,
    showMouseMoves,
    setShowMouseMoves
  } = useSessionInsightsPanel(payload, sessionId, replayDurationMs);
  useEffect(() => {
    if (viewMode !== HEATMAP_VIEW_HEATMAP) {
      return;
    }
    selectInsightTab('timeline');
    setCategoryFilter(getHeatmapTimelineCategory(heatmapFilter));
  }, [heatmapFilter, selectInsightTab, setCategoryFilter, viewMode]);
  const currentInsightId = useCurrentInsightId(
    playerInstanceRef,
    replayReady,
    filteredInsights,
    Number(payload?.events?.[0]?.timestamp || 0),
    playerMountRevision
  );
  // Console and network capture is not implemented yet (Dev Tools shows that
  // honestly), and timeline comments come from Session Notes.
  const enrichment = EMPTY_ENRICHMENT;
  const handleInsightsPlayingChange = useCallback(playing => {
    const next = Boolean(playing);
    resumePlayingRef.current = next;
    isPlayingRef.current = next;
  }, [isPlayingRef]);
  const handleInsightsTimeChange = useCallback(offset => {
    if (Number.isFinite(offset)) {
      resumeTimeRef.current = Math.max(0, offset);
    }
  }, []);
  const handleInsightsPlayInSessionReplay = useCallback(offset => {
    const nextOffset = Number.isFinite(offset)
      ? Math.max(0, offset)
      : (Number(resumeTimeRef.current) || 0);
    resumeTimeRef.current = nextOffset;
    resumePlayingRef.current = true;
    isPlayingRef.current = true;
    handleWorkspaceModeChange(WORKSPACE_MODE_SESSION_REPLAY);
  }, [handleWorkspaceModeChange, isPlayingRef]);

  const blockingState = renderBlockingState({ listReturnPath, loading, payload });
  if (blockingState) {
    return blockingState;
  }

  const { meta = {}, stop = {} } = payload;
  const { browser_info: { viewport = {} } = {} } = meta;
  const firstEventTimestamp = Number(payload.events?.[0]?.timestamp || 0);
  const replayStageProps = {
    activeInsightId,
    assignPlayerMount,
    handleViewModeChange,
    heatmapFilter,
    isAIReviewDashboardEmbed,
    isEmbedded,
    payload,
    playerMountRef,
    replayWarming,
    setHeatmapFilter,
    viewMode,
    viewport
  };
  const replayPlayerProps = {
    // Keep this large page below the repository's max-lines guard.
    // eslint-disable-next-line object-property-newline
    activitySparklineOptions, devToolsOpen, enrichment, getReplayCurrentTime,
    canFullscreen: !isWorkspaceOverlay,
    isEmbedded,
    noteShareOpenRequest,
    onFullscreenChange: refitReplayLayout,
    onNoteSaved: openSessionNotesAfterNoteSaved,
    onOpenNote: openNoteShare,
    onSelectNote: handleSelectTimelineNote,
    onToggleDevTools: toggleDevTools,

    isPlayingRef,
    onSeekActivity: replayReady ? seekReplay : undefined,
    payload,
    playerInstanceRef,
    playerMountRevision,
    replayDurationMs,
    replayReady,
    replayStageProps,
    seekReplay,
    sessionId,
    showAgentUserActivityBar,
    skipInactivePreferenceRef,
    stageRef: workspaceFullscreenRef,
    title: meta.page_title || null,
    togglePlay: toggleReplayPlayback,
    url: meta.url || null,
    warming: replayWarming
  };
  replayPlayerProps.upNext = upNextState ? {
    countdown: upNextState.countdown,
    onCancel: cancelUpNext,
    onPlayNow: playNextNow,
    session: upNextState.target.session,
    sessionId: upNextState.target.sessionId
  } : null;
  const sessionEventRailProps = {
    currentInsightId,
    eventFilter,
    filteredInsights,
    firstEventTimestamp,
    meta,
    onHoverEvent: viewMode === HEATMAP_VIEW_HEATMAP ? jumpToEvent : undefined,
    onSeekToEvent: jumpToEvent,
    payload,
    seekReplay,
    selectedInsightId: activeInsightId,
    sessionId,
    setEventFilter,
    stop,
    streamRef: insightsPaneRef,
    viewport
  };

  const ReviewMetadataOwner = isAIReviewDashboardEmbed
    ? React.Fragment
    : SessionReviewMetadataFeature;

  if (!isEmbedded) {
    return (
      <WorkspaceLayout data-testid="behaviorlens-workspace">
        <PlayerControllerStyles $workspace $aiReviewDashboardEmbed={false} />
        <SessionReviewMetadataFeature key={sessionId} sessionId={sessionId}>
          <WorkspaceShell>
            <WorkspaceTopRow $overlay={isWorkspaceOverlay}>
              <WorkspaceTopLeft>
                {!isWorkspaceOverlay && (
                  <WorkspaceBackLink as={Link} to={listReturnPath}>
                    <IconAngleLeft aria-hidden="true" />
                    Back
                  </WorkspaceBackLink>
                )}
              </WorkspaceTopLeft>
              <WorkspaceModeTabs activeMode={workspaceMode} onModeChange={handleWorkspaceModeChange} />
              <WorkspaceTopRight>
                {isWorkspaceOverlay ? (
                  <WorkspaceOverlayClose
                    type="button"
                    aria-label="Close session workspace"
                    data-testid="behaviorlens-workspace-overlay-close"
                    onClick={onWorkspaceOverlayClose}
                  >
                    <IconXmark aria-hidden="true" />
                  </WorkspaceOverlayClose>
                ) : (
                  <WorkspaceSessionActions
                    onNavigateSession={navigateToSession}
                    recentSessions={recentSessions}
                    sessionId={sessionId}
                  />
                )}
              </WorkspaceTopRight>
            </WorkspaceTopRow>
            {isWorkspaceOverlay && workspaceOverlayBanner}
            {workspaceMode === WORKSPACE_MODE_PAGE_INSIGHTS ? (
              <PageInsightsWorkspace
                {...{
                  active: workspaceMode === WORKSPACE_MODE_PAGE_INSIGHTS,
                  devToolsOpen,
                  enrichment,
                  initialMode: rememberedInsightsModeRef.current,
                  meta,
                  momentOffsetMs: insightsEntry.offsetMs,
                  payload,
                  replayDurationMs,
                  skipInactivePreferenceRef,
                  viewport
                }}
                onPlayingChange={handleInsightsPlayingChange}
                onModeChange={handleInsightsModeChange}
                onPlayInSessionReplay={handleInsightsPlayInSessionReplay}
                onSelectNote={handleSelectTimelineNote}
                onTimeChange={handleInsightsTimeChange}
                onToggleDevTools={toggleDevTools}
              />
            ) : (
              <WorkspaceBody
                key={sessionId}
                ref={workspaceFullscreenRef}
                style={{ '--behaviorlens-workspace-rail-width': `${workspaceRailWidth}px` }}
                data-testid="behaviorlens-fullscreen-workspace"
              >
                <StageColumn ref={replayPaneRef} data-testid="session-replay-column">
                  <SessionReplayPlayerStack {...replayPlayerProps} />
                </StageColumn>
                <WorkspaceRailSplitter
                  containerRef={workspaceFullscreenRef}
                  onWidthChange={setWorkspaceRailWidth}
                  width={workspaceRailWidth}
                />
                <WorkspaceRail data-testid="session-insights-column">
                  {workspaceMode === WORKSPACE_MODE_SESSION_NOTES ? (
                    <SessionNotesRail
                      noteReveal={noteReveal}
                      onAddNote={openNoteShareFromRail}
                      onReplyComposerOpen={pauseReplayForNote}
                      onScrollToReplay={scrollToReplayTop}
                      onSeekReplay={seekReplay}
                      replayDurationMs={replayDurationMs}
                      replayReady={replayReady}
                    />
                  ) : <SessionEventRail {...sessionEventRailProps} />}
                </WorkspaceRail>
              </WorkspaceBody>
            )}
          </WorkspaceShell>
        </SessionReviewMetadataFeature>
      </WorkspaceLayout>
    );
  }

  return (
    <Layout
      $embedded={isEmbedded}
      className={isAIReviewDashboardEmbed ? 'behaviorlens-ai-review-embed' : undefined}
    >
      <PlayerControllerStyles $aiReviewDashboardEmbed={isAIReviewDashboardEmbed} />

      <ReviewMetadataOwner {...(isAIReviewDashboardEmbed ? {} : { sessionId })}>
        <Body $embedded={isEmbedded} $aiReviewDashboardEmbed={isAIReviewDashboardEmbed}>
          <ReplayColumn
            ref={replayPaneRef}
            $embedded={isEmbedded}
            data-testid="session-replay-column"
          >
            <ReplayPane $embedded={isEmbedded} $flush={isAIReviewDashboardEmbed}>
              <ReplayStageView
                activeInsightId={activeInsightId}
                assignPlayerMount={assignPlayerMount}
                handleViewModeChange={handleViewModeChange}
                heatmapFilter={heatmapFilter}
                isAIReviewDashboardEmbed={isAIReviewDashboardEmbed}
                isEmbedded={isEmbedded}
                onTogglePlayback={togglePlay}
                payload={payload}
                playerMountRef={playerMountRef}
                replayWarming={replayWarming}
                setHeatmapFilter={setHeatmapFilter}
                showBookmarkOverlay
                viewMode={viewMode}
                viewport={viewport}
              />
            </ReplayPane>
          </ReplayColumn>

          {!isAIReviewDashboardEmbed && (
            <InsightsPane
              $embedded={isEmbedded}
              data-testid="session-insights-column"
            >
              <InsightTabs>
                <SessionInsightTabList
                  activeInsightTab={activeInsightTab}
                  insightTabs={insightTabs}
                  selectInsightTab={selectInsightTab}
                />
              </InsightTabs>
              <InsightTabPanels
                ref={insightsPaneRef}
                $embedded={isEmbedded}
                data-testid="session-insights-scroll"
              >
                <SessionDetailRailPanels
                  activeInsightId={activeInsightId}
                  firstEventTimestamp={firstEventTimestamp}
                  activeInsightTab={activeInsightTab}
                  activitySparklineOptions={activitySparklineOptions}
                  categoryFilter={categoryFilter}
                  eventFilter={eventFilter}
                  filteredInsights={filteredInsights}
                  eventTypeCounts={eventTypeCounts}
                  frustration={frustration}
                  getInsightTabId={getInsightTabId}
                  getReplayCurrentTime={getReplayCurrentTime}
                  isEmbedded={isEmbedded}
                  jumpToEvent={jumpToEvent}
                  meta={meta}
                  onScrollToReplay={scrollToReplayTop}
                  onSelectInsightTab={selectInsightTab}
                  pauseReplayForNote={pauseReplayForNote}
                  payload={payload}
                  rageClickCount={rageClickCount}
                  replayDurationMs={replayDurationMs}
                  replayReady={replayReady}
                  seekReplay={seekReplay}
                  sessionId={sessionId}
                  setCategoryFilter={setCategoryFilter}
                  setEventFilter={setEventFilter}
                  setShowMouseMoves={setShowMouseMoves}
                  showMouseMoves={showMouseMoves}
                  stop={stop}
                  viewMode={viewMode}
                />
              </InsightTabPanels>
            </InsightsPane>
          )}
        </Body>
      </ReviewMetadataOwner>
    </Layout>
  );
};

SessionDetailPage.propTypes = {
  locationOverride: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
    state: PropTypes.any
  }),
  onWorkspaceOverlayClose: PropTypes.func,
  sessionIdOverride: PropTypes.string,
  workspaceOverlayBanner: PropTypes.node
};

export default SessionDetailPage;
