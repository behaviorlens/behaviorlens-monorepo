import styled from 'styled-components';
import {
  Button, Link, UnstyledButton
} from '../../ui';

// Styled primitives for the Session Replay workspace layout (reference:
// Figma berkay gönder 291:7276). Visual parity targets: a 78px control bar
// with Back, mode tabs, and session actions; stage chrome with Dev Tools and
// a read-only page-title chip; a stage column with a Dev Tools drawer; a
// fixed-width right rail; and a bottom replay control bar pinned to the
// stage column.

export const WORKSPACE_RAIL_WIDTH = 556;

export const WorkspaceLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 72px);
  background: #f8fafb;

  @media (max-width: 1180px) {
    height: auto;
    min-height: calc(100vh - 72px);
  }
`;

export const WorkspaceShell = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
`;

// ---------------------------------------------------------------------------
// Workspace mode tabs (Session Replay | Page Insights)
// ---------------------------------------------------------------------------

export const WorkspaceTopRow = styled.div`
  position: relative;
  z-index: 5;
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  min-height: 78px;
  padding: ${({ $overlay }) => ($overlay ? '0 20px' : '0 20px 0 10px')};
  background: #ffffff;
  border-bottom: 1px solid #e8e9ef;

  @media (max-width: 720px) {
    min-height: 50px;
    padding: 0 10px;
  }
`;

