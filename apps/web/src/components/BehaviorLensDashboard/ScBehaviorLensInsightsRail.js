import styled from 'styled-components';
import { Button, Menu } from '../../ui';
import { RailViewTab, RailViewTabs } from './ScBehaviorLensEventRail';

// Styled primitives for the Page Insights right rail: the selected-element
// card, the selector box, and the inspectable-element list.
//
// Split out of ScBehaviorLensPageInsights.js, which had grown past the file-size
// limit. That module re-exports everything here, so import from either.

// Click Maps Interaction Overview / Click Summary elevation. Scroll Maps,
// Inspect Mode, and AI Summary reuse this so the right-rail cards match.
export const RAIL_CARD_SHADOW = '0 2px 6px rgba(84, 95, 111, 0.1), 0 1px 2px rgba(37, 45, 91, 0.04)';

export const InsightsModeTabList = styled(RailViewTabs)`
  height: 73px;
`;

export const InsightsModeTab = styled(RailViewTab)`
  color: ${({ $accent, $active }) => ($active ? ($accent || '#104877') : '#9ca3b3')};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0;

  svg {
    width: 22px;
    height: 22px;
  }

  &::after {
    background: ${({ $accent, $active }) => ($active ? ($accent || '#104877') : 'transparent')};
  }
`;

export const HotspotPanelHeader = styled.div`
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
`;

export const HotspotRankBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #1463ff;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
`;

export const HotspotElementChip = styled.span`
  display: block;
  min-width: 0;
  padding: 4px 10px;
  border-radius: 6px;
  background: #f0f2f5;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StatBlock = styled.div`
  padding: 14px 0;
  text-align: center;
`;

export const StatValue = styled.div`
  color: #1f2937;
  font-size: 28px;
  font-weight: 750;
  line-height: 1.15;
`;

export const StatLabel = styled.div`
  margin-top: 4px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const StatDivider = styled.div`
  width: 44px;
  height: 1px;
  margin: 4px auto;
  background: #e7ecf4;
`;

export const InsightsActionRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  border: 0;
  padding: 9px 4px;
  background: transparent;
  color: ${({ disabled }) => (disabled ? '#b6bcc6' : '#1f2937')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font: inherit;
  font-size: 14px;
  text-align: left;

  svg {
    width: 17px;
    height: 17px;
    color: ${({ disabled }) => (disabled ? '#c9ced6' : '#6b7280')};
  }

  &:hover:not(:disabled) {
    color: #1463ff;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
    border-radius: 6px;
  }
`;

// Inspect Mode points on this layer instead of inside the reconstructed
// iframe, which rrweb sandboxes. It sits above the page and below the
// outlines, and is the only part of the overlay stack that takes the pointer.
// Compact "what did I pick" card: identity, selector and evidence in one
// block, so the answer is not split across two cards.

export const SelectedElementHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
`;

export const SelectedElementName = styled.div`
  min-width: 0;
  padding: 10px 12px;
  overflow: hidden;
  border: 1px solid rgba(10, 21, 81, 0.06);
  border-radius: 8px;
  background: #f3f5fe;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #0a1551;
  font-size: 14px;
  font-weight: 500;
`;

export const SelectedElementStats = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 12px;
`;

// The measured count leads; the demo audience figure sits beside it at body
// size rather than dominating the panel.
export const SelectedElementCount = styled.span`
  color: #2c3345;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
`;

export const SelectedElementAside = styled.span`
  color: #6b7280;
  font-size: 13px;
`;

export const TimestampChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  margin-left: ${({ $indent }) => ($indent ? '32px' : '0')};
`;

// A rage click is carried by the moment it happened at, so the chip for that
// second says so instead of the count alone reporting it.
export const TimestampChip = styled.button`
  margin: 0;
  padding: 4px 9px;
  border: 0;
  border-radius: 6px;
  background: ${({ $rage, $selected }) => {
    if ($selected) return $rage ? '#DC2626' : 'rgba(10, 21, 81, 0.81)';
    if ($rage) return '#fdeaea';
    return '#e7edff';
  }};
  color: ${({ $rage, $selected }) => {
    if ($selected) return '#ffffff';
    if ($rage) return '#DC2626';
    return '#0a1551';
  }};
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  cursor: ${({ $static }) => ($static ? 'default' : 'pointer')};

  &:hover {
    background: ${({ $rage, $selected }) => {
    if ($selected) return $rage ? '#B91C1C' : '#0a1551';
    return $rage ? '#fbd9d9' : '#d5e1fe';
  }};
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }
`;

export const InspectTargetGroupToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 12px 0 2px;
  padding: 2px 0;
  border: 0;
  background: none;
  color: #8a8f99;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;

  &:first-of-type {
    margin-top: 4px;
  }

  &:hover {
    color: ${({ $static }) => ($static ? '#8a8f99' : '#5f6470')};
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
    border-radius: 4px;
  }

  svg {
    width: 12px;
    height: 12px;
    flex: none;
    transform: rotate(${({ $expanded }) => ($expanded ? '0deg' : '-90deg')});
    transition: transform 120ms ease;
  }
`;

// Two equal, clickable formats — a segmented control, not a dropdown.
export const SelectorModeSwitch = styled.div`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  padding: 4px;
  border-radius: 8px;
  background: #f3f5fe;
`;

export const SelectorModeButton = styled.button`
  flex: 1 1 0;
  margin: 0;
  padding: 8px 10px;
  border: 1px solid ${({ $active }) => ($active ? '#e6e7ed' : 'transparent')};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  box-shadow: none;
  color: ${({ $active }) => ($active ? '#404458' : '#6c73a8')};
  font-size: 12px;
  font-weight: 700;
  line-height: normal;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }
