import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  RailPreviewEmpty,
  RailPreviewHeader,
  RailPreviewLink,
  RailPreviewTitle
} from './ScBehaviorLensWorkspace';
import {
  RailToolbar,
  EventSearch,
  MetricsGrid,
  MetricCard,
  MetricTitle,
  MetricValue,
  MetricSub,
  FrustrationBadge,
  SparklineLabel,
  SparklineMount,
  CategoryChips,
  CategoryChip,
  MetaRow,
  MetaKey,
  MetaValue,
  EventsList,
  EventItem,
  EventIcon,
  EventLabel,
  EventTag,
  EventTime,
  Placeholder
} from './ScBehaviorLensDashboard';
import { EventTypeIcon } from './behaviorLensEvents';
import { formatReplayTimestamp } from './behaviorLensNoteTimestamps';
import { HEATMAP_VIEW_HEATMAP } from './behaviorLensHeatmap';
import {
  SessionLabelsPanel,
  SessionNotesPanel
} from './SessionReviewMetadataPanel';
import SessionReviewQueuePanel from './SessionReviewQueuePanel';
import CollapsibleInsightCard from './CollapsibleInsightCard';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'click', label: 'Clicks' },
  { value: 'rage', label: 'Rage' },
  { value: 'input', label: 'Inputs' },
  { value: 'scroll', label: 'Scrolls' },
  { value: 'selection', label: 'Selections' }
];

// The right-rail tab panels shared by the full workspace page and the
// embedded replay: Session Summary (full page only), Review, Session Tags,
// Notes, and the Activity Timeline. Extracted from SessionDetailPage so both
// layouts render one canonical panel set.
// The Session tab shows only the most recent few events as a shortcut; the
// Activity tab remains the full explorer.
const ACTIVITY_PREVIEW_COUNT = 5;

