import React, {
  Component, useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import {
  Button, SegmentedControl, Toggle
} from '../../ui';
import {
  ReplayStage,
  ReplayViewBar,
  ReplayViewFilter,
  ReplayViewToggle
} from './ScBehaviorLensDashboard';
import {
  HeatmapActiveClick,
  HeatmapCanvas,
  HeatmapLegend,
  HeatmapLegendLabel,
  HeatmapLegendScale,
  HeatmapLegendScaleGroup,
  HeatmapOpacityControl,
  HeatmapOpacityInput,
  HeatmapOpacityLabel,
  HeatmapOverlay,
  HeatmapStatus
} from './ScBehaviorLensHeatmap';
import {
  DEFAULT_HEATMAP_OPACITY,
  drawClickHeatmap,
  extractSessionHeatmapPoints,
  findHeatmapPointByInsightId,
  formatClickCount,
  getHeatmapDensityRange,
  getHeatmapDevicePixelRatio,
  getHeatmapOverlayPoint,
  getHeatmapStatus,
  HEATMAP_FILTER_ALL,
  HEATMAP_FILTER_RAGE,
  HEATMAP_VIEW_HEATMAP,
  HEATMAP_VIEW_REPLAY,
  observeHeatmapLayout,
  pauseReplayPlayer
} from './behaviorLensHeatmap';

const FILTER_OPTIONS = [
  { id: 'behaviorlens-heatmap-filter-all', value: HEATMAP_FILTER_ALL, text: 'All Clicks' },
  { id: 'behaviorlens-heatmap-filter-rage', value: HEATMAP_FILTER_RAGE, text: 'Rage Clicks' }
];

const SessionHeatmapLegend = ({
  densityRange,
  onOpacityChange,
  opacity
}) => {
  if (!densityRange) {
    return null;
  }

  const { maximumClickCount, minimumClickCount } = densityRange;
  const maximumLabel = formatClickCount(maximumClickCount);
  const minimumLabel = formatClickCount(minimumClickCount);
  const opacityPercentage = Math.round(opacity * 100);
  return (
    <HeatmapLegend data-testid="session-heatmap-legend">
      <HeatmapLegendScaleGroup
        role="img"
        aria-label={`Heatmap density ranges from most popular, ${maximumLabel}, to least popular, ${minimumLabel}.`}
      >
        <HeatmapLegendLabel>{`Most popular (${maximumLabel})`}</HeatmapLegendLabel>
        <HeatmapLegendScale
          aria-hidden="true"
          data-testid="session-heatmap-legend-gradient"
          data-start-color="#ef4444"
          data-end-color="#22c55e"
        />
        <HeatmapLegendLabel>{`Least popular (${minimumLabel})`}</HeatmapLegendLabel>
      </HeatmapLegendScaleGroup>
      <HeatmapOpacityControl>
        <HeatmapOpacityLabel htmlFor="behaviorlens-heatmap-opacity">
          {`Opacity ${opacityPercentage}%`}
        </HeatmapOpacityLabel>
        <HeatmapOpacityInput
          id="behaviorlens-heatmap-opacity"
          type="range"
          min="0.2"
          max="1"
          step="0.05"
          value={opacity}
          aria-label="Heatmap opacity"
          aria-valuetext={`${opacityPercentage}%`}
          onChange={onOpacityChange}
        />
      </HeatmapOpacityControl>
    </HeatmapLegend>
  );
};

SessionHeatmapLegend.propTypes = {
  densityRange: PropTypes.shape({
    maximumClickCount: PropTypes.number.isRequired,
    minimumClickCount: PropTypes.number.isRequired
  }),
  onOpacityChange: PropTypes.func.isRequired,
  opacity: PropTypes.number.isRequired
};

class HeatmapOverlayErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Keep the replay usable; do not surface the exception.
  }

  render() {
    const { hasError } = this.state;
    const { children, onReturnToReplay } = this.props;
    if (hasError) {
      return (
        <HeatmapOverlay
          $left={0}
          $top={0}
          $width={0}
          $height={0}
          $fill
          data-testid="session-heatmap-overlay"
        >
          <HeatmapStatus role="status">
            Heatmap could not be rendered.
            <Button
              size="small"
              variant="outline"
              colorStyle="secondary"
              onClick={onReturnToReplay}
            >
              View Replay
            </Button>
          </HeatmapStatus>
        </HeatmapOverlay>
      );
    }
    return children;
  }
}

HeatmapOverlayErrorBoundary.propTypes = {
  children: PropTypes.node,
  onReturnToReplay: PropTypes.func.isRequired
};

