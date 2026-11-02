import React from 'react';
import PropTypes from 'prop-types';
import { ReplayTransportDock, StageArea } from './ScBehaviorLensWorkspace';
import DevToolsDrawer from './DevToolsDrawer';
import NoteSharePopover from './NoteSharePopover';
import ReplayContextChrome from './ReplayContextChrome';
import ReplayControlBar from './ReplayControlBar';
import ReplayStageView from './ReplayStageView';
import ReplayUpNext from './ReplayUpNext';
import SessionTimeline from './SessionTimeline';
import { PLAYBACK_SPEED_OPTIONS } from './sessionDetailConstants';

export const SessionReplayStageStack = ({
  devToolsOpen,
  enrichment,
  isEmbedded,
  onToggleDevTools,
  replayReady,
  replayStageProps,
  seekReplay,
  showAgentUserActivityBar,
  title,
  togglePlay,
  upNext,
  url
}) => (
  <>
    <ReplayContextChrome
      devToolsOpen={devToolsOpen}
      onToggleDevTools={onToggleDevTools}
      title={title}
      url={url}
    />
    <StageArea $devToolsOpen={devToolsOpen} className="behaviorlens-workspace-stage">
      <ReplayStageView
        {...replayStageProps}
        hideHeatmapToolbar
        onTogglePlayback={togglePlay}
        showBookmarkOverlay={false}
      />
      {upNext && (
        <ReplayUpNext
          countdown={upNext.countdown}
          onCancel={upNext.onCancel}
          onPlayNow={upNext.onPlayNow}
          session={upNext.session}
          sessionId={upNext.sessionId}
        />
      )}
    </StageArea>
    {devToolsOpen && (
      <DevToolsDrawer
        onSeek={replayReady ? seekReplay : undefined}
        telemetry={enrichment.telemetry}
        url={url}
      />
    )}
  </>
);

export const SessionReplayTimeline = ({
  activitySparklineOptions, isPlayingRef, onSeekActivity, onSelectNote, payload, playerInstanceRef,
  playerMountRevision, replayDurationMs, replayReady, seekReplay
}) => (
  <SessionTimeline
    activitySparklineOptions={activitySparklineOptions}
    events={payload.events}
    isPlayingRef={isPlayingRef}
    onSeekActivity={onSeekActivity}
    onSelectNote={onSelectNote}
    playerInstanceRef={playerInstanceRef}
    replayDurationMs={replayDurationMs}
    replayReady={replayReady}
    replayRevision={playerMountRevision}
    seekReplay={seekReplay}
  />
);

export const SessionReplayControls = ({
  canFullscreen, getReplayCurrentTime, onFullscreenChange, onNoteSaved, onOpenNote,
  isPlayingRef, noteShareOpenRequest, payload, playerInstanceRef, playerMountRevision, replayDurationMs,
  replayReady, seekReplay, skipInactivePreferenceRef, stageRef, togglePlay, warming
}) => (
  <ReplayControlBar
    canFullscreen={canFullscreen}
    events={payload.events}
    getReplayCurrentTime={getReplayCurrentTime}
    noteSlot={(
      <NoteSharePopover
        getReplayCurrentTime={getReplayCurrentTime}
        onNoteSaved={onNoteSaved}
        onOpenPopover={onOpenNote}
        openRequest={noteShareOpenRequest}
      />
    )}
    isPlayingRef={isPlayingRef}
    onFullscreenChange={onFullscreenChange}
    playerInstanceRef={playerInstanceRef}
    replayDurationMs={replayDurationMs}
    replayReady={replayReady}
    replayRevision={playerMountRevision}
    seekReplay={seekReplay}
    skipInactivePreferenceRef={skipInactivePreferenceRef}
    speedOptions={PLAYBACK_SPEED_OPTIONS}
    stageRef={stageRef}
    togglePlay={togglePlay}
    warming={warming}
  />
);

const SessionReplayPlayerStack = props => {
  return (
    <>
      <SessionReplayStageStack {...props} />
      <ReplayTransportDock data-testid="behaviorlens-transport-dock">
        <SessionReplayTimeline {...props} />
        <SessionReplayControls {...props} />
      </ReplayTransportDock>
    </>
  );
};

SessionReplayPlayerStack.propTypes = {
  activitySparklineOptions: PropTypes.object,
  canFullscreen: PropTypes.bool,
  devToolsOpen: PropTypes.bool.isRequired,
  enrichment: PropTypes.object.isRequired,
  getReplayCurrentTime: PropTypes.func.isRequired,
  isEmbedded: PropTypes.bool.isRequired,
  isPlayingRef: PropTypes.shape({ current: PropTypes.bool }),
  noteShareOpenRequest: PropTypes.number,
  onFullscreenChange: PropTypes.func.isRequired,
  onNoteSaved: PropTypes.func,
  onOpenNote: PropTypes.func.isRequired,
  onSelectNote: PropTypes.func,
  onToggleDevTools: PropTypes.func.isRequired,
  payload: PropTypes.object.isRequired,
  onSeekActivity: PropTypes.func,
  playerInstanceRef: PropTypes.object.isRequired,
  playerMountRevision: PropTypes.number.isRequired,
  replayDurationMs: PropTypes.number.isRequired,
  replayReady: PropTypes.bool.isRequired,
  replayStageProps: PropTypes.object.isRequired,
  seekReplay: PropTypes.func.isRequired,
  sessionId: PropTypes.string.isRequired,
  showAgentUserActivityBar: PropTypes.bool.isRequired,
  skipInactivePreferenceRef: PropTypes.object.isRequired,
  stageRef: PropTypes.object.isRequired,
  title: PropTypes.string,
  togglePlay: PropTypes.func.isRequired,
  upNext: PropTypes.shape({
    countdown: PropTypes.number.isRequired,
    onCancel: PropTypes.func.isRequired,
    onPlayNow: PropTypes.func.isRequired,
    session: PropTypes.object,
    sessionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
  }),
  url: PropTypes.string,
  warming: PropTypes.bool.isRequired
};

SessionReplayPlayerStack.defaultProps = {
  activitySparklineOptions: null,
  canFullscreen: true,
  isPlayingRef: null,
  noteShareOpenRequest: 0,
  onNoteSaved: () => {},
  onSelectNote: undefined,
  onSeekActivity: undefined,
  title: null,
  upNext: null,
  url: null
};
SessionReplayStageStack.propTypes = SessionReplayPlayerStack.propTypes;
SessionReplayStageStack.defaultProps = SessionReplayPlayerStack.defaultProps;
SessionReplayTimeline.propTypes = SessionReplayPlayerStack.propTypes;
SessionReplayTimeline.defaultProps = SessionReplayPlayerStack.defaultProps;
SessionReplayControls.propTypes = SessionReplayPlayerStack.propTypes;
SessionReplayControls.defaultProps = SessionReplayPlayerStack.defaultProps;

export default SessionReplayPlayerStack;
