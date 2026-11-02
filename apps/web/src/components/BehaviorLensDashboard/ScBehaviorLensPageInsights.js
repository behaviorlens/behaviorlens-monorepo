import styled from 'styled-components';
import { RAIL_CARD_SHADOW } from './ScBehaviorLensInsightsRail';

// Rail primitives live in their own module; re-exported here so every
// existing import of ScBehaviorLensPageInsights keeps working. Keep this list
// explicit because this module owns the Scroll Maps-specific legend layout.
export {
  RAIL_CARD_SHADOW,
  InsightsModeTabList,
  InsightsModeTab,
  HotspotPanelHeader,
  HotspotRankBadge,
  HotspotElementChip,
  StatBlock,
  StatValue,
  StatLabel,
  StatDivider,
  InsightsActionRow,
  SelectedElementHeader,
  SelectedElementName,
  SelectedElementStats,
  SelectedElementCount,
  SelectedElementAside,
  TimestampChipRow,
  TimestampChip,
  InspectTargetGroupToggle,
  SelectorModeSwitch,
  SelectorModeButton,
  InspectTargetList,
  InsightsListViewport,
  InsightsListFade,
  InspectTargetsCard,
  InspectTargetRow,
  InspectTargetLabel,
  InspectTargetCount,
  InspectTargetSearch,
  SelectorBox,
  SelectorTextSlot,
  SelectorText,
  SelectorCopyButton,
  InspectSelectorCard,
  InspectCardTitle,
  InspectMetricCard,
  InspectMetricValue,
  InspectMetricLabel,
  InsightsMenu,
  ScrollHeadline,
  ScrollHeadlineNote,
  ScrollOverviewRows,
  ScrollOverviewRow,
  ScrollOverviewLabel,
  ScrollOverviewTrack,
  ScrollOverviewFill,
  ScrollOverviewValue,
  ScrollOverviewMeta,
  ScrollAttentionLegendBar,
  RageCountBadge,
  ClickMapPanelCard,
  ClickMapPanelHeader,
  ClickMapPanelTitle,
  ClickMapRageToggleLabel,
  ClickMapRageToggleInput,
  ClickMapRageToggleControl,
  ClickMapEyebrow,
  ClickMapHeadline,
  ClickSummaryMetrics,
  ClickSummaryMetric,
  ClickSummaryValue,
  ClickSummaryLabel,
  ClickListGroupLabel,
  ClickListRow,
  ClickListHead,
  ClickListRank,
  ClickListSelectionSummary
} from './ScBehaviorLensInsightsRail';

// Styled primitives for the Page Insights workspace (references:
// page-views-for-developing/Page-insights-tarafı-için-2. tab.png,
// heatmap-görünüm.png, heatmap-görünüm2.png).

// The dotted analysis canvas: the strongest "this is aggregate analysis, not
// a recording" signal in the reference.
// Same box as the Session Replay stage: no padding, no patterned ground.
// Page Insights used to inset the surface by 26px and paint a dotted canvas
// behind it, so the recording rendered smaller here than in Session Replay and
// the dots showed around it. Switching modes should not resize the page.
export const InsightsStage = styled.div`
  position: relative;
  z-index: 0;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  align-items: ${({ $fullPage }) => ($fullPage ? 'flex-start' : 'center')};
  justify-content: center;
  overflow: ${({ $fullPage }) => ($fullPage ? 'auto' : 'hidden')};
  background: #ffffff;
`;

// Click Maps and Inspect Mode use the recording as a real viewport. The
// surface remains mounted while the reviewer switches between those modes;
// only Scroll Maps hides it in favour of the full-document snapshot.
export const InsightsSurfaceSlot = styled.div`
  position: relative;
  z-index: 0;
  display: ${({ $active }) => ($active ? 'flex' : 'none')};
  flex: 1 1 auto;
  min-width: 0;
  min-height: ${({ $devToolsOpen }) => ($devToolsOpen ? '150px' : '0')};
  flex-direction: column;
`;

