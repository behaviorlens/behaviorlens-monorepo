import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  IconClockEllipsis,
  IconMagnifyingGlass,
  IconWandMagicFilled
} from '../../ui/icons';
import {
  RailActivityDivider,
  RailActivityView,
  RailCard,
  RailCardTitle,
  RailEventSearch,
  RailLogFade,
  RailLogLabel,
  RailLogPrimary,
  RailLogRow,
  RailLogText,
  RailLogStream,
  RailLogTime,
  RailLogViewport,
  RailMain,
  RailRoot,
  RailSearchRow,
  RailStreamEmpty,
  RailViewTab,
  RailViewTabs
} from './ScBehaviorLensEventRail';
import { EventTypeIcon } from '../shared/behaviorLensEvents';
import { formatReplayTimestamp } from '../shared/behaviorLensNoteTimestamps';
import {
  readSessionReplayRailView,
  SESSION_REPLAY_RAIL_VIEW_KEYS,
  writeSessionReplayRailView
} from '../shared/behaviorLensLayoutPreferences';
import SessionAiSummaryFeature from '../ai-summary/SessionAiSummaryFeature';
import SessionRailHeader from './SessionRailHeader';
import useScrollEdgeFades from '../shared/useScrollEdgeFades';

const RAIL_VIEW_OPTIONS = [
  {
    value: SESSION_REPLAY_RAIL_VIEW_KEYS.activityLog,
    label: 'Activity Log',
    icon: IconClockEllipsis
  },
  {
    value: SESSION_REPLAY_RAIL_VIEW_KEYS.aiSummary,
    label: 'AI Summary',
    icon: IconWandMagicFilled
  }
];

const ActivityLogView = ({
  currentInsightId = null,
  eventFilter,
  filteredInsights,
  firstEventTimestamp,
  onHoverEvent = null,
  onSeekToEvent,
  selectedInsightId = null,
  setEventFilter,
  streamRef = null
}) => {
  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(
    `${eventFilter}:${filteredInsights.length}`,
    streamRef
  );

  return (
    <RailCard $tone="activityLog">
      <RailCardTitle>Activity Log</RailCardTitle>
      <RailSearchRow>
        <IconMagnifyingGlass aria-hidden="true" />
        <RailEventSearch
          type="search"
          value={eventFilter}
          placeholder="Filter events (click, input, scroll...)"
          aria-label="Filter events (click, input, scroll...)"
          onChange={event => setEventFilter(event.target.value)}
          data-testid="behaviorlens-rail-filter-events"
        />
      </RailSearchRow>
      <RailLogViewport>
        <RailLogStream ref={scrollRef} data-testid="behaviorlens-rail-event-stream">
          {filteredInsights.length === 0 ? (
            <RailStreamEmpty role="status">
              {eventFilter
                ? 'No events match these filters.'
                : 'No high-level events were derived for this session.'}
            </RailStreamEmpty>
          ) : (
            filteredInsights.map(item => (
              <RailLogRow
                key={item.id}
                type="button"
                data-testid="behaviorlens-activity-event"
                $active={item.id === selectedInsightId || item.id === currentInsightId}
                aria-current={item.id === currentInsightId ? 'true' : undefined}
                title={`${item.label} — click to jump to this moment`}
                onClick={() => onSeekToEvent(item)}
                onMouseEnter={onHoverEvent ? () => onHoverEvent(item) : undefined}
              >
                <RailLogLabel $rage={Boolean(item.isRageClick)}>
                  <EventTypeIcon kind={item.isRageClick ? 'rage' : item.kind} />
                  <RailLogText>
                    <RailLogPrimary>{item.label}</RailLogPrimary>
                  </RailLogText>
                </RailLogLabel>
                <RailLogTime>
                  {formatReplayTimestamp(Math.max(0, item.timestamp - firstEventTimestamp))}
                </RailLogTime>
              </RailLogRow>
            ))
          )}
        </RailLogStream>
        <RailLogFade aria-hidden="true" $edge="top" $opacity={fadeTop} />
        <RailLogFade aria-hidden="true" $edge="bottom" $opacity={fadeBottom} />
      </RailLogViewport>
    </RailCard>
  );
};