const SessionDetailRailPanels = ({
  activeInsightId = null,
  firstEventTimestamp = 0,
  onSelectInsightTab,
  activeInsightTab,
  activitySparklineOptions = null,
  categoryFilter,
  eventFilter,
  filteredInsights,
  frustration,
  getInsightTabId,
  getReplayCurrentTime = null,
  isEmbedded,
  jumpToEvent,
  meta,
  onScrollToReplay = null,
  pauseReplayForNote,
  payload,
  rageClickCount,
  replayDurationMs,
  replayReady,
  seekReplay,
  sessionId,
  setCategoryFilter,
  setEventFilter,
  setShowMouseMoves,
  showMouseMoves,
  stop,
  viewMode
}) => {
  const recentInsights = filteredInsights.slice(-ACTIVITY_PREVIEW_COUNT).reverse();

  return (
    <>
      {!isEmbedded && (
        <CollapsibleInsightCard
          bodyId="behaviorlens-session-summary-body"
          expanded={activeInsightTab === 'sessionSummary'}
          labelledBy={getInsightTabId('sessionSummary')}
          showHeader={false}
          title="Session Summary"
        >
          <div>
            <MetricsGrid>
              <MetricCard>
                <MetricTitle>Status</MetricTitle>
                <MetricValue $tone="completed">{stop.status || meta.status || '-'}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Events</MetricTitle>
                <MetricValue $tone="total">{payload.event_count || 0}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Duration</MetricTitle>
                <MetricValue>{`${stop.duration_s || 0}s`}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Frustration</MetricTitle>
                <FrustrationBadge $level={frustration.tone}>{frustration.label}</FrustrationBadge>
                <MetricSub>{`${rageClickCount} rage click${rageClickCount === 1 ? '' : 's'}`}</MetricSub>
              </MetricCard>
            </MetricsGrid>
            {activitySparklineOptions && (
              <>
                <SparklineLabel>Activity</SparklineLabel>
                <SparklineMount>
                  <HighchartsReact highcharts={Highcharts} options={activitySparklineOptions} />
                </SparklineMount>
              </>
            )}
            <RailPreviewHeader>
              <RailPreviewTitle>Recent activity</RailPreviewTitle>
              <RailPreviewLink
                type="button"
                onClick={() => onSelectInsightTab('timeline')}
                data-testid="behaviorlens-activity-preview-all"
              >
                View all
              </RailPreviewLink>
            </RailPreviewHeader>
            {recentInsights.length === 0 ? (
              <RailPreviewEmpty>No high-level events yet.</RailPreviewEmpty>
            ) : (
              <EventsList $preview data-testid="behaviorlens-activity-preview">
                {recentInsights.map(item => (
                  <EventItem
                    key={item.id}
                    data-testid="behaviorlens-activity-preview-event"
                    $active={activeInsightId === item.id}
                    title={`${item.label} — click to jump to this moment`}
                    onClick={() => jumpToEvent(item)}
                  >
                    <EventIcon $rage={item.isRageClick}>
                      <EventTypeIcon kind={item.isRageClick ? 'rage' : item.kind} />
                    </EventIcon>
                    <EventLabel>
                      {item.isRageClick && <EventTag>Rage</EventTag>}
                      {item.label}
                    </EventLabel>
                    <EventTime>
                      {formatReplayTimestamp(Math.max(0, item.timestamp - firstEventTimestamp))}
                    </EventTime>
                  </EventItem>
                ))}
              </EventsList>
            )}
            <MetaRow>
              <MetaKey>Browser</MetaKey>
              <MetaValue title={meta.user_agent || undefined}>{meta.user_agent || '-'}</MetaValue>
            </MetaRow>
          </div>
        </CollapsibleInsightCard>
      )}

      <SessionReviewQueuePanel
        key={`review-queue-${sessionId}`}
        bodyId="behaviorlens-review-body"
        sessionId={sessionId}
        embedded={isEmbedded}
        expanded={activeInsightTab === 'review'}
        labelledBy={getInsightTabId('review')}
        showHeader={false}
      />

      <SessionLabelsPanel
        bodyId="behaviorlens-session-labels-body"
        embedded={isEmbedded}
        expanded={activeInsightTab === 'sessionLabels'}
        labelledBy={getInsightTabId('sessionLabels')}
        showHeader={false}
      />

      {isEmbedded && (
        <SessionNotesPanel
          bodyId="behaviorlens-session-notes-body"
          embedded={isEmbedded}
          expanded={activeInsightTab === 'notes'}
          labelledBy={getInsightTabId('notes')}
          showHeader={false}
          getReplayCurrentTime={getReplayCurrentTime}
          onNoteComposerFocus={pauseReplayForNote}
          onSeekReplay={seekReplay}
          onScrollToReplay={onScrollToReplay}
          replayDurationMs={replayDurationMs}
          replayReady={replayReady}
        />
      )}

      <CollapsibleInsightCard
        bodyId="behaviorlens-activity-timeline-body"
        expanded={activeInsightTab === 'timeline'}
        labelledBy={getInsightTabId('timeline')}
        showHeader={false}
        title="Activity Timeline"
      >
        <div>
          <CategoryChips>
            {CATEGORY_OPTIONS.map(option => (
              <CategoryChip
                key={option.value}
                type="button"
                $active={categoryFilter === option.value}
                aria-pressed={categoryFilter === option.value}
                onClick={() => setCategoryFilter(option.value)}
              >
                {option.label}
              </CategoryChip>
            ))}
            <CategoryChip
              type="button"
              $active={showMouseMoves}
              onClick={() => setShowMouseMoves(value => !value)}
            >
              {showMouseMoves ? 'Hide Mouse Moves' : 'Show Mouse Moves'}
            </CategoryChip>
          </CategoryChips>
          <RailToolbar>
            <EventSearch
              value={eventFilter}
              onChange={event => setEventFilter(event.target.value)}
              placeholder="Filter events (click, input, scroll...)"
            />
          </RailToolbar>
          <EventsList $embedded={isEmbedded}>
            {filteredInsights.length === 0 ? (
              <Placeholder>No high-level events</Placeholder>
            ) : (
              filteredInsights.map(item => (
                <EventItem
                  key={item.id}
                  data-testid="behaviorlens-activity-event"
                  $active={activeInsightId === item.id}
                  onClick={() => jumpToEvent(item)}
                  onMouseEnter={
                    viewMode === HEATMAP_VIEW_HEATMAP
                      ? () => jumpToEvent(item)
                      : undefined
                  }
                >
                  <EventIcon $rage={item.isRageClick}>
                    <EventTypeIcon kind={item.isRageClick ? 'rage' : item.kind} />
                  </EventIcon>
                  <EventLabel title={item.label}>
                    {item.isRageClick && <EventTag>Rage</EventTag>}
                    {item.label}
                  </EventLabel>
                  <EventTime title={item.timeLabel}>
                    {formatReplayTimestamp(Math.max(0, item.timestamp - firstEventTimestamp))}
                  </EventTime>
                </EventItem>
              ))
            )}
          </EventsList>
        </div>
      </CollapsibleInsightCard>
    </>
  );
};

SessionDetailRailPanels.propTypes = {
  activeInsightId: PropTypes.string,
  firstEventTimestamp: PropTypes.number,
  onSelectInsightTab: PropTypes.func.isRequired,
  activeInsightTab: PropTypes.string.isRequired,
  activitySparklineOptions: PropTypes.object,
  categoryFilter: PropTypes.string.isRequired,
  eventFilter: PropTypes.string.isRequired,
  filteredInsights: PropTypes.array.isRequired,
  frustration: PropTypes.shape({
    label: PropTypes.string.isRequired,
    tone: PropTypes.string.isRequired
  }).isRequired,
  getInsightTabId: PropTypes.func.isRequired,
  getReplayCurrentTime: PropTypes.func,
  isEmbedded: PropTypes.bool.isRequired,
  jumpToEvent: PropTypes.func.isRequired,
  meta: PropTypes.object.isRequired,
  onScrollToReplay: PropTypes.func,
  pauseReplayForNote: PropTypes.func.isRequired,
  payload: PropTypes.object.isRequired,
  rageClickCount: PropTypes.number.isRequired,
  replayDurationMs: PropTypes.number.isRequired,
  replayReady: PropTypes.bool.isRequired,
  seekReplay: PropTypes.func.isRequired,
  sessionId: PropTypes.string.isRequired,
  setCategoryFilter: PropTypes.func.isRequired,
  setEventFilter: PropTypes.func.isRequired,
  setShowMouseMoves: PropTypes.func.isRequired,
  showMouseMoves: PropTypes.bool.isRequired,
  stop: PropTypes.object.isRequired,
  viewMode: PropTypes.string.isRequired
};

export default SessionDetailRailPanels;
