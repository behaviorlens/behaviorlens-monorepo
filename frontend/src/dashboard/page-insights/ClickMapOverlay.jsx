import React, {
  useEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import {
  HotspotBubbleButton,
  HotspotCalloutBox,
  HotspotConnectorLayer,
  HotspotLayer,
  HotspotOutline,
  InsightsHeatCanvas,
  InsightsStateBody,
  InsightsStatePanel,
  InsightsStateTitle,
  InsightsStateWrap
} from './ScBehaviorLensPageInsights';
import { getHeatmapDevicePixelRatio, HEATMAP_FILTER_RAGE } from './behaviorLensHeatmap';
import { drawDocumentClickHeatmap, formatClickShare } from './behaviorLensClickMap';
import { buildPageInsightsHotspots } from './usePageInsightsHotspots';

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export const applyStableHotspotRanks = (visibleHotspots, pageHotspots) => {
  const pageRankById = new Map(
    (Array.isArray(pageHotspots) ? pageHotspots : [])
      .map(hotspot => [hotspot.id, hotspot.rank])
  );
  return (Array.isArray(visibleHotspots) ? visibleHotspots : []).map(hotspot => ({
    ...hotspot,
    rank: pageRankById.get(hotspot.id) || hotspot.rank
  }));
};

// Badges start on their hotspot and step outward only far enough to stop
// overlapping. Nothing is repositioned into a different part of the page.
export const getHotspotBubbleLayout = (hotspots, box) => {
  const minimumDistance = 38;
  const edge = 20;
  return hotspots.reduce((placed, hotspot) => {
    const originX = clamp(hotspot.renderedX, edge, Math.max(edge, box.width - edge));
    const originY = clamp(hotspot.renderedY, edge, Math.max(edge, box.height - edge));
    const candidates = [{ x: originX, y: originY }];
    [38, 52, 66].forEach(radius => {
      [0, 60, 120, 180, 240, 300].forEach(angle => {
        const radians = ((angle + (hotspot.rank * 47)) * Math.PI) / 180;
        candidates.push({
          x: clamp(originX + (Math.cos(radians) * radius), edge, Math.max(edge, box.width - edge)),
          y: clamp(originY + (Math.sin(radians) * radius), edge, Math.max(edge, box.height - edge))
        });
      });
    });
    const position = candidates.find(candidate => placed.every(item => (
      Math.hypot(candidate.x - item.bubbleX, candidate.y - item.bubbleY) >= minimumDistance
    ))) || candidates[candidates.length - 1];
    return [...placed, { ...hotspot, bubbleX: position.x, bubbleY: position.y }];
  }, []);
};

const HotspotCallout = ({ hotspot, totalClicks = 0 }) => {
  const share = formatClickShare(hotspot.count, totalClicks);
  return (
    <HotspotCalloutBox
      $left={hotspot.bubbleX}
      $top={hotspot.bubbleY}
      data-testid="behaviorlens-hotspot-callout"
    >
      {`${hotspot.count.toLocaleString('en-US')} clicks${share ? ` · ${share}` : ''}`}
    </HotspotCalloutBox>
  );
};

HotspotCallout.propTypes = {
  hotspot: PropTypes.object.isRequired,
  totalClicks: PropTypes.number
};

// Click Maps: the in-scope heat painted over the shared reconstructed page,
// ranked hotspot badges, and a depth rail that scrolls to a hotspot.
//
// This is an overlay, not a stage: it never owns an rrweb player. The single
// persistent player lives in PageInsightsWorkspace.
const ClickMapOverlay = ({
  documentGeometry = null,
  events,
  filter,
  nodeIndex,
  onHotspotsChange,
  onSelectHotspot,
  pageView = null,
  recordedViewport = null,
  selectedHotspotId = null,
  stage,
  visibleUntilTimestamp = null
}) => {
  const canvasRef = useRef(null);
  const [drawFailed, setDrawFailed] = useState(false);
  const effectiveGeometry = stage.documentGeometry || documentGeometry;

  const pageAnalysis = useMemo(() => buildPageInsightsHotspots({
    documentGeometry: effectiveGeometry,
    events,
    filter,
    mirror: stage.mirror,
    nodeIndex,
    pageView,
    recordedViewport
    // stage.revision changes whenever the reconstructed page settles, which is
    // when element boxes become measurable.
  }), [effectiveGeometry, events, filter, nodeIndex, pageView, recordedViewport,
    stage.revision, stage.viewportMode]);
  const analysis = useMemo(() => buildPageInsightsHotspots({
    documentGeometry: effectiveGeometry,
    events,
    filter,
    mirror: stage.mirror,
    nodeIndex,
    pageView,
    recordedViewport,
    visibleUntilTimestamp
  }), [effectiveGeometry, events, filter, nodeIndex, pageView, recordedViewport,
    stage.revision, stage.viewportMode, visibleUntilTimestamp]);
  const rankedVisibleHotspots = useMemo(() => applyStableHotspotRanks(
    analysis.hotspots,
    pageAnalysis.hotspots
  ), [analysis.hotspots, pageAnalysis.hotspots]);

  // Rail totals and the click list stay the whole page view. Only the painted
  // map follows the playhead.
  useEffect(() => {
    onHotspotsChange(pageAnalysis);
  }, [onHotspotsChange, pageAnalysis]);

  useEffect(() => {
    const clearSelectionOutsideHotspot = event => {
      const { target } = event;
      // Rail rows are another way of selecting a hotspot. Treating their
      // pointerdown as an outside click clears the old selection before the
      // row click can replace it, so the detail card briefly collapses.
      const isInsideInsightsRail = target?.closest?.('[data-testid="behaviorlens-insights-rail"]');
      if (!isInsideInsightsRail && !target?.closest?.('[data-behaviorlens-hotspot="true"]')) {
        onSelectHotspot(null);
      }
    };
    document.addEventListener('pointerdown', clearSelectionOutsideHotspot);
    stage.frameDocument?.addEventListener('pointerdown', clearSelectionOutsideHotspot);
    return () => {
      document.removeEventListener('pointerdown', clearSelectionOutsideHotspot);
      stage.frameDocument?.removeEventListener('pointerdown', clearSelectionOutsideHotspot);
    };
  }, [onSelectHotspot, stage.frameDocument]);

  const { scale } = stage;
  const renderedHotspots = useMemo(() => rankedVisibleHotspots.map(hotspot => {
    const point = stage.documentPointToRendered
      ? stage.documentPointToRendered(hotspot.documentX, hotspot.documentY)
      : { x: hotspot.documentX * scale, y: hotspot.documentY * scale };
    return {
      ...hotspot,
      // Counts and heat follow the playhead, but the badge is an index into
      // the whole-page rail. Re-ranking the visible subset made bubble 3
      // select row 2 as the replay advanced.
      renderedX: point.x,
      renderedY: point.y
    };
  }).filter(hotspot => (
    (!stage.viewportMode
    || (hotspot.renderedX >= -24 && hotspot.renderedX <= stage.renderedWidth + 24
      && hotspot.renderedY >= -24 && hotspot.renderedY <= stage.renderedHeight + 24)
    )
  )), [rankedVisibleHotspots, scale, stage]);
  const bubbleHotspots = useMemo(() => getHotspotBubbleLayout(renderedHotspots, {
    height: stage.renderedHeight, width: stage.renderedWidth
  }), [renderedHotspots, stage.renderedHeight, stage.renderedWidth]);
  const selectedHotspot = renderedHotspots.find(hotspot => hotspot.id === selectedHotspotId) || null;

  useEffect(() => {
    if (!canvasRef.current || !analysis.densityRange || !analysis.clusters?.length) {
      return;
    }
    try {
      drawDocumentClickHeatmap(
        canvasRef.current,
        analysis.clusters.map(cluster => {
          const point = stage.documentPointToRendered
            ? stage.documentPointToRendered(cluster.documentX, cluster.documentY)
            : { x: cluster.documentX * scale, y: cluster.documentY * scale };
          return { count: cluster.count, x: point.x, y: point.y };
        }).filter(cluster => (
          !stage.viewportMode
          || (cluster.x >= -80 && cluster.x <= stage.renderedWidth + 80
            && cluster.y >= -80 && cluster.y <= stage.renderedHeight + 80)
        )),
        {
          // A full page can be several thousand pixels tall; keep the backing
          // store within a size the browser paints comfortably.
          devicePixelRatio: stage.renderedHeight > 3000
            ? 1
            : Math.min(getHeatmapDevicePixelRatio(), 2),
          height: stage.renderedHeight,
          maximumClickCount: analysis.densityRange.maximumClickCount,
          minimumClickCount: analysis.densityRange.minimumClickCount,
          rage: filter === HEATMAP_FILTER_RAGE,
          width: stage.renderedWidth
        }
      );
      setDrawFailed(false);
    } catch (error) {
      setDrawFailed(true);
    }
  }, [analysis, filter, scale, stage]);

  if (analysis.hotspots.length === 0) {
    return (
      <InsightsStateWrap $overlay>
        <InsightsStatePanel role="status" data-testid="behaviorlens-clickmap-empty">
          <InsightsStateTitle>
            No clicks are mapped on this page view
          </InsightsStateTitle>
          <InsightsStateBody>
            {analysis.unmappedClicks > 0
              ? 'The clicks in scope no longer resolve to anything in this reconstructed page, so none are placed.'
              : 'This page view has no recorded click of the selected type.'}
          </InsightsStateBody>
        </InsightsStatePanel>
      </InsightsStateWrap>
    );
  }

  return (
    <>
      {!drawFailed && (
        <InsightsHeatCanvas
          ref={canvasRef}
          $opacity={0.62}
          aria-hidden="true"
          data-testid="behaviorlens-clickmap-heat"
        />
      )}
      <HotspotLayer>
        <HotspotConnectorLayer
          aria-hidden="true"
          viewBox={`0 0 ${stage.renderedWidth} ${stage.renderedHeight}`}
        >
          {bubbleHotspots.filter(hotspot => (
            Math.hypot(hotspot.bubbleX - hotspot.renderedX, hotspot.bubbleY - hotspot.renderedY) > 4
          )).map(hotspot => (
            <line
              key={hotspot.id}
              x1={hotspot.renderedX}
              y1={hotspot.renderedY}
              x2={hotspot.bubbleX}
              y2={hotspot.bubbleY}
              stroke="rgba(75, 85, 99, 0.48)"
              strokeWidth="1.5"
            />
          ))}
        </HotspotConnectorLayer>
        {selectedHotspot?.elementRect && (() => {
          const rect = stage.documentRectToRendered
            ? stage.documentRectToRendered(selectedHotspot.elementRect)
            : {
              height: selectedHotspot.elementRect.height * scale,
              left: selectedHotspot.elementRect.left * scale,
              top: selectedHotspot.elementRect.top * scale,
              width: selectedHotspot.elementRect.width * scale
            };
          return (
            <HotspotOutline
              $left={rect.left}
              $top={rect.top}
              $width={rect.width}
              $height={rect.height}
              data-testid="behaviorlens-hotspot-outline"
            />
          );
        })()}
        {bubbleHotspots.map(hotspot => (
          <HotspotBubbleButton
            key={hotspot.id}
            type="button"
            $left={hotspot.bubbleX}
            $top={hotspot.bubbleY}
            $selected={hotspot.id === selectedHotspotId}
            aria-pressed={hotspot.id === selectedHotspotId}
            aria-label={`Hotspot ${hotspot.rank}: ${hotspot.label}, ${hotspot.count} clicks`}
            aria-controls="behaviorlens-click-list-card"
            data-behaviorlens-hotspot="true"
            data-testid="behaviorlens-hotspot-bubble"
            onClick={() => onSelectHotspot(
              hotspot.id === selectedHotspotId ? null : hotspot.id
            )}
          >
            {hotspot.rank}
          </HotspotBubbleButton>
        ))}
        {bubbleHotspots
          .filter(hotspot => hotspot.id === selectedHotspotId)
          .map(hotspot => (
            <HotspotCallout
              key={hotspot.id}
              hotspot={hotspot}
              totalClicks={analysis.totalClicks}
            />
          ))}
      </HotspotLayer>
    </>
  );
};

ClickMapOverlay.propTypes = {
  documentGeometry: PropTypes.object,
  events: PropTypes.array.isRequired,
  filter: PropTypes.string.isRequired,
  nodeIndex: PropTypes.instanceOf(Map).isRequired,
  onHotspotsChange: PropTypes.func.isRequired,
  onSelectHotspot: PropTypes.func.isRequired,
  pageView: PropTypes.object,
  recordedViewport: PropTypes.object,
  selectedHotspotId: PropTypes.string,
  stage: PropTypes.object.isRequired,
  visibleUntilTimestamp: PropTypes.number
};

export default ClickMapOverlay;