`;

export const InspectTargetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ $captured }) => ($captured ? '8px' : '2px')};
  flex: 1 1 auto;
  min-height: 0;
  max-height: ${({ $captured }) => ($captured ? '100%' : 'none')};
  overflow-y: auto;
  overflow-anchor: none;
  margin: 0;
  padding: 0 6px;
`;

export const InsightsListViewport = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  margin: 0 -6px;
  overflow: hidden;
`;

export const InsightsListFade = styled.div`
  position: absolute;
  z-index: 2;
  right: 0;
  ${({ $edge }) => ($edge === 'top' ? 'top: 0;' : 'bottom: 0;')}
  left: 0;
  height: ${({ $height }) => `${$height}px`};
  opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
  background: rgba(255, 255, 255, 0.55);
  mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  backdrop-filter: blur(2px);
  -webkit-mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  -webkit-backdrop-filter: blur(2px);
  transition: none;
  will-change: opacity;
`;

export const InspectTargetsCard = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 120px;
  margin: 0 0 16px;
  border: 1px solid #e6e7ed;
  border-radius: 12px;
  background: #ffffff;
  padding: 16px;
  box-shadow: ${RAIL_CARD_SHADOW};
  overflow: hidden;
`;

export const InspectTargetRow = styled.button`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  min-height: 30px;
  padding: 5px 8px 5px 18px;
  border: 0;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#f3f5fe' : 'transparent')};
  color: #091141;
  font-size: 13px;
  text-align: left;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 50%;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    transform: translateY(-50%);
  }

  &:hover {
    background: #eef4ff;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }
`;

export const InspectTargetLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
`;

export const InspectTargetCount = styled.span`
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e6f0ff;
  color: #1e4fa8;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
`;

export const InspectTargetSearch = styled.input`
  width: 100%;
  margin-bottom: 8px;
  padding: 8px 10px;
  border: 1px solid #dfe3ea;
  border-radius: 7px;
  background: #ffffff;
  color: #2c3345;
  font-size: 13px;

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: -1px;
  }
`;

export const SelectorBox = styled.div`
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 72px;
  min-height: 72px;
  margin: 0;
  border: 1px solid #e6e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  background: #fcfcfe;
  color: #0a1551;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: normal;
  overflow: hidden;
