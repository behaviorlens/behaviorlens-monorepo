import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Loader } from '../../ui';
import {
  IconArrowPointerClickFilled,
  IconHourglassHalfFilled,
  IconUserCheckFilled,
  IconVideoFilled
} from '../../ui/icons';
import { updateDashboardFilterSearch } from '../saved-filters/behaviorLensSavedFilters';
import { buildFilteredDashboardStats } from './behaviorLensFilteredDashboard';
import {
  AnalyticsDetailsGrid,
  AnalyticsGrid,
  ChartCard,
  ChartCardTitle,
  ChartEmptyState,
  ChartMount,
  ContentRow,
  DashboardMetricCard,
  DashboardMetricHeader,
  DashboardMetricIcon,
  DashboardMetricTitle,
  DashboardMetricValue,
  DashboardContent,
  InsightStateText,
  InsightStateTitle,
  ListMetrics,
  OverviewSection,
  PlaylistColumn,
  SESSIONS_CHART_Y_LABEL_INSET
} from './ScBehaviorLensDashboardPage';
import { FilterStatus } from './ScBehaviorLensSessionFilters';
import AudienceSnapshotCard from './AudienceSnapshotCard';
import { EMPTY_ARRAY } from '../../lib/propDefaults';

const getPathFromUrl = value => {
  if (!value) {
    return '/';
  }

  try {
    return new URL(value).pathname || '/';
  } catch (error) {
    return '/';
  }
};