ActivityLogView.propTypes = {
  currentInsightId: PropTypes.string,
  eventFilter: PropTypes.string.isRequired,
  filteredInsights: PropTypes.array.isRequired,
  firstEventTimestamp: PropTypes.number.isRequired,
  onHoverEvent: PropTypes.func,
  onSeekToEvent: PropTypes.func.isRequired,
  selectedInsightId: PropTypes.string,
  setEventFilter: PropTypes.func.isRequired,
  streamRef: PropTypes.shape({ current: PropTypes.any })
};

const SessionEventRail = ({
  currentInsightId = null,
  streamRef = null,
  eventFilter,
  filteredInsights,
  firstEventTimestamp,
  meta,
  onHoverEvent = null,
  onSeekToEvent,
  payload,
  seekReplay,
  selectedInsightId = null,
  sessionId,
  setEventFilter,
  stop,
  viewport = null
}) => {
  const [railView, setRailView] = useState(() => (
    readSessionReplayRailView() === SESSION_REPLAY_RAIL_VIEW_KEYS.aiSummary
      ? SESSION_REPLAY_RAIL_VIEW_KEYS.aiSummary
      : SESSION_REPLAY_RAIL_VIEW_KEYS.activityLog
  ));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const changeRailView = value => {
    setRailView(value);
    writeSessionReplayRailView(value);
  };

  return (
    <RailRoot $view={railView}>
      <RailViewTabs
        role="tablist"
        aria-label="Session replay view"
        data-testid="behaviorlens-rail-view-tabs"
      >
        {RAIL_VIEW_OPTIONS.map(option => {
          const Icon = option.icon;
          const active = railView === option.value;
          return (
            <RailViewTab
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              $active={active}
              $view={option.value}
              onClick={() => changeRailView(option.value)}
            >
              <Icon aria-hidden="true" />
              {option.label}
            </RailViewTab>
          );
        })}
      </RailViewTabs>
      <RailMain>
        {railView === SESSION_REPLAY_RAIL_VIEW_KEYS.aiSummary && (
          <SessionAiSummaryFeature
            payload={payload}
            seekReplay={seekReplay}
            sessionId={sessionId}
          />
        )}
        {railView === SESSION_REPLAY_RAIL_VIEW_KEYS.activityLog && (
          <RailActivityView>
            <SessionRailHeader
              detailsOpen={detailsOpen}
              meta={meta}
              onToggleDetails={() => setDetailsOpen(open => !open)}
              stop={stop}
              viewport={viewport}
            />
            <RailActivityDivider aria-hidden="true" />
            <ActivityLogView
              currentInsightId={currentInsightId}
              eventFilter={eventFilter}
              filteredInsights={filteredInsights}
              firstEventTimestamp={firstEventTimestamp}
              onHoverEvent={onHoverEvent}
              onSeekToEvent={onSeekToEvent}
              selectedInsightId={selectedInsightId}
              setEventFilter={setEventFilter}
              streamRef={streamRef}
            />
          </RailActivityView>
        )}
      </RailMain>
    </RailRoot>
  );
};

SessionEventRail.propTypes = {
  currentInsightId: PropTypes.string,
  eventFilter: PropTypes.string.isRequired,
  filteredInsights: PropTypes.array.isRequired,
  firstEventTimestamp: PropTypes.number.isRequired,
  meta: PropTypes.object.isRequired,
  onHoverEvent: PropTypes.func,
  onSeekToEvent: PropTypes.func.isRequired,
  payload: PropTypes.object.isRequired,
  seekReplay: PropTypes.func.isRequired,
  selectedInsightId: PropTypes.string,
  sessionId: PropTypes.string.isRequired,
  setEventFilter: PropTypes.func.isRequired,
  stop: PropTypes.object.isRequired,
  streamRef: PropTypes.shape({ current: PropTypes.any }),
  viewport: PropTypes.object
};

export default SessionEventRail;
