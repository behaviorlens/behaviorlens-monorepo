import React, {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import {
  ScrollAttentionGradient,
  ScrollAttentionLayer,
  ScrollDepthRuler,
  ScrollDepthTick,
  ScrollMarker,
  ScrollMarkerPill,
  ScrollProbeHandle,
  ScrollProbeLine,
  ScrollProbeReadout
} from './ScBehaviorLensPageInsights';
import {
  buildScrollAttentionGradient,
  formatVisibleDuration,
  getPinnedProbe,
  getPinnedProbeCenterX,
  getProbeRatioFromPointer,
  getScrollDepthReadout
} from './behaviorLensScrollMap';

const DEPTH_TICKS = [25, 50, 75, 100];
const getMarkerEdge = percent => {
  if (percent <= 1) return 'top';
  if (percent >= 99) return 'bottom';
  return null;
};

export const formatDwell = milliseconds => {
  const duration = formatVisibleDuration(milliseconds);
  return duration ? `Visible for ${duration}` : 'No visibility recorded';
};

const clampRatio = value => Math.max(0, Math.min(1, value));

// Scroll Maps: the full page view under a continuous attention ramp, with the
// two lines that actually explain a visit — where the page ended on load, and
// how far down it ever got — plus a probe the reviewer drags to read any depth.
const ScrollMapOverlay = ({
  onProbeChange, probeRatio, scrollMap, stage
}) => {
  const lineRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  // The probe is pinned to the stage's visible window: scrolling changes the
  // depth, dragging fine-tunes it, and the readout never scrolls out of view.
  const pinned = useMemo(() => getPinnedProbe({
    ratio: probeRatio,
    renderedHeight: stage.renderedHeight,
    scrollTop: stage.scrollTop,
    viewportHeight: stage.stageViewportHeight
  }), [probeRatio, stage.renderedHeight, stage.scrollTop, stage.stageViewportHeight]);
  const probePercent = pinned ? pinned.depthPercent : 0;
  // The readout sits in the middle of what is on screen, not the middle of the
  // rendered page, which are different as soon as the stage scrolls sideways.
  const handleLeft = useMemo(() => getPinnedProbeCenterX({
    renderedWidth: stage.renderedWidth,
    scrollLeft: stage.scrollLeft,
    viewportWidth: stage.stageViewportWidth
  }), [stage.renderedWidth, stage.scrollLeft, stage.stageViewportWidth]);
  const gradient = useMemo(
    () => buildScrollAttentionGradient(scrollMap.attention),
    [scrollMap.attention]
  );
  const readout = useMemo(
    () => getScrollDepthReadout(scrollMap, probePercent),
    [probePercent, scrollMap]
  );

  const readDepthFromPointer = useCallback(clientY => {
    // Dragging reports a position inside the visible window, not a page depth.
    const stageNode = lineRef.current?.closest?.('[data-testid]')?.parentElement;
    const rect = stageNode?.getBoundingClientRect?.();
    return getProbeRatioFromPointer({
      clientY,
      viewportHeight: rect?.height || stage.stageViewportHeight,
      windowTop: rect?.top || 0
    });
  }, [stage.stageViewportHeight]);

  useEffect(() => {
    if (!dragging || typeof window === 'undefined') {
      return undefined;
    }
    const handleMove = event => {
      const depth = readDepthFromPointer(event.clientY);
      if (depth !== null) {
        onProbeChange(depth);
      }
    };
    const stop = () => setDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [dragging, onProbeChange, readDepthFromPointer]);

  const nudge = event => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      onProbeChange(clampRatio(probeRatio + (step / 100)));
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      onProbeChange(clampRatio(probeRatio - (step / 100)));
    }
  };

  return (
    <>
      {gradient && (
        <ScrollAttentionLayer aria-hidden="true" data-testid="behaviorlens-scroll-attention-heatmap">
          <ScrollAttentionGradient
            $gradient={gradient}
            data-most-viewed-depth={scrollMap.attention?.mostViewedDepthPercent}
            data-total-visible-ms={Math.round(scrollMap.attention?.totalVisibleMs || 0)}
            data-testid="behaviorlens-scroll-attention-gradient"
          />
        </ScrollAttentionLayer>
      )}

      <ScrollDepthRuler aria-hidden="true">
        {DEPTH_TICKS.map(depth => (
          <ScrollDepthTick key={depth} $top={depth}>{`${depth}%`}</ScrollDepthTick>
        ))}
      </ScrollDepthRuler>

      {Number.isFinite(scrollMap.reachPercent) && (
        <ScrollMarker $top={scrollMap.reachPercent}>
          <ScrollMarkerPill
            $center
            $edge={getMarkerEdge(scrollMap.reachPercent)}
            data-testid="behaviorlens-scroll-reach-marker"
          >
            {`Furthest point reached · ${Math.round(scrollMap.reachPercent)}%`}
          </ScrollMarkerPill>
        </ScrollMarker>
      )}

      <ScrollProbeLine
        ref={lineRef}
        $top={pinned ? (pinned.top / stage.renderedHeight) * 100 : 0}
        data-testid="behaviorlens-scroll-probe"
        onPointerDown={event => {
          event.preventDefault();
          setDragging(true);
        }}
      >
        <ScrollProbeHandle
          type="button"
          $left={handleLeft}
          aria-label="Scroll depth probe"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(probePercent)}
          role="slider"
          data-testid="behaviorlens-scroll-probe-handle"
          onKeyDown={nudge}
          onPointerDown={event => {
            event.preventDefault();
            setDragging(true);
          }}
        >
          <ScrollProbeReadout>
            <b>{`${Math.round(probePercent)}%`}</b>
            <i>
              {readout.pixels !== null ? `${readout.pixels.toLocaleString('en-US')}px · ` : ''}
              {readout.reached === false ? 'never reached' : formatDwell(readout.visibleMs)}
            </i>
          </ScrollProbeReadout>
        </ScrollProbeHandle>
      </ScrollProbeLine>

      {/* Keeps the scaled page and its markers provably in one space. */}
      <span
        aria-hidden="true"
        data-scale={stage.scale}
        data-testid="behaviorlens-scrollmap-scale"
        style={{ display: 'none' }}
      />
    </>
  );
};

ScrollMapOverlay.propTypes = {
  onProbeChange: PropTypes.func.isRequired,
  probeRatio: PropTypes.number.isRequired,
  scrollMap: PropTypes.object.isRequired,
  stage: PropTypes.object.isRequired
};

export default ScrollMapOverlay;