export const InsightsPlaybackStage = styled(InsightsStage)`
  align-items: center;
  overflow: hidden;
`;

export const InsightsPlaybackFrame = styled.div`
  position: relative;
  flex: none;
  width: ${({ $width }) => `${Math.max(1, Number($width) || 1)}px`};
  height: ${({ $height }) => `${Math.max(1, Number($height) || 1)}px`};
  overflow: hidden;
  background: #ffffff;
`;

export const InsightsPlaybackSurface = styled.div`
  position: absolute;
  display: flex;
  left: 0;
  top: 0;
  width: ${({ $width }) => `${Math.max(1, Number($width) || 1)}px`};
  height: ${({ $height }) => `${Math.max(1, Number($height) || 1)}px`};
  transform: scale(${({ $scale }) => Number($scale) || 1});
  transform-origin: left top;

  .rr-player,
  .rr-player__frame,
  .replayer-wrapper,
  .replayer-wrapper > iframe {
    max-width: none;
    max-height: none;
  }
`;

// rrweb renders the page frame here; the player is created paused so the
// snapshot is a static analysis background, never a playing recording.
export const InsightsSnapshotMount = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  overflow: ${({ $scrollable }) => ($scrollable ? 'hidden auto' : 'hidden')};
`;

export const ScrollFullPageFrame = styled.div`
  position: relative;
  flex: none;
  width: ${({ $ready, $width }) => ($ready ? `${$width}px` : '100%')};
  height: ${({ $ready, $height }) => ($ready ? `${$height}px` : '100%')};
  min-height: ${({ $ready }) => ($ready ? '0' : '240px')};
  margin: 0 auto;
  overflow: hidden;
  background: #ffffff;
`;

export const ScrollFullPageSurface = styled.div`
  position: absolute;
  display: flex;
  left: 0;
  top: 0;
  width: ${({ $width }) => `${$width}px`};
  height: ${({ $height }) => `${$height}px`};
  transform-origin: left top;
  /* transform: scale() on an iframe ancestor paints blank in Chromium
     fullscreen. zoom keeps the same visual size without that containing
     block. Browsers without zoom keep the transform. */
  transform: scale(${({ $scale }) => $scale});

  @supports (zoom: 1) {
    zoom: ${({ $scale }) => $scale};
    transform: none;
  }

  .rr-player {
    filter: ${({ $muted }) => ($muted ? 'saturate(0.42) contrast(0.84) brightness(1.06)' : 'none')};
  }

  .rr-player,
  .rr-player__frame,
  .replayer-wrapper,
  .replayer-wrapper > iframe {
    max-width: none;
    max-height: none;
  }

  .replayer-wrapper > iframe {
    transform: translateZ(0);
  }
`;

// Overlay plane pinned to the scaled page. Children position themselves in
// rendered pixels, so labels, blur radii and hit targets stay screen-sized
// however far the page is scaled down.
export const FullPageOverlay = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: ${({ $width }) => `${$width}px`};
  height: ${({ $height }) => `${$height}px`};
  z-index: 5;
  pointer-events: none;
`;

export const InsightsHeatCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  opacity: ${({ $opacity }) => $opacity};
`;

// Crimson outline over the selected hotspot's element box (reference
// heatmap-görünüm.png outlines the ranked element itself).
export const HotspotOutline = styled.div`
  position: absolute;
  left: ${({ $left }) => `${$left}px`};
  top: ${({ $top }) => `${$top}px`};
  width: ${({ $width }) => `${$width}px`};
  height: ${({ $height }) => `${$height}px`};
  z-index: 7;
  box-sizing: border-box;
  border: 2px solid #d93b30;
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
  pointer-events: none;
`;

export const HotspotLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
`;