const SessionHeatmapLayer = ({
  densityRange,
  highlightedInsightId,
  mountRef,
  onOpacityChange,
  onReturnToReplay,
  opacity,
  points,
  stageRef,
  status
}) => {
  const canvasRef = useRef(null);
  const [overlayBox, setOverlayBox] = useState(null);
  const [devicePixelRatio, setDevicePixelRatio] = useState(getHeatmapDevicePixelRatio);
  const [drawFailed, setDrawFailed] = useState(false);
  const activeClick = useMemo(() => {
    const point = findHeatmapPointByInsightId(points, highlightedInsightId);
    return getHeatmapOverlayPoint(point, overlayBox);
  }, [highlightedInsightId, overlayBox, points]);

  useEffect(() => {
    return observeHeatmapLayout({
      mountNode: mountRef.current,
      stageNode: stageRef.current,
      onBoxChange: box => setOverlayBox(box)
    });
  }, [mountRef, stageRef, status.kind]);

  useEffect(() => {
    const syncDpr = () => setDevicePixelRatio(getHeatmapDevicePixelRatio());
    syncDpr();
    window.addEventListener('resize', syncDpr);
    return () => window.removeEventListener('resize', syncDpr);
  }, []);

  useEffect(() => {
    if (status.kind !== 'ready' || !overlayBox || !canvasRef.current) {
      return;
    }
    try {
      const { maximumClickCount, minimumClickCount } = densityRange;
      drawClickHeatmap(canvasRef.current, status.points, {
        width: overlayBox.width,
        height: overlayBox.height,
        devicePixelRatio,
        minimumClickCount,
        maximumClickCount
      });
      setDrawFailed(false);
    } catch (error) {
      setDrawFailed(true);
    }
  }, [densityRange, devicePixelRatio, overlayBox, status.kind, status.points]);

  if (!overlayBox) {
    return null;
  }

  return (
    <HeatmapOverlay
      data-testid="session-heatmap-overlay"
      data-left={overlayBox.left}
      data-top={overlayBox.top}
      data-width={overlayBox.width}
      data-height={overlayBox.height}
      $left={overlayBox.left}
      $top={overlayBox.top}
      $width={overlayBox.width}
      $height={overlayBox.height}
    >
      {status.kind === 'ready' && !drawFailed ? (
        <>
          <HeatmapCanvas
            ref={canvasRef}
            $opacity={opacity}
            aria-hidden="true"
            data-opacity={opacity}
            data-testid="session-heatmap-canvas"
          />
          <SessionHeatmapLegend
            densityRange={densityRange}
            onOpacityChange={onOpacityChange}
            opacity={opacity}
          />
          {activeClick && (
            <HeatmapActiveClick
              aria-hidden="true"
              data-testid="session-heatmap-active-click"
              data-left={activeClick.left}
              data-top={activeClick.top}
              $left={activeClick.left}
              $top={activeClick.top}
            />
          )}
        </>
      ) : (
        <HeatmapStatus role="status">
          {drawFailed ? 'Heatmap could not be rendered.' : (status.message || 'Heatmap could not be rendered.')}
          <Button
            size="small"
            variant="outline"
            colorStyle="secondary"
            onClick={onReturnToReplay}
          >
            View Replay
          </Button>
        </HeatmapStatus>
      )}
    </HeatmapOverlay>
  );
};

SessionHeatmapLayer.propTypes = {
  densityRange: PropTypes.shape({
    maximumClickCount: PropTypes.number.isRequired,
    minimumClickCount: PropTypes.number.isRequired
  }),
  highlightedInsightId: PropTypes.string,
  mountRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  onOpacityChange: PropTypes.func.isRequired,
  onReturnToReplay: PropTypes.func.isRequired,
  opacity: PropTypes.number.isRequired,
  points: PropTypes.array,
  stageRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  status: PropTypes.shape({
    kind: PropTypes.string.isRequired,
    message: PropTypes.string,
    points: PropTypes.array
  }).isRequired
};

