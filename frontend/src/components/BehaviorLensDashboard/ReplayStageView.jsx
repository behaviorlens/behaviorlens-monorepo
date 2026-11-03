import React from 'react';
import PropTypes from 'prop-types';
import {
  ReplayBookmarkOverlay,
  ReplayClickToggle,
  ReplayPlayerMount,
  ReplayStage
} from './ScBehaviorLensDashboard';
import SessionHeatmap from './SessionHeatmap';
import { HEATMAP_VIEW_HEATMAP } from './behaviorLensHeatmap';
import { SessionBookmarkControl } from './SessionReviewMetadataPanel';

// The stage content shared by the workspace and embedded layouts: the rrweb
// mount, wrapped by the heatmap feature outside the AI-review embed.
const ReplayStageView = ({
  activeInsightId,
  assignPlayerMount,
  handleViewModeChange,
  heatmapFilter,
  isAIReviewDashboardEmbed,
  isEmbedded,
  onTogglePlayback,
  payload,
  hideHeatmapToolbar,
  playerMountRef,
  replayWarming,
  setHeatmapFilter,
  showBookmarkOverlay,
  viewMode,
  viewport
}) => {
  const playerMount = (
    <ReplayPlayerMount
      ref={assignPlayerMount}
      $embedded={isEmbedded}
      $aiReviewDashboardEmbed={isAIReviewDashboardEmbed}
      className={replayWarming ? 'behaviorlens-replay-warming' : undefined}
      data-testid="session-replay-player-mount"
    />
  );
  const playbackToggle = (
    <ReplayClickToggle
      aria-hidden="true"
      data-testid="session-replay-stage-toggle"
      onClick={onTogglePlayback}
    />
  );

  if (isAIReviewDashboardEmbed) {
    return (
      <ReplayStage $embedded={isEmbedded}>
        {playerMount}
        {playbackToggle}
      </ReplayStage>
    );
  }

  return (
    <SessionHeatmap
      embedded={isEmbedded}
      events={payload.events}
      filter={heatmapFilter}
      hideToolbar={hideHeatmapToolbar}
      highlightedInsightId={viewMode === HEATMAP_VIEW_HEATMAP ? activeInsightId : null}
      mode={viewMode}
      onFilterChange={setHeatmapFilter}
      onModeChange={handleViewModeChange}
      playerMountRef={playerMountRef}
      recordedViewport={viewport}
    >
      {playerMount}
      {playbackToggle}
      {showBookmarkOverlay && (
        <ReplayBookmarkOverlay data-testid="replay-bookmark-overlay">
          <SessionBookmarkControl />
        </ReplayBookmarkOverlay>
      )}
    </SessionHeatmap>
  );
};

ReplayStageView.propTypes = {
  activeInsightId: PropTypes.string,
  assignPlayerMount: PropTypes.func.isRequired,
  handleViewModeChange: PropTypes.func.isRequired,
  heatmapFilter: PropTypes.string.isRequired,
  hideHeatmapToolbar: PropTypes.bool,
  isAIReviewDashboardEmbed: PropTypes.bool,
  isEmbedded: PropTypes.bool,
  onTogglePlayback: PropTypes.func.isRequired,
  payload: PropTypes.object.isRequired,
  playerMountRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  replayWarming: PropTypes.bool,
  setHeatmapFilter: PropTypes.func.isRequired,
  showBookmarkOverlay: PropTypes.bool,
  viewMode: PropTypes.string.isRequired,
  viewport: PropTypes.object
};

export default ReplayStageView;