`;

export const SelectorTextSlot = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const SelectorText = styled.span`
  && {
    display: block;
  }

  min-width: 0;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }
`;

export const SelectorCopyButton = styled(Button)`
  && {
    flex: 0 0 16px;
    width: 16px;
    min-width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #6c73a8;
  }

  &&:hover:not(:disabled) {
    background: transparent;
    color: #0a1551;
  }

  &&:focus {
    outline: none;
  }

  &&:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }

  && svg {
    width: 16px;
    height: 16px;
  }
`;

export const InspectSelectorCard = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 0 0 16px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid #e6e7ed;
  border-radius: 12px;
  background: #f3f5fe;
  box-shadow: 0 2px 12px rgba(91, 85, 139, 0.05);
`;

export const InspectCardTitle = styled.div`
  margin-bottom: ${({ $selector }) => ($selector ? '0' : '12px')};
  color: #6c73a8;
  font-size: 16px;
  font-weight: 700;
  line-height: normal;
  text-transform: uppercase;
`;

export const InspectMetricCard = styled.div`
  box-sizing: border-box;
  width: 100%;
  margin-top: 8px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid #e6e7ed;
  border-radius: 10px;
  background: rgba(243, 245, 254, 0.4);
`;

export const InspectMetricValue = styled.div`
  color: #0a1551;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`;

export const InspectMetricLabel = styled.div`
  margin-top: 6px;
  color: #8a87a8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

// Native <select> opens the operating system's own popup, which ignores the
// page entirely. The rest of the dashboard uses Magnet's Menu for this, so the
// Page Insights pickers do too.
export const InsightsMenu = styled(Menu)`
  /* Magnet renders the menu in a popover, so a percentage here resolves
     against the viewport, not the trigger — it spilled across the page. Give
     it a real width, the way SavedViewsMenu does. */
  width: min(320px, calc(100vw - 32px));
`;

export const ScrollHeadline = styled.div`
  color: #2c3345;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
`;

export const ScrollHeadlineNote = styled.div`
  margin-top: 2px;
  color: #6b7280;
  font-size: 13px;
`;

export const ScrollOverviewRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ScrollOverviewRow = styled.div`
  display: grid;
  grid-template-columns: 110px minmax(72px, 1fr) 44px;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const ScrollOverviewLabel = styled.div`
  color: #6d7381;
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
`;

export const ScrollOverviewTrack = styled.div`
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: #f1f2f6;
`;

const scrollOverviewPercentageColor = percent => {
  const ratio = Math.max(0, Math.min(100, Number(percent) || 0)) / 100;
  const light = [115, 158, 252];
  const dark = [60, 105, 231];
  const color = light.map((channel, index) => (
    Math.round(channel + ((dark[index] - channel) * ratio))
  ));
  return `rgb(${color.join(', ')})`;
};

export const ScrollOverviewFill = styled.div`
  width: ${({ $percent }) => `${Math.max(0, Math.min(100, Number($percent) || 0))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ $percent, $scaled, $tone }) => (
    $scaled
      ? scrollOverviewPercentageColor($percent)
      : ($tone === 'secondary' ? '#739efc' : '#3c69e7')
  )};
`;

export const ScrollOverviewValue = styled.div`
  color: ${({ $percent, $scaled, $tone }) => (
    $scaled
      ? scrollOverviewPercentageColor($percent)
      : ($tone === 'secondary' ? '#739efc' : '#3c69e7')
  )};
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
`;

export const ScrollOverviewMeta = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #f1f2f6;
  color: #0a1551;
  font-size: 13px;

  strong {
    max-width: 65%;
    font-weight: 600;
    text-align: right;
  }
`;

export const ScrollAttentionLegend = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f2f6;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
`;

export const ScrollAttentionLegendBar = styled.span`
  display: block;
  width: 100%;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 3px;
  background: ${({ $gradient }) => $gradient};
`;

export const RageCountBadge = styled.span`
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  background: #fdeaea;
  color: #DC2626;
  font-size: 11px;
  font-weight: 700;
