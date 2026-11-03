import React, {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import { flushSync } from 'react-dom';
import { StageColumn, WorkspaceBody } from '../workspace/ScBehaviorLensWorkspace';
import {
  InsightsRail
} from './ScBehaviorLensPageInsights';
import ReplayContextChrome from '../workspace/ReplayContextChrome';
import PageInsightsStage from './PageInsightsStage';
import PageInsightsPlaybackStage from './PageInsightsPlaybackStage';
import WorkspaceRailSplitter, { useWorkspaceRailWidth } from '../workspace/WorkspaceRailSplitter';
import ClickMapOverlay from './ClickMapOverlay';
import ScrollMapOverlay from './ScrollMapOverlay';
import InspectModeOverlay from './InspectModeOverlay';
import PageInsightsRail from './PageInsightsRail';
import {
  INSIGHTS_MODE_CLICK_MAPS,
  INSIGHTS_MODE_INSPECT,
  INSIGHTS_MODE_SCROLL_MAPS
} from './InsightsModeTabs';
import { HEATMAP_FILTER_ALL } from './behaviorLensHeatmap';
import { usePageInsightsClickData } from './usePageInsightsClickData';
import { derivePageViewScrollMap } from './behaviorLensScrollMap';
import { buildReplayNodeIndex } from '../shared/behaviorLensElementLabels';
import {
  buildPageViewInspectCatalog,
  getPageViewClickCountsByNode
} from './behaviorLensInspect';
import {
  derivePageViews,
  findPageViewAtOffset,
  findPageViewById,
  selectDefaultPageView
} from './behaviorLensPageViews';
import { getReplayFirstTimestamp } from './behaviorLensPageInsightsScope';
import { useInspectTargets } from './useInspectTargets';
import { buildNodePresence, selectBackdropFrame } from './behaviorLensReplayFrames';

export const PAGE_INSIGHTS_RAIL_SELECTOR = '[data-testid="behaviorlens-insights-rail"]';

const EMPTY_ANALYSIS = {
  densityRange: null,
  elementAnchoredClicks: 0,
  hotspots: [],
  totalClicks: 0,
  totalRageClicks: 0,
  unmappedClicks: 0
};

const useInsightsPlayback = ({ active, entryOffset }) => {
  const playerRef = useRef(null);
  const [target, setTarget] = useState(() => ({
    offset: Math.max(0, Number(entryOffset) || 0),
    revision: 0,
    shouldPlay: false
  }));
  const wasActiveRef = useRef(false);
  const setPlayer = useCallback(player => { playerRef.current = player; }, []);
  const pause = useCallback(() => {
    try { playerRef.current?.pause?.(); } catch (error) { /* noop */ }
  }, []);
  const getCurrentTime = useCallback(() => {
    try {
      const current = playerRef.current?.getReplayer?.()?.getCurrentTime?.();
      return Number.isFinite(current) ? Math.max(0, current) : null;
    } catch (error) {
      return null;
    }
  }, []);
  const seek = useCallback(offset => setTarget(current => ({
    offset: Math.max(0, Number(offset) || 0),
    revision: current.revision + 1,
    shouldPlay: false
  })), []);
  useEffect(() => {
    if (active && !wasActiveRef.current) seek(entryOffset);
    wasActiveRef.current = active;
  }, [active, entryOffset, seek]);
  return {
    getCurrentTime, pause, seek, setPlayer, target
  };
};

const useReplayEventScope = payload => {
  const events = useMemo(
    () => (Array.isArray(payload?.events) ? payload.events : []),
    [payload]
  );
  const firstTimestamp = useMemo(() => getReplayFirstTimestamp(events), [events]);
  return { events, firstTimestamp };
};

// Page Insights workspace: the analysis surface beside Session Replay.
//
// Scope starts at a page view. Page totals and the Inspect catalog stay fixed
// for that view; the seekable, paused Click/Inspect surface resolves those facts
// against the DOM that actually exists at the current replay time.
const PageInsightsWorkspace = ({
  active = true,
  devToolsOpen = false,
  enrichment = null,
  initialMode = INSIGHTS_MODE_CLICK_MAPS,
  meta,
  onModeChange,
  momentOffsetMs = 0,
  onPlayInSessionReplay,
  onPlayingChange,
  onSelectNote,
  onTimeChange,
  onToggleDevTools,
  payload,
  replayDurationMs = 0,
  skipInactivePreferenceRef = null,
  viewport = null
}) => {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [scrollStageVisible, setScrollStageVisible] = useState(
    initialMode === INSIGHTS_MODE_SCROLL_MAPS
  );
  const scrollStageFrameRef = useRef(null);
  const [filter, setFilter] = useState(HEATMAP_FILTER_ALL);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [clickAnalysis, setClickAnalysis] = useState(EMPTY_ANALYSIS);
  const [documentGeometry, setDocumentGeometry] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedPageViewId, setSelectedPageViewId] = useState(null);
  const [selectorMode, setSelectorMode] = useState('optimized');
  const [probeRatio, setProbeRatio] = useState(0.5);
  // Inspect Mode reveals every inspectable element instead of preselecting one.
  const inspect = useInspectTargets();
  const workspaceRef = useRef(null);
  // The same draggable divider Session Replay uses, sharing its stored width so
  // the rail does not jump when the reviewer switches workspace mode.
  const [railWidth, setRailWidth] = useWorkspaceRailWidth();

  const { events, firstTimestamp } = useReplayEventScope(payload);
  const effectiveReplayDurationMs = useMemo(() => {
    if (Number(replayDurationMs) > 0) {
      return Number(replayDurationMs);
    }
    return Math.max(0, Number(events[events.length - 1]?.timestamp || 0) - firstTimestamp);
  }, [events, firstTimestamp, replayDurationMs]);
  const pageViews = useMemo(
    () => derivePageViews(events, { fallbackUrl: meta?.url || null }),
    [events, meta]
  );
  // The reviewer's replay position decides which page view opens. Rail
  // totals and the click list stay that whole view; the Click Map overlay
  // follows the playhead so a future click is not painted as if it happened.
  const pageView = useMemo(() => (
    findPageViewById(pageViews, selectedPageViewId)
    || findPageViewAtOffset(pageViews, momentOffsetMs)
    || selectDefaultPageView(pageViews)
  ), [momentOffsetMs, pageViews, selectedPageViewId]);

  const presence = useMemo(() => buildNodePresence(events), [events]);
  const backdropFrame = useMemo(() => selectBackdropFrame({
    events, firstTimestamp, pageView, presence
  }), [events, firstTimestamp, pageView, presence]);
  // Entering before the page view has rendered (for example at 0:00) would
  // show its empty first frame; start at its settled frame instead.
  const entryOffsetMs = useMemo(() => {
    const entryPageView = findPageViewAtOffset(pageViews, momentOffsetMs);
    return Math.max(Number(momentOffsetMs) || 0, entryPageView?.seekOffset ?? 0);
  }, [momentOffsetMs, pageViews]);
  const playback = useInsightsPlayback({ active, entryOffset: entryOffsetMs });
  const handlePlayingChange = useCallback(playing => {
    onPlayingChange?.(playing);
  }, [onPlayingChange]);

  const scrollMap = useMemo(() => derivePageViewScrollMap({
    documentHeight: documentGeometry?.height, events, pageView, recordedViewport: viewport
  }), [documentGeometry, events, pageView, viewport]);

  const nodeIndex = useMemo(() => buildReplayNodeIndex(events), [events]);
  const inspectCatalog = useMemo(() => buildPageViewInspectCatalog({
    events, firstTimestamp, nodeIndex, pageView, presence
  }), [events, firstTimestamp, nodeIndex, pageView, presence]);
  const clickCountsByNode = useMemo(
    () => getPageViewClickCountsByNode(events, pageView),
    [events, pageView]
  );
  const { clickList } = usePageInsightsClickData({
    analysis: clickAnalysis,
    events,
    filter,
    firstTimestamp,
    nodeIndex,
    pageView,
    recordedViewport: viewport
  });
  const selectElement = useCallback(element => {
    playback.pause();
    setSelectedElement(element);
  }, [playback.pause]);
  const handleHotspotsChange = useCallback(analysis => setClickAnalysis(analysis), []);
  const handlePageViewChange = useCallback(id => {
    const nextPageView = findPageViewById(pageViews, id);
    setSelectedPageViewId(id);
    setSelectedElement(null);
    setSelectedHotspotId(null);
    setDocumentGeometry(null);
    setProbeRatio(0.5);
    inspect.reset();
    if (nextPageView) playback.seek(nextPageView.seekOffset);
  }, [inspect.reset, pageViews, playback.seek]);
  const handleInspectTargetSelect = useCallback(target => {
    playback.seek(target.focusOffset);
    inspect.selectTarget(target.nodeId);
  }, [inspect.selectTarget, playback.seek]);
  const handlePlaybackTimeChange = useCallback(offsetMs => {
    onTimeChange?.(offsetMs);
    const currentPageView = findPageViewAtOffset(pageViews, offsetMs);
    if (currentPageView && currentPageView.id !== pageView?.id) {
      setSelectedPageViewId(currentPageView.id);
      setSelectedElement(null);
      setSelectedHotspotId(null);
      inspect.reset();
    }
  }, [inspect.reset, onTimeChange, pageView?.id, pageViews]);
  const handleModeChange = useCallback(nextMode => {
    const enteringScroll = nextMode === INSIGHTS_MODE_SCROLL_MAPS;
    if (scrollStageFrameRef.current != null
      && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(scrollStageFrameRef.current);
      scrollStageFrameRef.current = null;
    }
    // Paint the locked (or unlocked) transport and the mode tab before the
    // Scroll Maps surface swap, which is the expensive layout. Magnet's
    // duration-300 fade used to start only after that swap finished.
    flushSync(() => {
      setActiveMode(nextMode);
      if (!enteringScroll) {
        setScrollStageVisible(false);
      }
    });
    onModeChange?.(nextMode);
    if (!enteringScroll) {
      return;
    }
    if (devToolsOpen) {
      onToggleDevTools();
    }
    const showScrollStage = () => {
      scrollStageFrameRef.current = null;
      setScrollStageVisible(true);
    };
    if (typeof requestAnimationFrame === 'function') {
      scrollStageFrameRef.current = requestAnimationFrame(showScrollStage);
      return;
    }
    showScrollStage();
  }, [devToolsOpen, onModeChange, onToggleDevTools]);

  useEffect(() => () => {
    if (scrollStageFrameRef.current != null
      && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(scrollStageFrameRef.current);
    }
  }, []);

  useEffect(() => {
    setSelectedPageViewId(null);
    setSelectedElement(null);
    setDocumentGeometry(null);
    setProbeRatio(0.5);
    inspect.reset();
    playback.seek(entryOffsetMs);
  }, [entryOffsetMs, inspect.reset, payload.session_id, playback.seek]);

  // Drop a selection the current filter, frame or page view no longer contains.
  useEffect(() => {
    setSelectedHotspotId(current => {
      if (current && clickAnalysis.hotspots.some(hotspot => hotspot.id === current)) {
        return current;
      }
      return null;
    });
  }, [clickAnalysis]);

  // Click and Inspect share one paused, seekable rrweb surface; Scroll owns a separate
  // full-page surface. Both stay mounted while only their overlays/visibility
  // change, so mode switching never reconstructs a half-built iframe.

  const renderPlaybackOverlay = stage => {
    if (activeMode === INSIGHTS_MODE_INSPECT) {
      return (
        <InspectModeOverlay
          hoveredNodeId={inspect.hoveredNodeId}
          nodeIndex={nodeIndex}
          onRequestHandled={inspect.clearRequest}
          onSelect={selectElement}
          onTargetsChange={inspect.handleTargetsChange}
          requestedNodeId={inspect.requestedNodeId}
          selectedElement={selectedElement}
          showTargets={inspect.showTargets}
          stage={stage}
        />
      );
    }

    return (
      <ClickMapOverlay
        documentGeometry={stage.documentGeometry}
        events={events}
        filter={filter}
        nodeIndex={nodeIndex}
        onHotspotsChange={handleHotspotsChange}
        onSelectHotspot={setSelectedHotspotId}
        pageView={pageView}
        recordedViewport={viewport}
        selectedHotspotId={selectedHotspotId}
        stage={stage}
      />
    );
  };

  return (
    <WorkspaceBody
      ref={workspaceRef}
      aria-hidden={!active}
      data-testid="behaviorlens-page-insights"
      style={{
        '--behaviorlens-workspace-rail-width': `${railWidth}px`,
        ...(active ? {} : { display: 'none' })
      }}
    >
      <StageColumn data-testid="behaviorlens-insights-stage-column">
        <ReplayContextChrome
          devToolsOpen={devToolsOpen && activeMode !== INSIGHTS_MODE_SCROLL_MAPS}
          disabled={activeMode === INSIGHTS_MODE_SCROLL_MAPS}
          onToggleDevTools={onToggleDevTools}
          title={meta.page_title}
          url={pageView?.href || meta.url}
        />
        <PageInsightsPlaybackStage
          active={active}
          activeMode={activeMode}
          clickAnalysis={clickAnalysis}
          comments={enrichment?.timeline?.comments}
          devToolsOpen={devToolsOpen && activeMode !== INSIGHTS_MODE_SCROLL_MAPS}
          events={events}
          fullscreenRef={workspaceRef}
          onPlayerChange={playback.setPlayer}
          onPlayInSessionReplay={onPlayInSessionReplay}
          onPlayingChange={handlePlayingChange}
          onSelectNote={onSelectNote}
          onSeek={playback.seek}
          onTimeChange={handlePlaybackTimeChange}
          recordedViewport={viewport}
          replayDurationMs={effectiveReplayDurationMs}
          scrollStageVisible={scrollStageVisible}
          sessionId={payload.session_id}
          skipInactivePreferenceRef={skipInactivePreferenceRef}
          targetOffset={playback.target.offset}
          targetRevision={playback.target.revision}
          targetShouldPlay={playback.target.shouldPlay}
          telemetry={enrichment?.telemetry}
          url={pageView?.href || meta.url || null}
          scrollStage={(
            <PageInsightsStage
              activeMode={INSIGHTS_MODE_SCROLL_MAPS}
              backdropOffset={backdropFrame.offset}
              events={events}
              layoutActive={scrollStageVisible}
              muted
              onGeometryChange={setDocumentGeometry}
              pageView={pageView}
              recordedViewport={viewport}
              replayDurationMs={effectiveReplayDurationMs}
              testId="behaviorlens-insights-scroll-stage"
            >
              {stage => (
                <ScrollMapOverlay
                  onProbeChange={setProbeRatio}
                  probeRatio={probeRatio}
                  scrollMap={scrollMap}
                  stage={stage}
                />
              )}
            </PageInsightsStage>
          )}
        >
          {renderPlaybackOverlay}
        </PageInsightsPlaybackStage>
      </StageColumn>
      <WorkspaceRailSplitter
        containerRef={workspaceRef}
        label="page and insights panel"
        onWidthChange={setRailWidth}
        railSelector={PAGE_INSIGHTS_RAIL_SELECTOR}
        width={railWidth}
      />
      <InsightsRail data-testid="behaviorlens-insights-rail">
        <PageInsightsRail
          activeMode={activeMode}
          clickAnalysis={clickAnalysis}
          clickList={clickList}
          filter={filter}
          onFilterChange={setFilter}
          clickCountsByNode={clickCountsByNode}
          hoveredTargetNodeId={inspect.hoveredNodeId}
          inspectTargets={inspectCatalog}
          onHoverTarget={inspect.setHoveredNodeId}
          onModeChange={handleModeChange}
          onPageViewChange={handlePageViewChange}
          onSelectHotspot={setSelectedHotspotId}
          onSelectTarget={handleInspectTargetSelect}
          onSelectorModeChange={setSelectorMode}
          onSeek={playback.seek}
          pageView={pageView}
          pageViews={pageViews}
          scrollMap={scrollMap}
          selectedElement={selectedElement}
          selectedHotspot={clickAnalysis.hotspots
            .find(hotspot => hotspot.id === selectedHotspotId) || null}
          selectorMode={selectorMode}
        />
      </InsightsRail>
    </WorkspaceBody>
  );
};

PageInsightsWorkspace.propTypes = {
  active: PropTypes.bool,
  devToolsOpen: PropTypes.bool,
  enrichment: PropTypes.object,
  initialMode: PropTypes.oneOf([
    INSIGHTS_MODE_CLICK_MAPS,
    INSIGHTS_MODE_SCROLL_MAPS,
    INSIGHTS_MODE_INSPECT
  ]),
  meta: PropTypes.object.isRequired,
  // Exact replay offset at which Page Insights opens. Page Insights stays
  // paused; its Play button hands this moment back to Session Replay.
  momentOffsetMs: PropTypes.number,
  onPlayingChange: PropTypes.func,
  onSelectNote: PropTypes.func,
  onModeChange: PropTypes.func,
  onPlayInSessionReplay: PropTypes.func,
  onTimeChange: PropTypes.func,
  onToggleDevTools: PropTypes.func.isRequired,
  payload: PropTypes.object.isRequired,
  replayDurationMs: PropTypes.number,
  skipInactivePreferenceRef: PropTypes.shape({ current: PropTypes.bool }),
  viewport: PropTypes.object
};

export default PageInsightsWorkspace;
