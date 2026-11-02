import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatReplayClock } from './ReplayControlBar';
import SessionActivityCard from './SessionActivityCard';
import { useSessionReviewMetadataContext } from './SessionReviewMetadataPanel';
import useCurrentReplayTime from './useReplayCurrentTime';
import { buildInactivityGaps } from './behaviorLensInactivity';
import { collectTimestampedNotes } from './behaviorLensSessionTimeline';
import {
  CompactInactive,
  CompactPlayed,
  CompactPlayhead,
  CompactTimeline,
  CompactTrack,
  EmptyTimeline,
  NotesStrip,
  NotesStripIcon,
  TimelineClock,
  TimelineClockRow,
  TimelineShell
} from './ScBehaviorLensSessionTimeline';

const percentAt = (offsetMs, duration) => (
  duration > 0 ? Math.min(100, Math.max(0, (offsetMs / duration) * 100)) : 0
);
const EMPTY_NOTES = [];
const formatTimelineClock = ms => {
  const [minutes, seconds] = formatReplayClock(ms).split(':');
  return `${minutes.padStart(2, '0')}:${seconds}`;
};

const SessionTimeline = ({
  activitySparklineOptions,
  events,
  isPlayingRef,
  onSeekActivity,
  onSelectNote,
  playbackLocked,
  playerInstanceRef,
  replayDurationMs,
  replayReady,
  replayRevision,
  seekReplay,
  showNotes
}) => {
  const reviewContext = useSessionReviewMetadataContext();
  const notes = showNotes && Array.isArray(reviewContext?.controller?.notes)
    ? reviewContext.controller.notes
    : EMPTY_NOTES;
  const liveTimeMs = useCurrentReplayTime(playerInstanceRef, replayReady, replayRevision);
  const duration = Math.max(0, Number(replayDurationMs) || 0);
  // Locking Scroll Maps prevents seeking; it should not visually move the
  // progress or playhead away from the moment the reviewer was watching.
  const currentTimeMs = liveTimeMs;
  const noteMarks = useMemo(
    () => collectTimestampedNotes(notes, duration),
    [duration, notes]
  );
  const inactivityGaps = useMemo(() => buildInactivityGaps(events), [events]);

  const seekPreservingPlay = offsetMs => (
    seekReplay(offsetMs, Boolean(isPlayingRef?.current))
  );
  // Scroll Maps freezes playback: the track, sparkline, and note icons
  // must not seek, and they use the same faded disabled look as play.
  const handleTrackSeek = event => {
    if (playbackLocked) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;
    seekPreservingPlay(Math.round(Math.min(1, Math.max(0, ratio)) * duration));
  };

  return (
    <TimelineShell data-testid="behaviorlens-session-timeline">
      {duration > 0 ? (
        <CompactTimeline>
          <SessionActivityCard
            onSeek={offsetMs => (
              onSeekActivity
                ? onSeekActivity(offsetMs, Boolean(isPlayingRef?.current))
                : seekPreservingPlay(offsetMs)
            )}
            options={activitySparklineOptions}
            seekEnabled={!playbackLocked}
          />
          <CompactTrack
            role="slider"
            tabIndex={playbackLocked ? -1 : 0}
            aria-disabled={playbackLocked || undefined}
            aria-label={playbackLocked ? 'Session timeline' : 'Seek session timeline'}
            $locked={playbackLocked}
            onClick={playbackLocked ? undefined : handleTrackSeek}
            onKeyDown={playbackLocked ? undefined : (event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                seekPreservingPlay(currentTimeMs);
              }
            })}
            data-testid="behaviorlens-timeline-track"
          >
            <CompactPlayed $percent={percentAt(currentTimeMs, duration)} />
            {inactivityGaps.map(gap => (
              <CompactInactive
                key={gap.id}
                aria-hidden="true"
                data-testid="behaviorlens-timeline-inactivity"
                $startPercent={percentAt(gap.startMs, duration)}
                $endPercent={percentAt(gap.endMs, duration)}
              />
            ))}
            <CompactPlayhead $percent={percentAt(currentTimeMs, duration)} />
          </CompactTrack>
          <NotesStrip data-testid="behaviorlens-notes-strip">
            {noteMarks.map(note => (
              <NotesStripIcon
                key={note.id}
                type="button"
                disabled={playbackLocked}
                $locked={playbackLocked}
                $percent={percentAt(note.offsetMs, duration)}
                aria-label={playbackLocked
                  ? `Note at ${formatReplayClock(note.offsetMs)}`
                  : `Jump replay to note at ${formatReplayClock(note.offsetMs)}`}
                title={playbackLocked ? 'Playback is paused on Scroll Maps' : note.label}
                data-testid="behaviorlens-timeline-note"
                onClick={playbackLocked ? undefined : () => {
                  seekReplay(note.offsetMs, false);
                  if (typeof onSelectNote === 'function' && note.noteId != null) {
                    onSelectNote(note.noteId, note.offsetMs);
                  }
                }}
              />
            ))}
          </NotesStrip>
          <TimelineClockRow aria-hidden="true">
            <TimelineClock>{formatTimelineClock(0)}</TimelineClock>
            <TimelineClock>{formatTimelineClock(duration)}</TimelineClock>
          </TimelineClockRow>
        </CompactTimeline>
      ) : <EmptyTimeline>No timeline data is available for this replay.</EmptyTimeline>}
    </TimelineShell>
  );
};

SessionTimeline.defaultProps = {
  activitySparklineOptions: null,
  events: [],
  isPlayingRef: null,
  onSeekActivity: undefined,
  onSelectNote: undefined,
  playbackLocked: false,
  replayRevision: 0,
  showNotes: true
};
SessionTimeline.propTypes = {
  activitySparklineOptions: PropTypes.object,
  events: PropTypes.array,
  isPlayingRef: PropTypes.shape({ current: PropTypes.bool }),
  onSeekActivity: PropTypes.func,
  onSelectNote: PropTypes.func,
  playbackLocked: PropTypes.bool,
  playerInstanceRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  replayDurationMs: PropTypes.number.isRequired,
  replayReady: PropTypes.bool.isRequired,
  replayRevision: PropTypes.number,
  seekReplay: PropTypes.func.isRequired,
  showNotes: PropTypes.bool
};

export default SessionTimeline;