`;

export const ClickMapPanelCard = styled.div`
  box-sizing: border-box;
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  margin: 0 0 16px;
  border: 1px solid #e6e7ed;
  border-radius: 16px;
  padding: 24px;
  background: #ffffff;
  box-shadow: ${RAIL_CARD_SHADOW};
  overflow: hidden;

  ${({ $scrollable }) => ($scrollable ? `
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    /* Last card in the rail: ends where Inspect Mode's last card ends. */
    margin-bottom: 0;
  ` : '')}

  &[data-testid='behaviorlens-click-summary'] {
    border-radius: 12px;
    padding: 16px;
  }
`;

export const ClickMapPanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex: 0 0 auto;
  gap: 16px;
  margin-bottom: 20px;
`;

export const ClickMapPanelTitle = styled.div`
  min-width: 0;
`;

export const ClickMapRageToggleLabel = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
  margin-top: 2px;
  color: #6f76a7;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;
`;

export const ClickMapRageToggleInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`;

export const ClickMapRageToggleControl = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  box-sizing: border-box;
  width: 28px;
  height: 16px;
  padding: 2px;
  border-radius: 3px;
  background: ${({ $checked }) => ($checked ? '#4276ff' : '#979dc6')};
  transition: background-color 120ms ease;

  &::after {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 2px;
    background: #ffffff;
    box-shadow: 0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04);
    transform: translateX(${({ $checked }) => ($checked ? '12px' : '0')});
    transition: transform 120ms ease;
  }

  ${ClickMapRageToggleInput}:focus-visible + & {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

export const ClickMapEyebrow = styled.div`
  color: #6c73a8;
  font-size: 16px;
  font-weight: 700;
  line-height: normal;
  text-transform: uppercase;
`;

export const ClickMapHeadline = styled.div`
  color: #6c73a8;
  font-size: 16px;
  font-weight: 400;
  line-height: normal;
`;

export const ClickSummaryMetrics = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 34px;
  margin-top: 14px;
`;

export const ClickSummaryMetric = styled.div`
  min-width: 0;
`;

export const ClickSummaryValue = styled.div`
  color: #0a1551;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;

export const ClickSummaryLabel = styled.div`
  margin-top: 8px;
  color: #6f76a7;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

// Click list. Every clicked element of the page view is written out directly —
// no folded group — with its click times beside it, so the reviewer reads the
// element and reaches the second in one place.
export const ClickListGroupLabel = styled.div`
  flex: 0 0 auto;
  margin: 16px 0 6px;
  color: #8a8f99;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &:first-of-type {
    margin-top: 6px;
  }
`;

export const ClickListRow = styled.div`
  flex: 0 0 auto;
  min-height: 60px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: ${({ $active, $rage }) => ($active
    ? ($rage ? '#fff0f2' : '#d5e1fe')
    : 'transparent')};
  opacity: ${({ $muted }) => ($muted ? 0.72 : 1)};
`;

export const ClickListHead = styled.button`
  display: grid;
  grid-template-columns: ${({ $ranked }) => ($ranked ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)')};
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: #2c3345;
  font-size: 13px;
  text-align: left;
  cursor: ${({ $static }) => ($static ? 'default' : 'pointer')};

  ${InspectTargetLabel} {
    color: #0a1551;
    font-size: 14px;
    font-weight: 700;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 3px;
    border-radius: 4px;
  }
`;

export const ClickListRank = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 24px;
  height: 24px;
  padding: 0 5px;
  border-radius: 999px;
  background: ${({ $active, $rage }) => {
    if ($rage) return $active ? '#DC2626' : '#fdeaea';
    return $active ? 'rgba(10, 21, 81, 0.81)' : '#e6e9f6';
  }};
  color: ${({ $active, $rage }) => {
    if ($rage) return $active ? '#ffffff' : '#DC2626';
    return $active ? '#ffffff' : '#252d5b';
  }};
  font-size: 12px;
  font-weight: 700;
`;

export const ClickListSelectionSummary = styled.div`
  color: #6d7381;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
`;