// Figma 291:7327 — chevron + visible "Back", no button chrome.
export const WorkspaceBackLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: #343c6a;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;

  svg {
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
  }

  &:hover {
    color: #0a1551;
  }

  &:focus-visible {
    outline: 2px solid #0075e3;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export const WorkspaceTopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1 1 0;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

export const WorkspaceOverlayClose = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #5b6577;
  cursor: pointer;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover {
    background: #f1f4f9;
    color: #172033;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

export const WorkspaceTopRight = styled.div`
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1 1 0;
  min-width: 0;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

export const WorkspaceActionCluster = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const WorkspaceIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border: 1px solid #d9e8ff;
  border-radius: 8px;
  background: ${({ $muted }) => ($muted ? '#f9fafc' : '#ffffff')};
  color: #0075e3;
  cursor: pointer;

  svg {
    width: ${({ $chevron }) => ($chevron ? '24px' : '16px')};
    height: ${({ $chevron }) => ($chevron ? '24px' : '16px')};
    pointer-events: none;
  }

  &:hover:not(:disabled) {
    background: #f3f8ff;
    color: #0066c3;
  }

  &:disabled {
    color: #c7c9dc;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid #0075e3;
    outline-offset: 1px;
  }
`;

export const WorkspaceActionPopover = styled.div`
  position: absolute;
  z-index: 40;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(312px, calc(100vw - 32px));
  max-height: min(70vh, 520px);
  overflow: auto;
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(13, 20, 51, 0.2);
`;

export const WorkspaceActionPopoverHeader = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-width: 0;
`;

export const WorkspaceActionPopoverBody = styled.div`
  width: 100%;
  min-width: 0;
`;

export const WorkspaceActionPopoverTitle = styled.h2`
  margin: 0;
  color: #0a1551;
  font-size: 18px;
  font-weight: 700;
  line-height: normal;
`;

export const WorkspaceActionPopoverClose = styled(UnstyledButton)`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #6f76a7;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: #0a1551;
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 2px solid #0075e3;
    outline-offset: 2px;
  }
`;

export const WorkspacePosition = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

export const WorkspaceModeTabList = styled.div`
  position: absolute;
  z-index: 3;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 22px;

  @media (max-width: 980px) {
    position: static;
    transform: none;
    gap: 24px;
  }

  @media (max-width: 560px) {
    gap: 12px;
  }
`;

// Figma 291:7321 — label with a 2px underline 11px beneath it, not a
// full-height tab with a bottom-edge rule.
export const WorkspaceModeTab = styled.button`
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  gap: 11px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  color: ${({ $active }) => ($active ? '#0075e3' : '#343c6a')};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  white-space: nowrap;

  &::after {
    content: '';
    height: 2px;
    border-radius: 2px;
    background: ${({ $active }) => ($active ? '#0075e3' : 'transparent')};
  }

  &:hover {
    color: ${({ $active, disabled }) => {
    if (disabled) return '#9ca3af';
    return $active ? '#0066c3' : '#0a1551';
  }};
  }

  &:hover::after {
    background: ${({ $active }) => ($active ? '#0066c3' : 'transparent')};
  }

  &:disabled {
    color: #9ca3af;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: -2px;
  }

  @media (max-width: 560px) {
    font-size: 13px;
  }
`;

// ---------------------------------------------------------------------------
// Stage chrome (recorded page title left, Dev Tools right)
// ---------------------------------------------------------------------------

export const ChromeBar = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  height: 40px;
  min-height: 40px;
  padding: 0 20px;
  background: transparent;

  @media (max-width: 720px) {
    height: 34px;
    min-height: 34px;
    padding: 0 10px;
  }
`;

export const ChromeSessionLink = styled(Link)`
  && {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
    flex: 0 0 auto;
    width: max-content;
    min-width: 158px;
    height: 24px;
    overflow: hidden;
    border: 1px solid #c8ceed;
    border-radius: 4px;
    padding: 0 12px;
    background: #ffffff;
    color: #343c6a;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.084px;
    line-height: 16px;
    text-decoration: none;
  }

  > span {
    white-space: nowrap;
  }

  svg {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    color: #343c6a;
  }

  &&:hover,
  &&:visited {
    color: #343c6a;
    text-decoration: none;
  }

  &&:focus-visible {
    outline: 2px solid #1463ff;
    outline-offset: 1px;
  }
`;

export const ChromeDevToolsButton = styled(UnstyledButton)`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  box-sizing: border-box;
  width: max-content;
  height: 40px;
  margin: 0;
  overflow: visible;
  padding: 0;
  border: 0;
  border-radius: 200px;
  background: transparent;
  color: ${({ $active, disabled }) => {
    if (disabled) return '#9ca3af';
    return $active ? '#0075e3' : '#343c6a';
  }};
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;

  > span {
    font-size: 14px;
  }

  &::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 1px;
    height: 2px;
    border-radius: 2px;
    background: ${({ $active }) => ($active ? '#0075e3' : 'transparent')};
  }

  &:hover {
    color: ${({ $active, disabled }) => {
    if (disabled) return '#9ca3af';
    return $active ? '#0066c3' : '#0a1551';
  }};
  }

  &:hover::after {
    background: ${({ $active }) => ($active ? '#0066c3' : 'transparent')};
  }

  &:disabled {
    background: transparent;
    color: #9ca3af;
    cursor: not-allowed;
  }

  &:disabled::after {
    background: transparent;
  }

  &:focus-visible {
    outline: 2px solid #1463ff;
    outline-offset: -2px;
  }

  svg {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
  }

  @media (max-width: 720px) {
    height: 34px;
    font-size: 14px;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

export const ChromeViewport = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  align-self: center;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;

  svg {
    width: 16px;
    height: 16px;
    color: #4b5563;
  }
`;

export const ChromeSpacer = styled.div`
  flex: 1 1 auto;
`;

// Replay-level secondary controls that sit beside Dev Tools in the chrome bar
// (currently the single-session heatmap). Deliberately quieter than the
// primary Dev Tools affordance.
export const ChromeControlGroup = styled.div`
  display: inline-flex;
  align-items: center;
  align-self: center;
  gap: 10px;
  min-width: 0;
`;

export const ChromeToggleLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #374151;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
`;

export const ChromeHeatmapFilter = styled.div`
  display: inline-flex;
  align-items: center;
  min-width: 0;

  .bl-segmented-control {
    flex-wrap: nowrap;
    align-items: center;
  }

  .bl-segmented-control label {
    height: 1.5rem;
    min-height: 1.5rem;
    padding-top: 0;
    padding-bottom: 0;
    font-size: 12px;
    line-height: 1.5rem;
  }

  .bl-segmented-control label > span {
    padding-left: 9px;
    padding-right: 9px;
  }
`;

export const ChromeDivider = styled.div`
  width: 1px;
  height: 20px;
  align-self: center;
  background: #dfe3ea;
`;

export const UrlBarRow = styled.div`
  padding: 8px 16px 10px;
  background: #f4f5f7;
  border-bottom: 1px solid #e7ecf4;
`;

export const UrlBarField = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e7ecf4;
  font-size: 13px;
  color: #374151;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;

  > svg {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    color: #1463ff;
  }

  &:hover {
    border-color: #b9cdf7;
    background: #fbfdff;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

export const UrlBarIcon = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  color: #6b7280;

  svg {
    width: 15px;
    height: 15px;
  }
`;

export const UrlBarOrigin = styled.strong`
  flex: 0 0 auto;
  color: #1f2937;
  font-weight: 700;
`;

export const UrlBarPath = styled.span`
  min-width: 0;
  overflow: hidden;
  color: #6b7280;
  font-weight: 400;
  text-overflow: ellipsis;
`;

// ---------------------------------------------------------------------------
// Workspace body: stage column + right rail
// ---------------------------------------------------------------------------

export const WorkspaceBody = styled.div`
  --behaviorlens-workspace-rail-width: ${WORKSPACE_RAIL_WIDTH}px;

  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--behaviorlens-workspace-rail-width);
  overflow: hidden;

  &:fullscreen,
  &:-webkit-full-screen {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: #f8fafb;
  }

  &:fullscreen > [role='separator'],
  &:fullscreen > [data-testid='session-insights-column'],
  &:fullscreen > [data-testid='behaviorlens-insights-rail'],
  &:fullscreen [data-testid='behaviorlens-replay-context-chrome'],
  &:-webkit-full-screen > [role='separator'],
  &:-webkit-full-screen > [data-testid='session-insights-column'],
  &:-webkit-full-screen > [data-testid='behaviorlens-insights-rail'],
  &:-webkit-full-screen [data-testid='behaviorlens-replay-context-chrome'] {
    display: none;
  }

  &:fullscreen > [data-testid='session-replay-column'],
  &:fullscreen > [data-testid='behaviorlens-insights-stage-column'],
  &:-webkit-full-screen > [data-testid='session-replay-column'],
  &:-webkit-full-screen > [data-testid='behaviorlens-insights-stage-column'] {
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  &:fullscreen .behaviorlens-workspace-stage,
  &:-webkit-full-screen .behaviorlens-workspace-stage {
    min-height: 160px;
  }

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
    overflow-y: auto;

    &:fullscreen,
    &:-webkit-full-screen {
      grid-template-rows: minmax(0, 1fr);
      overflow: hidden;
    }
  }
`;

export const StageColumn = styled.div`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: transparent;

  @media (max-width: 1180px) {
    min-height: min(70vh, 640px);
  }
`;

// The replay stage keeps a generous floor so opening the Dev Tools drawer
// shrinks it gently instead of collapsing it: the drawer is content-sized and
// capped, and rrweb's existing ResizeObserver refits the player to whatever
// height remains (aspect ratio preserved, never cropped).
export const StageArea = styled.div`
  position: relative;
  min-width: 0;
  min-height: ${({ $devToolsOpen }) => ($devToolsOpen ? '150px' : '300px')};
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  margin: 0 20px;
  border: 1px solid #e8e9ef;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f9ff;
  box-shadow: 0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04);

  @media (max-height: 760px) {
    min-height: ${({ $devToolsOpen }) => ($devToolsOpen ? '110px' : '220px')};
  }

  @media (max-width: 720px) {
    margin: 0 10px;
  }
`;

export const ReplayUpNextOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 21, 81, 0.58);
  backdrop-filter: blur(2px);
