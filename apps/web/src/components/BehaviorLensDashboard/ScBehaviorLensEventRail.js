import styled from 'styled-components';

// Styled primitives for the Session Replay right rail (reference:
// page-views-for-developing/session-replay.png).

export const RAIL_SURFACE = '#f5f9ff';

export const RailRoot = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  padding: 0 24px 8px;
  border: 1px solid #e8e9ef;
  background: ${({ $view }) => {
    if ($view === 'sessionSummary') {
      return '#fff8f1';
    }
    if ($view === 'aiSummary') {
      return '#faf7ff';
    }
    return RAIL_SURFACE;
  }};

  @media (max-width: 1180px) {
    min-height: 640px;
  }
`;

// Grey strip above the session card: Autoplay + Recent Sessions on the left,
// the ‹ N of M › pager on the right.
export const RailNavHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-height: 46px;
  padding: 0 14px;
  background: #f4f5f7;
  border-bottom: 1px solid #e7ecf4;
  font-size: 13px;
  color: #6b7280;
`;

export const RailNavAutoplay = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: #1f2937;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;

  span {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  svg {
    width: 17px;
    height: 17px;
    color: ${({ $on }) => ($on ? '#1463ff' : '#9ca3af')};
  }

  &:hover span {
    color: #1463ff;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export const RailNavLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RailNavSpacer = styled.div`
  flex: 1 1 auto;
`;

export const RailNavPager = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 13px;
  white-space: nowrap;
`;

export const RailNavArrow = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin: 0;
  border: 0;
  padding: 0;
  border-radius: 6px;
  background: transparent;
  color: #1463ff;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background: #eaf1ff;
  }

  &:disabled {
    color: #d1d5db;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }
`;

// Compact session context. No decorative map is rendered because the replay
// payload has no coordinates; the card keeps the usable space for metadata.
export const RailSessionContext = styled.div`
  position: relative;
  flex: 0 0 auto;
  margin-bottom: 10px;
  padding-top: 12px;
  overflow: visible;
`;

// Elevated white session card, matching the reference's identity block.
export const RailSessionCard = styled.div`
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  margin: 0 12px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(16, 24, 40, 0.10), 0 0 1px rgba(16, 24, 40, 0.18);
  padding: 14px 14px 12px;
`;

export const RailCardTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const RailCardName = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  color: #1463ff;
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RailCardActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
`;

export const RailCardLine = styled.div`
  margin-top: 5px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong {
    color: #1f2937;
    font-weight: 700;
  }
`;

export const RailCardDisclosure = styled.button`
  margin: 7px 0 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: #1f2937;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: #1463ff;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export const RailCardDetails = styled.dl`
  margin: 9px 0 0;
  border-top: 1px solid #f0f1f3;
  padding-top: 7px;
  font-size: 12px;

  div {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 8px;
    padding: 3px 0;
  }

  dt {
    color: #9ca3af;
    font-weight: 600;
  }

  dd {
    margin: 0;
    color: #1f2937;
    overflow-wrap: anywhere;
  }
`;

// Filter events + Event types row.
export const RailFilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  margin-top: 12px;
  border-top: 1px solid #eef0f3;
  padding: 12px 0 0;

  @media (max-width: 520px) {
    align-items: stretch;
    flex-direction: column;

    > div,
    > button {
      width: 100%;
    }
  }
`;

export const RailSessionTools = styled.div`
  display: flex;
  gap: 6px;
`;

export const RailSessionToolsAnchor = styled.div`
  position: relative;
  margin-top: 10px;
`;

export const RailSessionToolButton = styled.button`
  flex: 1 1 0;
  min-width: 0;
  border: 1px solid #e1e5ec;
  border-radius: 7px;
  padding: 6px 7px;
  overflow: hidden;
  background: ${({ $active }) => ($active ? '#eaf1ff' : '#f7f8fa')};
  color: ${({ $active }) => ($active ? '#1463ff' : '#465164')};
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover { border-color: #b9cdf7; background: #fff; color: #1463ff; }
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 1px; }
`;

export const RailToolPopover = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  left: ${({ $tool }) => ($tool === 'review' ? '0' : '50%')};
  width: ${({ $tool }) => ($tool === 'review' ? '100%' : 'min(280px, 100%)')};
  max-height: min(55vh, 360px);
  border: 1px solid #dfe5ee;
  border-radius: 10px;
  padding: ${({ $tool }) => ($tool === 'review' ? '12px' : '6px')};
  overflow: visible;
  background: #ffffff;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08);
  transform: ${({ $tool }) => ($tool === 'review' ? 'none' : 'translateX(-50%)')};

  &::before {
    content: '';
    position: absolute;
    top: -7px;
    left: ${({ $tool }) => ($tool === 'review' ? 'calc(16.667% - 2px)' : '50%')};
    width: 12px;
    height: 12px;
    border-top: 1px solid #dfe5ee;
    border-left: 1px solid #dfe5ee;
    background: #ffffff;
    transform: translateX(-50%) rotate(45deg);
  }
`;

export const RailInlinePanel = styled.div`
  max-height: min(38vh, 320px);
  margin-top: 10px;
  border: ${({ $frameless }) => ($frameless ? '0' : '1px solid #e5e9f0')};
  border-radius: ${({ $frameless }) => ($frameless ? '0' : '9px')};
  padding: ${({ $frameless }) => ($frameless ? '0' : '12px')};
  overflow-y: auto;
  overscroll-behavior: contain;
  background: ${({ $frameless }) => ($frameless ? 'transparent' : '#fbfcfe')};

`;

export const RailInlineHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
`;

export const RailInlineClose = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin: 0;
  border: 0;
  border-radius: 6px;
  padding: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;

  svg { width: 14px; height: 14px; }
  &:hover { background: #edf2f7; color: #1f2937; }
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 1px; }
`;

export const RailFilterSearch = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid #e7ecf4;
  border-radius: 8px;
  padding: 8px 11px;
  background: #f4f5f7;
  color: #1f2937;
  font-family: inherit;
  font-size: 13px;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #1463ff;
    background: #ffffff;
  }
`;

export const RailEventTypesButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  margin: 0;
  border: 1px solid #dfe3ea;
  border-radius: 8px;
  padding: 8px 11px;
  background: #ffffff;
  color: #1f2937;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;

  @media (max-width: 520px) {
    justify-content: center;
  }

  svg {
    width: 15px;
    height: 15px;
    color: #6b7280;
  }

  &:hover {
    border-color: #c3cad6;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

export const RailEventTypesCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #1463ff;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
`;

export const RailEventTypesPanel = styled.div`
  position: absolute;
  z-index: 20;
  right: 14px;
  top: calc(100% + 6px);
  width: 232px;
  max-width: calc(100vw - 24px);
  max-height: min(440px, calc(100vh - 32px));
  border: 1px solid #e7ecf4;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.16);
  padding: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;

  @media (max-width: 520px) {
    right: 0;
    width: min(280px, calc(100vw - 36px));
  }
`;

export const RailEventTypesHeader = styled.div`
  position: sticky;
  z-index: 2;
  top: -8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: -8px -8px 4px;
  border-bottom: 1px solid #eef0f3;
  padding: 10px 10px 8px;
  background: #ffffff;
  color: #1f2937;
  font-size: 12px;
`;

export const RailEventTypesClose = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  border: 0;
  border-radius: 6px;
  padding: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  svg { width: 13px; height: 13px; }
  &:hover { background: #eef2f7; color: #1f2937; }
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 1px; }
`;

export const RailEventTypesOption = styled.label`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 8px;
  border-radius: 6px;
  color: #1f2937;
  cursor: pointer;
  font-size: 13px;

  > small {
    margin-left: auto;
    color: #8791a2;
    font-size: 11px;
  }

  &:hover {
    background: #f4f6f8;
  }
`;

export const RailEventTypesActions = styled.div`
  position: sticky;
  z-index: 2;
  bottom: -8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  border-top: 1px solid #eef0f3;
  padding: 10px 8px 8px;
  background: #ffffff;
`;

export const RailEventTypesClear = styled.button`
  margin: 0;
  border: 0;
  padding: 6px 4px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  &:hover { color: #1463ff; }
`;

export const RailEventTypesApply = styled.button`
  margin: 0;
  border: 0;
  border-radius: 6px;
  padding: 7px 14px;
  background: #1463ff;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  &:hover { background: #0f56d6; }
  &:disabled { cursor: not-allowed; opacity: 0.55; }
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 2px; }
`;

export const RailFilterAnchor = styled.div`
  position: relative;
  flex: 0 0 auto;
`;

// The event stream is the rail's dominant content and the only scrolling part.
export const RailEventStream = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px 16px;

  @media (max-width: 1180px) {
    max-height: none;
    overflow: visible;
  }
`;

export const RailStreamEmpty = styled.div`
  padding: 22px 14px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
`;

// Secondary rail views (Review, Tags, Session Insights) reached from the
// session card's overflow menu. They replace the stream temporarily so the
// default layout keeps the reference silhouette.
export const RailSecondaryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-height: 46px;
  padding: 0 10px 0 6px;
  border-bottom: 1px solid #eceef1;
`;

export const RailBackButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  border: 0;
  padding: 0;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  cursor: pointer;

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover {
    background: #f1f3f5;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }
`;

export const RailSecondaryTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
`;

export const RailSecondaryBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px 20px;
`;

const RAIL_VIEW_ACCENTS = {
  activityLog: '#4276ff',
  aiSummary: '#8b5cf6'
};

const railViewAccent = (view, accent) => (
  accent || RAIL_VIEW_ACCENTS[view] || RAIL_VIEW_ACCENTS.activityLog
);

export const RailViewTabs = styled.div`
  display: flex;
  align-items: flex-start;
  flex: 0 0 auto;
  width: 100%;
  height: 73px;
  border-bottom: 1px solid #e8e9ef;
`;

export const RailViewTab = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
  height: 72px;
  margin: 0;
  border: 0;
  padding: 16px 0;
  background: transparent;
  color: ${({ $accent, $active, $view }) => (
    $active ? railViewAccent($view, $accent) : '#6f76a7'
  )};
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;

  svg {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
  }

  &::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    background: ${({ $accent, $active, $view }) => (
    $active ? railViewAccent($view, $accent) : 'transparent'
  )};
  }

  &:focus-visible {
    outline: 2px solid ${({ $accent, $view }) => railViewAccent($view, $accent)};
    outline-offset: -2px;
  }
`;

export const RailMain = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  min-height: 0;
  margin-top: 16px;
`;

export const RailActivityView = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  > [data-testid='behaviorlens-rail-header'] + div {
    margin-top: 8px;
  }

  > section {
    flex: 1 1 auto;
    min-height: 0;
    margin-top: 8px;
  }
`;

export const RailActivityDivider = styled.div`
  flex: 0 0 auto;
  width: 100%;
  height: 1px;
  background: #e8e9ef;
`;

export const RailCard = styled.section`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  box-sizing: border-box;
  width: calc(100% - 1px);
  height: auto;
  min-width: 0;
  min-height: 0;
  padding: ${({ $tone }) => ($tone === 'activityLog' ? '24px 20px' : '16px 20px')};
  overflow: hidden;
  border: 1px solid ${({ $tone }) => (
    $tone === 'sessionSummary' ? '#fbd4a5' : $tone === 'aiSummary' ? '#e8d8ff' : '#d9e8ff'
  )};
  border-radius: 12px;
  background: ${({ $tone }) => ($tone === 'activityLog' ? RAIL_SURFACE : '#ffffff')};
  box-shadow: 0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04);
`;

export const RailCardTitle = styled.h2`
  margin: 0 0 16px;
  color: #6f76a7;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
`;

export const RailSearchRow = styled.div`
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  height: 32px;
  margin-bottom: 16px;
  overflow: visible;

  > svg {
    position: absolute;
    top: 50%;
    left: 8px;
    width: 16px;
    height: 16px;
    color: #6f76a7;
    transform: translateY(-50%);
    pointer-events: none;
  }
`;

export const RailEventSearch = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 0 12px 0 30px;
  border: 1px solid #c7c9dc;
  border-radius: 4px;
  color: #0a1551;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  background: #ffffff;
  outline-width: 2px;
  outline-style: solid;
  outline-color: transparent;
  outline-offset: 0;
  transition: border-color 120ms ease, outline-color 120ms ease;

  &::placeholder {
    color: #6f76a7;
  }

  &:hover:not(:focus):not(:focus-visible) {
    border-color: #979dc6;
  }

  &:focus,
  &:focus-visible {
    border-color: #0075e3;
    outline-color: rgba(119, 207, 255, 0.5);
  }
`;

export const RailLogStream = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
`;

export const RailLogViewport = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
`;

export const RailLogFade = styled.div`
  position: absolute;
  z-index: 1;
  right: 0;
  ${({ $edge }) => ($edge === 'top' ? 'top: 0;' : 'bottom: 0;')}
  left: 0;
  height: 24px; opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
  background: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, rgba(245, 249, 255, 0.72), rgba(245, 249, 255, 0))'
    : 'linear-gradient(to bottom, rgba(245, 249, 255, 0), rgba(245, 249, 255, 0.72))')};
  mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.72) 35%, rgba(0, 0, 0, 0.25) 72%, transparent 100%)'
    : 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.25) 28%, rgba(0, 0, 0, 0.72) 65%, #000 100%)')};
  backdrop-filter: blur(2px);
  -webkit-mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.72) 35%, rgba(0, 0, 0, 0.25) 72%, transparent 100%)'
    : 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.25) 28%, rgba(0, 0, 0, 0.72) 65%, #000 100%)')};
  -webkit-backdrop-filter: blur(2px);
  transition: none;
`;

export const RailLogRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 36px;
  min-height: 36px;
  margin: 0;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#eef4ff' : 'transparent')};
  color: #0a1551;
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:hover {
    background: #f5f9ff;
  }

  &:focus-visible {
    outline: 2px solid #0075e3;
    outline-offset: -2px;
  }
`;

export const RailLogLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #0a1551;

  svg {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
    color: ${({ $rage }) => ($rage ? '#DC2626' : '#0a1551')};
  }
`;

export const RailLogText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const RailLogPrimary = styled.span`
  overflow: hidden;
  color: #0a1551;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RailLogTime = styled.span`
  flex: 0 0 auto;
  color: #6f76a7;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

export * from './ScBehaviorLensEventRailSummary';