export const HotspotConnectorLayer = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
`;

// Default: translucent with a grey numeral. Selected: solid blue, white
// numeral (reference heatmap-görünüm.png).
export const HotspotBubbleButton = styled.button`
  position: absolute;
  left: ${({ $left }) => `${$left}px`};
  top: ${({ $top }) => `${$top}px`};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin: 0;
  padding: 0;
  transform: translate(-50%, -50%);
  border: ${({ $selected }) => ($selected ? '2px solid #ffffff' : '1px solid rgba(16, 24, 40, 0.08)')};
  border-radius: 50%;
  background: ${({ $selected }) => ($selected ? '#1463ff' : 'rgba(255, 255, 255, 0.94)')};
  color: ${({ $selected }) => ($selected ? '#ffffff' : '#6b7280')};
  box-shadow: ${({ $selected }) => ($selected
    ? '0 4px 12px rgba(20, 99, 255, 0.4)'
    : '0 2px 8px rgba(16, 24, 40, 0.18)')};
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  pointer-events: auto;
  transition: background-color 120ms ease, color 120ms ease;

  &:hover {
    background: ${({ $selected }) => ($selected ? '#0f56d6' : 'rgba(255, 255, 255, 0.95)')};
  }

  &:focus-visible {
    outline: 3px solid #2e6fdb;
    outline-offset: 2px;
  }

`;

export const HotspotCalloutBox = styled.div`
  position: absolute;
  left: ${({ $left }) => `${$left}px`};
  top: ${({ $top }) => `${$top}px`};
  z-index: 8;
  transform: translate(-50%, calc(-100% - 26px));
  min-width: 148px;
  padding: 10px 14px;
  border-radius: 8px;
  background: #1463ff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -5px;
    width: 12px;
    height: 12px;
    margin-left: -6px;
    transform: rotate(45deg);
    border-radius: 2px;
    background: #1463ff;
  }
`;

// Vertical rank rail on the stage's right edge: one tick per hotspot at its
// page-Y position, coloured hot -> cold by real rank.
export const InsightsRail = styled.div`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0 24px 16px;
  background: #f5f9ff;
  border-left: 1px solid #e7ecf4;
  overflow: hidden;

  @media (max-width: 1180px) {
    overflow: visible;
    border-left: none;
    border-top: 1px solid #e7ecf4;
  }
`;

export const InsightsRailBody = styled.div`
  box-sizing: border-box;
  display: ${({ $clickMap, $inspect }) => ($clickMap || $inspect ? 'flex' : 'block')};
  flex-direction: ${({ $clickMap, $inspect }) => ($clickMap || $inspect ? 'column' : 'initial')};
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  /* Every mode scrolls once the window is too short: the stretchy lists
     (click list, inspect targets) shrink to their min-height first. */
  overflow-y: auto;
  overflow-anchor: none;
  margin-top: 16px;
  padding: 0;

  @media (max-width: 1180px) {
    overflow: visible;
  }
`;

export const ClickMapRailLayout = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 240px;
  overflow: hidden;
`;

export const InsightsCard = styled.div`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  margin: 0 0 16px;
  border: 1px solid #e6e7ed;
  border-radius: 12px;
  background: #ffffff;
  padding: 16px;
  box-shadow: ${RAIL_CARD_SHADOW};
  overflow: hidden;
`;

// The page view picker sits above flex-column rails (Click Maps, Inspect
// Mode); it keeps its full height instead of shrinking under its button.
export const PageScopeCard = styled(InsightsCard)`
  flex: 0 0 auto;
  overflow: visible;
`;

export const ScrollMapCard = styled(InsightsCard)`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 14px 16px;
  border-color: #e8e9ef;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(13, 20, 51, 0.05);
`;

export const InsightsCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`;

export const InsightsSectionLabel = styled.div`
  color: #6c73a8;
  font-size: 16px;
  font-weight: 700;
  line-height: normal;
  text-transform: uppercase;
`;

export const ClickMapViewSwitch = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 16px;
  border-radius: 12px;
  padding: 4px;
  background: #eaedfa;
`;

