import styled, { css } from 'styled-components';
import { Card, CardTitle } from '../workspace/ScBehaviorLensDashboard';

const dashboardCardShadow = '0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04)';
const dashboardPanelBorderColor = '#e5eaf5';

// Sessions Over Time title and y-axis numbers share this inset from the chart mount.
export const SESSIONS_CHART_Y_LABEL_INSET = 19;

export const ListMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  /* Figma Page Content 460:20550 column gap — also toolbar-to-KPI with no chips. */
  margin-top: 16px;
  margin-bottom: 16px;

  @media (max-width: 1240px) {
    grid-template-columns: repeat(3, minmax(170px, 1fr));
    gap: 12px;
  }

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
`;

export const DashboardMetricCard = styled.div`
  position: relative;
  min-width: 0;
  height: 88px;
  min-height: 88px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  padding: 8px 8px 8px 16px;
  border: 1px solid #e5eaf5;
  border-radius: 8px;
  background: #fefeff;
  box-shadow: ${dashboardCardShadow};

  @media (max-width: 1240px) {
    height: auto;
    min-height: 88px;
  }

  @media (max-width: 560px) {
    padding: 8px 14px;
  }
`;

export const DashboardMetricHeader = styled.div`
  display: flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 1240px) {
    flex: 0 0 auto;
    height: auto;
    min-height: 32px;
  }
`;

export const DashboardMetricTitle = styled.div`
  min-width: 0;
  color: #6c73a8;
  font-size: 14px;
  font-weight: 700;
  line-height: 24px;
  letter-spacing: -0.154px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 1240px) {
    white-space: normal;
    line-height: 1.3;
  }
`;

export const DashboardMetricValue = styled.div`
  flex: 0 0 auto;
  color: #0a1551;
  font-size: 32px;
  font-weight: 500;
  line-height: 30.894px;
  letter-spacing: -0.352px;
  font-variant-numeric: tabular-nums;
`;

const dashboardMetricIconTone = {
  total: { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
  active: { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
  duration: { background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' },
  events: { background: 'rgba(249, 115, 22, 0.2)', color: '#f97316' }
};

export const DashboardMetricIcon = styled.span`
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: ${({ $tone }) => dashboardMetricIconTone[$tone].color};
  background: ${({ $tone }) => dashboardMetricIconTone[$tone].background};

  svg {
    width: ${({ $glyphSize }) => $glyphSize}px;
    height: ${({ $glyphSize }) => $glyphSize}px;
  }
`;

// Supporting copy under the selected Saved Filter title in the shell.
// Keep this slot in both modes so selecting a sidebar filter does not drop
// the Search / Filters / Sorted by row.
export const PageIntro = styled.div`
  /* Pull the supporting copy 8px closer to the shell title. Toolbar keeps
     its own 16px top margin, matching toolbar → Active Filters spacing. */
  margin: -8px 0 0;
  min-height: 16.8px;
`;

export const PageIntroSubtitle = styled.span`
  display: block;
  color: #6f76a7;
  font-size: 14px;
  line-height: 1.2;
`;

export const SectionHeading = styled.h2`
  margin: 0 0 16px;
  color: #0a1551;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
`;

export const ContentRow = styled.div`
  min-width: 0;
  margin-bottom: 16px;
