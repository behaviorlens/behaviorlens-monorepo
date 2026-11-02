import React from 'react';
import PropTypes from 'prop-types';
import {
  WorkspaceModeTab,
  WorkspaceModeTabList
} from './ScBehaviorLensWorkspace';

export const WORKSPACE_MODE_SESSION_REPLAY = 'sessionReplay';
export const WORKSPACE_MODE_PAGE_INSIGHTS = 'pageInsights';
export const WORKSPACE_MODE_SESSION_NOTES = 'sessionNotes';

const MODES = [
  { id: WORKSPACE_MODE_SESSION_REPLAY, label: 'Session Replay', available: true },
  { id: WORKSPACE_MODE_PAGE_INSIGHTS, label: 'Page Insights', available: true },
  { id: WORKSPACE_MODE_SESSION_NOTES, label: 'Session Notes', available: true }
];

// Workspace-level mode navigation. Both modes share the loaded session, so
// switching does not refetch the replay.
const WorkspaceModeTabs = ({ activeMode, onModeChange }) => (
  <WorkspaceModeTabList role="tablist" aria-label="BehaviorLens workspace mode">
    {MODES.map(mode => (
      <WorkspaceModeTab
        key={mode.id}
        type="button"
        role="tab"
        aria-selected={activeMode === mode.id}
        aria-disabled={!mode.available}
        disabled={!mode.available}
        title={mode.available ? undefined : 'Page Insights is not available yet.'}
        $active={activeMode === mode.id}
        onClick={mode.available ? () => onModeChange(mode.id) : undefined}
      >
        {mode.label}
      </WorkspaceModeTab>
    ))}
  </WorkspaceModeTabList>
);

WorkspaceModeTabs.defaultProps = {
  onModeChange: () => {}
};

WorkspaceModeTabs.propTypes = {
  activeMode: PropTypes.oneOf([
    WORKSPACE_MODE_SESSION_REPLAY,
    WORKSPACE_MODE_PAGE_INSIGHTS,
    WORKSPACE_MODE_SESSION_NOTES
  ]).isRequired,
  onModeChange: PropTypes.func
};

export default WorkspaceModeTabs;
