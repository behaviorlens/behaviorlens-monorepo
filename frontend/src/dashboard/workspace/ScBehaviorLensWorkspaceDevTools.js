import styled from 'styled-components';

export const DevToolsDrawerWrap = styled.div`
  position: relative;
  z-index: 4;
  flex: 0 0 var(--behaviorlens-workspace-devtools-height, 270px);
  display: flex;
  flex-direction: column;
  height: var(--behaviorlens-workspace-devtools-height, 270px);
  min-height: 0;
  overflow: visible;
  border-top: ${({ $resizable }) => ($resizable ? '0' : '1px solid #dfe5ee')};
  background: #ffffff;
`;

export const DevToolsHeader = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  min-width: 0;
  border-bottom: 1px solid #eceef1;
  background: #ffffff;
`;

export const DevToolsTabRow = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
  gap: 4px;
  padding: 0 16px;
`;

export const DevToolsTab = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 9px 8px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: ${({ $active }) => ($active ? '#0075e3' : '#343c6a')};
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
    color: inherit;
  }

  &::after {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: -1px;
    height: 2px;
    background: ${({ $active }) => ($active ? '#0075e3' : 'transparent')};
  }

  &:hover {
    color: ${({ $active }) => ($active ? '#0066c3' : '#0a1551')};
  }

  &:hover::after {
    background: ${({ $active }) => ($active ? '#0066c3' : 'transparent')};
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: -2px;
  }
`;

export const DevToolsFilterRow = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: #ffffff;
`;

export const DevToolsFilterSpacer = styled.div`
  flex: 1 1 auto;
`;

export const DevToolsChipGroup = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

// Reference filter/search field on the right of the chip row; disabled until
// telemetry exists.
export const DevToolsSearchField = styled.input`
  width: min(240px, 30%);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 11px;
  background: #f8f9fa;
  color: #1f2937;
  font-family: inherit;
  font-size: 13px;

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

// Reference filter chips: fully rounded pills, near-black fill when active.
// In the shell they are rendered disabled because there is no telemetry to
// filter yet.
export const DevToolsFilterChip = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  border: 0;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#1f2937' : '#f0f2f5')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#9ca3af')};
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  font-family: inherit;

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }
`;

export const DevToolsBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
  overflow: auto;
  overscroll-behavior: contain;
`;

// Compact, single-line-first unavailable state: icon, one truthful sentence,
// one short explanation. Sized so the drawer stays short.
export const DevToolsEmptyState = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 520px;
  color: #6b7280;
  font-size: 12.5px;
  line-height: 1.45;
  text-align: left;

  svg {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    margin-top: 1px;
    color: #9ca3af;
  }
`;

export const DevToolsEmptyTitle = styled.div`
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
`;

export const DevToolsTelemetryList = styled.div`
  width: 100%;
  min-width: 760px;
  color: #344054;
  font-size: 12px;
`;

export const DevToolsGroupLabel = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 6px 14px;
  border-top: 1px solid #f0f2f5;
  border-bottom: 1px solid #e7ecf4;
  background: #f8f9fb;
  color: #667085;
  font-weight: 700;
`;

export const DevToolsTelemetryRow = styled.button`
  display: grid;
  grid-template-columns: 62px 74px minmax(240px, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  border: 0;
  border-bottom: 1px solid #f0f2f5;
  padding: 7px 14px;
  background: ${({ $level }) => ($level === 'error' || $level === 'exception' ? '#fff5f5' : ($level === 'warning' ? '#fffbeb' : '#ffffff'))};
  color: #344054;
  cursor: pointer;
  font: inherit;
  text-align: left;

  small {
    color: #7b8492;
  }

  &:hover {
    background: #f4f7fb;
  }
`;

export const DevToolsTimestamp = styled.span`
  color: #7b8492;
  font-variant-numeric: tabular-nums;
`;

export const DevToolsLevel = styled.span`
  color: ${({ $level }) => ($level === 'error' || $level === 'exception' ? '#c62828' : ($level === 'warning' ? '#a45c00' : '#1463ff'))};
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
`;

export const DevToolsNetworkGrid = styled.div`
  position: sticky;
  top: 29px;
  z-index: 1;
  display: grid;
  grid-template-columns: 58px 54px minmax(160px, 1fr) 70px minmax(260px, 1.4fr);
  gap: 10px;
  padding: 6px 14px;
  border-bottom: 1px solid #e7ecf4;
  color: #8a94a4;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  background: #ffffff;
`;

export const DevToolsNetworkRow = styled.button`
  display: grid;
  grid-template-columns: 58px 54px minmax(160px, 1fr) 70px minmax(260px, 1.4fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  border: 0;
  border-bottom: 1px solid #f0f2f5;
  padding: 7px 14px;
  background: #ffffff;
  color: #475467;
  cursor: pointer;
  font: inherit;
  text-align: left;

  > strong {
    color: #168447;
  }

  > span:nth-child(3) {
    overflow: hidden;
    color: #1f2937;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: #f4f7fb;
  }
`;

export const DevToolsWaterfall = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  small {
    flex: 0 0 auto;
    min-width: 48px;
    color: #667085;
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }
`;

export const DevToolsWaterfallTrack = styled.span`
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: 18px;
  overflow: hidden;
  background-image: linear-gradient(90deg, rgba(209, 213, 219, 0.5) 1px, transparent 1px);
  background-size: 20% 100%;
`;

export const DevToolsWaterfallBar = styled.span`
  position: absolute;
  left: ${({ $left }) => `${Math.max(0, Math.min(100, $left))}%`};
  top: 5px;
  width: ${({ $width }) => `${Math.max(2, Math.min(100, $width))}%`};
  height: 8px;
  border-radius: 2px;
  background: #5abf79;
`;

// Small "recent activity" preview shown on the Session tab. It is a shortcut
// into the full Activity tab, not a duplicate of it.