`;

export const PlaylistColumn = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

export const OverviewSection = styled.div`
  .highcharts-contextmenu {
    max-height: calc(100% - 8px);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .highcharts-contextmenu::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
`;

export const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "sessions";
  gap: 16px;
  align-items: stretch;
  margin-bottom: 16px;

  @media (max-width: 720px) {
    gap: 12px;
  }
`;

// Top Pages and Audience Snapshot, side by side.
export const AnalyticsDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;

  /* ChartCard sets grid-area from $area; "&&" outranks it so both cards
     sit in normal order instead of an implicit named column. */
  && > * {
    grid-area: auto;
  }

  @media (max-width: 1120px) {
    grid-template-columns: minmax(0, 1fr);
  }

  @media (max-width: 720px) {
    gap: 12px;
  }
`;

export const DashboardContent = styled.div`
  display: contents;

  ${({ $savedFilterMode }) => $savedFilterMode && css`
    display: grid;
    grid-template-columns: minmax(0, 622fr) minmax(320px, 466fr);
    grid-template-areas:
      "charts charts"
      "playlist playlist";
    gap: 16px;
    align-items: stretch;

    ${OverviewSection},
    ${AnalyticsDetailsGrid} {
      display: contents;
    }

    ${ContentRow} {
      grid-area: playlist;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      margin-bottom: 0;
      overflow: hidden;
      contain: size;
    }

    ${PlaylistColumn} {
      flex: 1 1 auto;
      height: 100%;
      min-height: 0;
    }

    ${AnalyticsGrid} {
      grid-area: charts;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas: "sessions pages";
      height: 299px;
      margin-bottom: 0;
    }

    @media (max-width: 1120px) {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "charts"
        "playlist";

      ${ContentRow} {
        overflow: visible;
        contain: none;
      }

      ${AnalyticsGrid} {
        height: auto;
        grid-template-columns: minmax(0, 1fr);
        grid-template-areas:
          "sessions"
          "pages";
      }
    }

    @media (max-width: 720px) {
      gap: 12px;
    }
  `}
`;

export const ChartCardTitle = styled(CardTitle)`
  margin-bottom: 0;
  color: #6c73a8;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  letter-spacing: -0.176px;
  text-transform: uppercase;
`;

export const ChartCard = styled(Card)`
  grid-area: ${({ $area }) => $area || 'auto'};
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: ${({ $area }) => (
    $area === 'sessions' ? '24px 1px 0' : '24px 18px 12px 24px'
  )};
  border-color: ${dashboardPanelBorderColor};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background: #fefeff;
  box-shadow: ${dashboardCardShadow};

  ${({ $area }) => $area === 'sessions' && 'min-height: 291px;'}
  ${({ $area }) => $area === 'pages' && 'min-height: 286px;'}

  ${({ $savedFilterMode }) => $savedFilterMode && css`
    height: 299px;
    min-height: 299px;
    padding: 16px 24px 24px 16px;

    ${ChartCardTitle} {
      margin: 0 0 16px;
      margin-left: 0;
    }

    > :last-child {
      flex: 1 1 auto;
      min-height: 0;
    }

    > [data-chart-mount] {
      margin-left: 8px;
    }
  `}

  ${({ $savedFilterMode, $area }) => !$savedFilterMode && css`
    ${ChartCardTitle} {
      margin-bottom: ${$area === 'sessions' ? '18px' : '0'};
      margin-left: ${$area === 'sessions' ? `${SESSIONS_CHART_Y_LABEL_INSET}px` : '0'};
    }
  `}

  ${({ $empty, $area, $savedFilterMode }) => (
    $empty && !$savedFilterMode && $area === 'pages' && css`
      ${ChartCardTitle} {
        margin-bottom: 16px;
      }
    `
  )}

  @media (max-width: 720px) {
    padding: 12px 14px;
  }
`;

export const AudienceCard = styled(Card)`
  box-sizing: border-box;
  min-width: 0;
  min-height: 226px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 20px 20px 24px;
  border-color: ${dashboardPanelBorderColor};
  border-radius: 12px;
  background: #ffffff;
  box-shadow: ${dashboardCardShadow};

  ${ChartCardTitle} {
    margin-bottom: 16px;
  }

  @media (max-width: 720px) {
    min-height: 0;
    padding: 16px;
  }
`;

export const AudienceState = styled.span`
  display: block;
  margin-top: 16px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
`;

export const AudienceColumns = styled.div`
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  gap: 16px;
  min-width: 0;

  @media (max-width: 620px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const AudienceColumn = styled.div`
  min-width: 0;
`;

export const AudienceDivider = styled.div`
  align-self: stretch;
  width: 1px;
  margin-bottom: 40px;
  background: #eef2fa;

  @media (max-width: 620px) {
    display: none;
  }
`;

export const AudienceGroupTitle = styled.div`
  margin-bottom: 12px;
  color: #6c73a8;
  font-size: 11px;
  font-weight: 500;
  line-height: 14px;
  letter-spacing: 0.22px;
  text-transform: uppercase;
`;

export const AudienceItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const AudienceItemRow = styled.div`
  min-width: 0;
`;

export const AudienceItemTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  color: #091141;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  font-variant-numeric: tabular-nums;

  strong {
    flex: 0 0 auto;
    font-weight: 500;
  }
`;

export const AudienceItemLabel = styled.span`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #252d5b;

  > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const AudienceItemIcon = styled.span`
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  display: inline-flex;

  img {
    display: block;
    width: 16px;
    height: 16px;
  }
`;

export const AudienceProgress = styled.div`
  width: 100%;
  height: 4px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: #eef2fa;
`;

export const AudienceProgressBar = styled.div`
  width: ${({ $value }) => `${Math.min(100, Math.max(0, $value || 0))}%`};
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
`;

export const InsightCardState = styled.div`
  flex: ${({ $pinToTitle }) => ($pinToTitle ? '0 0 auto' : '1 1 auto')};
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: ${({ $pinToTitle }) => ($pinToTitle ? 'flex-start' : 'center')};
  gap: 8px;
  color: #64748b;
`;

export const InsightStateTitle = styled.strong`
  color: #20366e;
  font-size: 14px;
`;

export const InsightStateText = styled.span`
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
`;

export const ChartEmptyState = styled(InsightCardState).attrs({ $pinToTitle: true })`
  margin-left: ${({ $alignWithSessionsTitle }) => (
    $alignWithSessionsTitle ? `${SESSIONS_CHART_Y_LABEL_INSET}px` : '0'
  )};
`;

export const ChartMount = styled.div.attrs({ 'data-chart-mount': '' })`
  width: 100%;
  min-width: 0;
  min-height: 214px;

  > div,
  .highcharts-container {
    max-width: 100%;
  }

  .highcharts-container {
    width: 100% !important;
    font-family: inherit !important;
  }
`;

export const ChartHint = styled.div`
  margin-top: 4px;
  font-size: 11px;
  line-height: 16px;
  color: #9ca3af;
`;