const SessionHeatmap = ({
  children,
  embedded,
  events,
  filter,
  hideToolbar,
  highlightedInsightId,
  mode,
  onFilterChange,
  onModeChange,
  playerMountRef,
  recordedViewport
}) => {
  const stageRef = useRef(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState(DEFAULT_HEATMAP_OPACITY);
  const points = useMemo(
    () => extractSessionHeatmapPoints(events, recordedViewport),
    [events, recordedViewport]
  );
  const allClicksStatus = useMemo(
    () => getHeatmapStatus(points, HEATMAP_FILTER_ALL),
    [points]
  );
  const status = useMemo(() => getHeatmapStatus(points, filter), [filter, points]);
  const densityRange = useMemo(
    () => (allClicksStatus.kind === 'ready'
      ? getHeatmapDensityRange(allClicksStatus.points)
      : null),
    [allClicksStatus]
  );
  const isHeatmap = mode === HEATMAP_VIEW_HEATMAP;

  const returnToReplay = useCallback(() => {
    onModeChange(HEATMAP_VIEW_REPLAY);
  }, [onModeChange]);

  const handleHeatmapToggle = event => {
    onModeChange(event.target.checked ? HEATMAP_VIEW_HEATMAP : HEATMAP_VIEW_REPLAY);
  };
  const handleOpacityChange = event => {
    setHeatmapOpacity(Number(event.target.value));
  };

  return (
    <>
      {!hideToolbar && (
        <ReplayViewBar data-testid="session-heatmap-toolbar">
          <ReplayViewToggle htmlFor="behaviorlens-heatmap-toggle">
            Heatmap
            <Toggle
              id="behaviorlens-heatmap-toggle"
              size="small"
              checked={isHeatmap}
              onChange={handleHeatmapToggle}
              aria-label="Heatmap"
            />
          </ReplayViewToggle>
          {isHeatmap && (
            <ReplayViewFilter>
              <SegmentedControl
                name="behaviorlens-heatmap-filter"
                size="small"
                aria-label="Heatmap click filter"
                options={FILTER_OPTIONS}
                selected={filter}
                onChange={onFilterChange}
              />
            </ReplayViewFilter>
          )}
        </ReplayViewBar>
      )}
      <ReplayStage ref={stageRef} $embedded={embedded} data-testid="session-heatmap-stage">
        {children}
        {isHeatmap && (
          <HeatmapOverlayErrorBoundary onReturnToReplay={returnToReplay}>
            <SessionHeatmapLayer
              densityRange={densityRange}
              highlightedInsightId={highlightedInsightId}
              mountRef={playerMountRef}
              onOpacityChange={handleOpacityChange}
              onReturnToReplay={returnToReplay}
              opacity={heatmapOpacity}
              points={status.points}
              stageRef={stageRef}
              status={status}
            />
          </HeatmapOverlayErrorBoundary>
        )}
      </ReplayStage>
    </>
  );
};

SessionHeatmap.propTypes = {
  children: PropTypes.node,
  embedded: PropTypes.bool,
  events: PropTypes.array,
  filter: PropTypes.string.isRequired,
  hideToolbar: PropTypes.bool,
  highlightedInsightId: PropTypes.string,
  mode: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onModeChange: PropTypes.func.isRequired,
  playerMountRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  recordedViewport: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number
  })
};

export const useSessionHeatmapView = ({
  beforeToggleRef,
  isPlayingRef,
  playerInstanceRef,
  sessionId
}) => {
  const [viewMode, setViewMode] = useState(HEATMAP_VIEW_REPLAY);
  const [heatmapFilter, setHeatmapFilter] = useState(HEATMAP_FILTER_ALL);
  const viewModeRef = useRef(HEATMAP_VIEW_REPLAY);

  const exitHeatmapForPlayback = useCallback(() => {
    if (viewModeRef.current !== HEATMAP_VIEW_HEATMAP) {
      return;
    }
    viewModeRef.current = HEATMAP_VIEW_REPLAY;
    setViewMode(HEATMAP_VIEW_REPLAY);
  }, []);
  if (beforeToggleRef) {
    beforeToggleRef.current = exitHeatmapForPlayback;
  }

  const handleViewModeChange = useCallback(nextMode => {
    const mode = nextMode === HEATMAP_VIEW_HEATMAP ? HEATMAP_VIEW_HEATMAP : HEATMAP_VIEW_REPLAY;
    if (mode === HEATMAP_VIEW_HEATMAP) {
      pauseReplayPlayer(playerInstanceRef.current);
      isPlayingRef.current = false;
    }
    viewModeRef.current = mode;
    setViewMode(mode);
  }, [isPlayingRef, playerInstanceRef]);

  useEffect(() => {
    viewModeRef.current = HEATMAP_VIEW_REPLAY;
    setViewMode(HEATMAP_VIEW_REPLAY);
    setHeatmapFilter(HEATMAP_FILTER_ALL);
  }, [sessionId]);

  return {
    exitHeatmapForPlayback,
    handleViewModeChange,
    heatmapFilter,
    setHeatmapFilter,
    viewMode,
    viewModeRef
  };
};

export default SessionHeatmap;