export const ClickMapViewButton = styled.button`
  margin: 0;
  border: 1px solid ${({ $active }) => ($active ? '#0a1551' : 'transparent')};
  border-radius: 6px;
  padding: 8px 10px;
  background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#0a1551' : '#6f76a7')};
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;

  &:hover { color: #0a1551; }
  &:focus-visible { outline: 2px solid #0a1551; outline-offset: 1px; }
`;

// Two-column grid, not flex/space-between: the label column is fixed so a
// long Page title can never widen a row, drift the value column, or push the
// rail into horizontal overflow.
export const InsightsDetailRow = styled.div`
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  padding: 7px 0;
  font-size: 13px;
  border-top: 1px solid #f2f4f7;

  &:first-child {
    border-top: 0;
  }
`;

export const InsightsDetailKey = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: #6b7280;
  line-height: 18px;

  svg {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    color: #9ca3af;
  }
`;

// Values are left-aligned in their own column, wrap to at most two lines, and
// ellipsize beyond that. Numeric values share tabular figures so they line up.
export const InsightsDetailValue = styled.span`
  min-width: 0;
  color: #1f2937;
  font-weight: 700;
  line-height: 18px;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${({ $lines = 2 }) => $lines};
`;

export const InsightsUnavailableValue = styled.span`
  min-width: 0;
  color: #9ca3af;
  font-size: 12px;
  font-style: italic;
  line-height: 18px;
  overflow-wrap: anywhere;
`;

export const InsightsTip = styled.div`
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #e7effe;
  color: #6f76a7;
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
`;

export const InsightsStateWrap = styled.div`
  display: grid;
  place-items: center;
  height: 100%;
  padding: 28px;

  /* Over a full-height page the panel has to sit where the reviewer is
     already looking, not at the vertical middle of a 4000px document. */
  ${({ $overlay }) => ($overlay ? `
    position: absolute;
    inset: 0;
    z-index: 8;
    height: auto;
    place-items: start center;
    padding-top: 56px;
    background: rgba(247, 248, 249, 0.88);
  ` : '')}
`;

export const InsightsStatePanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 380px;
  text-align: center;
`;

export const InsightsStateTitle = styled.div`
  color: #1f2937;
  font-size: 15px;
  font-weight: 700;
`;

export const InsightsStateBody = styled.div`
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
`;

// ---------------------------------------------------------------------------
// Scroll Maps
// ---------------------------------------------------------------------------

export const ScrollAttentionLayer = styled.div`
  position: absolute;
  z-index: 4;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

// One continuous ramp instead of 40 visible steps. The stops come from the
// real per-depth dwell bins, so the colour at any depth is the time this
// visit actually spent with that part of the page on screen.
export const ScrollAttentionGradient = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ $gradient }) => $gradient};
  mix-blend-mode: multiply;
`;

export const ScrollAttentionLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding-top: 4px;
  color: #9ca3b3;
  font-size: 10px;
  font-weight: 500;
`;

export const ScrollAttentionLegendLabels = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export const ScrollMapMetricRows = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`;