`;

export const ReplayUpNextCard = styled.div`
  width: min(420px, 100%);
  padding: 24px;
  border: 1px solid #e0e2ea;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(13, 20, 51, 0.24);
`;

export const ReplayUpNextKicker = styled.p`
  margin: 0 0 8px;
  color: #0075e3;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
`;

export const ReplayUpNextTitle = styled.h2`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #0a1551;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const ReplayUpNextMeta = styled.p`
  margin: 8px 0 0;
  overflow: hidden;
  color: #6f76a7;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ReplayUpNextActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
`;

export const ReplayUpNextButton = styled(Button)`
  && {
    width: 100%;
    min-width: 0;
  }
`;

export const ReplayTransportDock = styled.div`
  position: relative;
  /* Above Page Insights click/scroll overlays (z-index 5–9). Those overlays
    used to escape the stage stacking context and paint over Notes & Share. */
  z-index: 20;
  flex: 0 0 auto;
  background: transparent;
  isolation: isolate;
`;

// ---------------------------------------------------------------------------
// Dev Tools drawer
// ---------------------------------------------------------------------------

// A deterministic bottom dock: row count and active filters never change its
// geometry. Height is the rail-style splitter preference
// (--behaviorlens-workspace-devtools-height) in Session Replay. Page Insights
// uses the same default height without a resize handle. Only DevToolsBody
// scrolls; the header and filters remain fixed. When resizable, the top rule
// is the resize handle; otherwise it is a static 1px seam.

export const RailPreviewHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin: 14px 0 4px;
`;

export const RailPreviewTitle = styled.h4`
  margin: 0;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

export const RailPreviewLink = styled.button`
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: #1463ff;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export const RailPreviewEmpty = styled.div`
  padding: 8px 0 2px;
  color: #9ca3af;
  font-size: 12px;
`;

// ---------------------------------------------------------------------------
// Page-level loading / error / empty states
// ---------------------------------------------------------------------------

export const PageStateWrap = styled.div`
  display: grid;
  place-items: center;
  min-height: calc(100vh - 160px);
  padding: 24px;
`;

export const PageStatePanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  text-align: center;
`;

export const PageStateTitle = styled.div`
  color: #1f2937;
  font-size: 16px;
  font-weight: 700;
`;

export const PageStateBody = styled.div`
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

// ---------------------------------------------------------------------------
// Replay control bar (bottom of stage column)
// ---------------------------------------------------------------------------

export * from './ScBehaviorLensWorkspaceDevTools';
export * from './ScBehaviorLensWorkspaceControls';
export * from './ScBehaviorLensWorkspaceRail';