const formatDuration = seconds => {
  if (seconds === null || seconds === undefined) {
    return '-';
  }

  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const numberFormatter = new Intl.NumberFormat();
const formatDashboardNumber = value => numberFormatter.format(value || 0);
const formatDashboardWholeNumber = value => {
  const numeric = Number(value);
  return formatDashboardNumber(Number.isFinite(numeric) ? Math.ceil(numeric) : 0);
};

const ChartCardBody = ({
  alignWithSessionsTitle = false,
  emptyText,
  emptyTitle,
  fillHeight = false,
  hasData,
  loading,
  loadingLabel,
  options
}) => {
  if (loading) {
    return (
      <ChartEmptyState $alignWithSessionsTitle={alignWithSessionsTitle} role="status">
        <Loader size="small" />
        <InsightStateText>{loadingLabel}</InsightStateText>
      </ChartEmptyState>
    );
  }

  if (!hasData) {
    return (
      <ChartEmptyState $alignWithSessionsTitle={alignWithSessionsTitle}>
        <InsightStateTitle>{emptyTitle}</InsightStateTitle>
        <InsightStateText>{emptyText}</InsightStateText>
      </ChartEmptyState>
    );
  }

  return (
    <ChartMount>
      <HighchartsReact
        containerProps={fillHeight ? { style: { height: '100%' } } : undefined}
        highcharts={Highcharts}
        options={options}
      />
    </ChartMount>
  );
};

ChartCardBody.propTypes = {
  alignWithSessionsTitle: PropTypes.bool,
  emptyText: PropTypes.string.isRequired,
  emptyTitle: PropTypes.string.isRequired,
  fillHeight: PropTypes.bool,
  hasData: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
  loadingLabel: PropTypes.string.isRequired,
  options: PropTypes.object.isRequired
};

const DashboardPage = ({
  error = false, loading = false, playlist = null, savedFilterMode = false, sessions = EMPTY_ARRAY
}) => {
  const history = useHistory();
  const location = useLocation();
  const stats = useMemo(() => buildFilteredDashboardStats(sessions), [sessions]);
  const totals = stats?.totals || null;
  const timeseriesOptions = useMemo(() => {
    const timeseries = stats?.timeseries || [];
    return {
      chart: {
        type: 'area',
        height: savedFilterMode ? null : 225,
        backgroundColor: 'transparent',
        spacing: savedFilterMode
          ? [0, 0, 8, 0]
          : [10, 10, 15, SESSIONS_CHART_Y_LABEL_INSET]
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: timeseries.map(point => point.day),
        lineColor: '#e8e8e8',
        tickColor: '#e8e8e8',
        labels: { style: { color: '#6d7381', fontSize: '8px' } }
      },
      yAxis: {
        title: { text: undefined },
        allowDecimals: false,
        gridLineColor: '#eef0f4',
        labels: {
          align: 'left',
          reserveSpace: true,
          x: 0,
          style: { color: '#6d7381', fontSize: '9px' }
        }
      },
      tooltip: {
        pointFormat: '<b>{point.y}</b> sessions',
        borderColor: '#0a1551',
        borderRadius: 6
      },
      plotOptions: {
        area: {
          color: '#3f83f8', fillOpacity: 0.12, marker: { enabled: false }, lineWidth: 1.5
        }
      },
      series: [{ name: 'Sessions', data: timeseries.map(point => point.total) }]
    };
  }, [savedFilterMode, stats]);

  const topPages = stats?.topPages || [];
  const hasTimeseries = (stats?.timeseries || []).length > 0;
  const hasTopPages = topPages.length > 0;
  const topPagesOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: savedFilterMode ? null : 214,
      backgroundColor: 'transparent',
      spacing: savedFilterMode ? [0, 0, 4, 0] : [4, 0, 2, 0]
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: topPages.map(item => getPathFromUrl(item.url)),
      lineWidth: 0,
      tickWidth: 0,
      labels: { style: { color: '#0a1551', fontSize: '8px' } }
    },
    yAxis: {
      title: { text: undefined },
      allowDecimals: false,
      gridLineColor: '#eef0f4',
      labels: { style: { color: '#6d7381', fontSize: '8px' } }
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b> sessions',
      borderColor: '#0a1551',
      borderRadius: 6
    },
    plotOptions: {
      series: {
        color: '#0474e4',
        cursor: 'pointer',
        pointWidth: 9,
        point: {
          events: {
            click(event) {
              const clicked = topPages[event.point.index];
              if (!clicked) {
                return;
              }
              const params = updateDashboardFilterSearch(
                location.search,
                'sitePath',
                getPathFromUrl(clicked.url)
              );
              history.push({
                pathname: '/app',
                search: `?${params.toString()}`
              });
            }
          }
        }
      }
    },
    series: [{ name: 'Sessions', data: topPages.map(item => item.sessions) }]
  }), [history, location.search, savedFilterMode, topPages]);

  return (
    <>
      <ListMetrics>
        <DashboardMetricCard>
          <DashboardMetricHeader>
            <DashboardMetricTitle>Total Sessions</DashboardMetricTitle>
            <DashboardMetricIcon $tone="total" $glyphSize={20}><IconVideoFilled aria-hidden="true" /></DashboardMetricIcon>
          </DashboardMetricHeader>
          <DashboardMetricValue>
            {loading ? '-' : formatDashboardNumber(totals?.total ?? 0)}
          </DashboardMetricValue>
        </DashboardMetricCard>
        <DashboardMetricCard>
          <DashboardMetricHeader>
            <DashboardMetricTitle>Live Sessions</DashboardMetricTitle>
            <DashboardMetricIcon $tone="active" $glyphSize={20}><IconUserCheckFilled aria-hidden="true" /></DashboardMetricIcon>
          </DashboardMetricHeader>
          <DashboardMetricValue>
            {loading ? '-' : formatDashboardNumber(totals?.active ?? 0)}
          </DashboardMetricValue>
        </DashboardMetricCard>
        <DashboardMetricCard>
          <DashboardMetricHeader>
            <DashboardMetricTitle>Avg. Events Per Session</DashboardMetricTitle>
            <DashboardMetricIcon $tone="events" $glyphSize={20}><IconArrowPointerClickFilled aria-hidden="true" /></DashboardMetricIcon>
          </DashboardMetricHeader>
          <DashboardMetricValue>
            {loading ? '-' : formatDashboardWholeNumber(totals?.avg_event_count ?? 0)}
          </DashboardMetricValue>
        </DashboardMetricCard>
        <DashboardMetricCard>
          <DashboardMetricHeader>
            <DashboardMetricTitle>Avg. Duration</DashboardMetricTitle>
            <DashboardMetricIcon $tone="duration" $glyphSize={20}><IconHourglassHalfFilled aria-hidden="true" /></DashboardMetricIcon>
          </DashboardMetricHeader>
          <DashboardMetricValue>{loading ? '-' : formatDuration(totals?.avg_duration_s)}</DashboardMetricValue>
        </DashboardMetricCard>
      </ListMetrics>

      {error && (
        <FilterStatus $error role="alert">Dashboard statistics could not be loaded.</FilterStatus>
      )}

      <DashboardContent
        $savedFilterMode={savedFilterMode}
        data-behaviorlens-dashboard-content=""
      >
        <ContentRow>
          <PlaylistColumn>{playlist}</PlaylistColumn>
        </ContentRow>

        <OverviewSection>
          <AnalyticsGrid>
            <ChartCard
              $area="sessions"
              $empty={loading || !hasTimeseries}
              $savedFilterMode={savedFilterMode}
            >
              <ChartCardTitle>
                {savedFilterMode ? 'Sessions Overtime' : 'Sessions Over Time'}
              </ChartCardTitle>
              <ChartCardBody
                alignWithSessionsTitle={!savedFilterMode}
                emptyText="No sessions match the current filters."
                emptyTitle="No session activity"
                fillHeight={savedFilterMode}
                hasData={hasTimeseries}
                loading={loading}
                loadingLabel="Loading Sessions Over Time..."
                options={timeseriesOptions}
              />
            </ChartCard>
            {savedFilterMode && (
              <ChartCard $area="pages" $empty={loading || !hasTopPages} $savedFilterMode>
                <ChartCardTitle>Top Pages</ChartCardTitle>
                <ChartCardBody
                  emptyText="No recorded pages for the filtered sessions."
                  emptyTitle="No page data"
                  fillHeight
                  hasData={hasTopPages}
                  loading={loading}
                  loadingLabel="Loading Top Pages..."
                  options={topPagesOptions}
                />
              </ChartCard>
            )}
          </AnalyticsGrid>

          {!savedFilterMode && (
          <AnalyticsDetailsGrid>
            <ChartCard $area="pages" $empty={loading || !hasTopPages}>
              <ChartCardTitle>Top Pages</ChartCardTitle>
              <ChartCardBody
                emptyText="No recorded pages for the filtered sessions."
                emptyTitle="No page data"
                hasData={hasTopPages}
                loading={loading}
                loadingLabel="Loading Top Pages..."
                options={topPagesOptions}
              />
            </ChartCard>
            <AudienceSnapshotCard loading={loading} sessions={sessions} />
          </AnalyticsDetailsGrid>
          )}
        </OverviewSection>
      </DashboardContent>
    </>
  );
};

DashboardPage.propTypes = {
  error: PropTypes.bool,
  loading: PropTypes.bool,
  playlist: PropTypes.node,
  savedFilterMode: PropTypes.bool,
  sessions: PropTypes.array
};

export default DashboardPage;