export const ScrollMapMetricRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 6px 0;
  color: #6d7381;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;

  svg {
    width: 12px;
    height: 12px;
    flex: 0 0 12px;
    color: #6d7381;
  }

  strong {
    overflow: hidden;
    color: #0a1551;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const ScrollMapReached = styled.div`
  color: #6d7381;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;

  strong {
    color: #0a1551;
    font-weight: 500;
  }
`;

export const ScrollAttentionLegendGradient = styled.span`
  width: 92px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2f6df6 0%, #f6d44b 46%, #f77725 74%, #e22d40 100%);
`;

// Depth ruler down the right edge: 25 / 50 / 75 / 100% of the page.
export const ScrollDepthRuler = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 62px;
  z-index: 6;
  pointer-events: none;
`;

export const ScrollDepthTick = styled.div`
  position: absolute;
  right: 0;
  top: ${({ $top }) => `${Math.max(0, Math.min(100, $top))}%`};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  transform: translateY(${({ $top }) => (Number($top) >= 99 ? '-100%' : '-50%')});
  color: #5b6472;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;

  &::before {
    content: '';
    width: 14px;
    height: 1px;
    background: rgba(31, 41, 55, 0.35);
  }
`;

export const ScrollMarker = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: ${({ $top }) => `${Math.max(0, Math.min(100, $top))}%`};
  height: 0;
  z-index: 7;
  border-top: ${({ $fold }) => ($fold ? '2px dashed #ffffff' : '3px solid #ef3e3e')};
  box-shadow: ${({ $fold }) => ($fold ? '0 1px 0 rgba(31, 41, 55, 0.35)' : 'none')};
  transform: translateY(-50%);
  pointer-events: none;
`;

export const ScrollMarkerPill = styled.span`
  position: absolute;
  top: ${({ $edge }) => ($edge === 'bottom' ? '-4px' : ($edge === 'top' ? '4px' : '0'))};
  ${({ $center, $edge }) => {
    const verticalTransform = $edge === 'bottom' ? '-100%' : ($edge === 'top' ? '0' : '-50%');
    return $center
      ? `left: 50%; transform: translate(-50%, ${verticalTransform});`
      : `left: 14px; transform: translateY(${verticalTransform});`;
  }}
  max-width: calc(100% - 28px);
  padding: 6px 10px;
  border: 2px solid ${({ $fold }) => ($fold ? '#1f2937' : '#ef3e3e')};
  border-radius: 7px;
  background: #ffffff;
  color: ${({ $fold }) => ($fold ? '#1f2937' : '#d82d2d')};
  box-shadow: 0 2px 7px rgba(16, 24, 40, 0.14);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
`;

// Draggable depth probe, the control FullStory and Clarity both expose: the
// reviewer drags it and reads what this visit did at that depth.
export const ScrollProbeLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: ${({ $top }) => `${Math.max(0, Math.min(100, $top))}%`};
  height: 0;
  z-index: 9;
  border-top: 3px solid #ffffff;
  filter: drop-shadow(0 1px 2px rgba(16, 24, 40, 0.45));
  cursor: ns-resize;
  pointer-events: auto;
  touch-action: none;
`;

export const ScrollProbeHandle = styled.button`
  position: absolute;
  /* Centred on the part of the page the reviewer can actually see, the same
     way the probe line is pinned to the visible window vertically. Centring on
     the rendered page instead leaves the readout off to one side whenever the
     page is wider than the stage. */
  left: ${({ $left }) => (Number.isFinite($left) ? `${$left}px` : '50%')};
  top: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transform: translate(-50%, -50%);
  max-width: calc(100% - 32px);
  margin: 0;
  padding: 7px 11px;
  border: 0;
  border-radius: 999px;
  background: #1f2937;
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(16, 24, 40, 0.32);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: ns-resize;
  pointer-events: auto;
  touch-action: none;

  &::after {
    content: '\2261';
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
`;

export const ScrollProbeReadout = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  b {
    font-weight: 800;
  }

  i {
    font-style: normal;
    opacity: 0.72;
  }
`;

// ---------------------------------------------------------------------------
// Inspect Mode
// ---------------------------------------------------------------------------

// Every inspectable element, painted as one thin outline per element on a
// single canvas. Hundreds of boxes cost one DOM node.
export const InspectTargetCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const InspectHitLayer = styled.div`
  position: absolute;
  inset: 0;
  cursor: crosshair;
  pointer-events: auto;
`;

export const InspectOutline = styled.div`
  position: absolute;
  left: ${({ $rect }) => `${$rect.left}px`};
  top: ${({ $rect }) => `${$rect.top}px`};
  width: ${({ $rect }) => `${$rect.width}px`};
  height: ${({ $rect }) => `${$rect.height}px`};
  box-sizing: border-box;
  border: 2px solid ${({ $selected }) => ($selected ? '#d9374e' : '#1463ff')};
  background: ${({ $selected }) => ($selected ? 'rgba(217, 55, 78, 0.06)' : 'rgba(20, 99, 255, 0.08)')};
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.75);
  pointer-events: none;
`;
