import {
  INSIGHTS_MODE_CLICK_MAPS,
  INSIGHTS_MODE_INSPECT,
  INSIGHTS_MODE_SCROLL_MAPS
} from './InsightsModeTabs';
import {
  WORKSPACE_MODE_PAGE_INSIGHTS,
  WORKSPACE_MODE_SESSION_NOTES,
  WORKSPACE_MODE_SESSION_REPLAY
} from './WorkspaceModeTabs';

export const WORKSPACE_MODE_QUERY_KEY = 'workspace';
export const INSIGHTS_MODE_QUERY_KEY = 'insightsMode';

const INSIGHTS_MODES = new Set([
  INSIGHTS_MODE_CLICK_MAPS,
  INSIGHTS_MODE_SCROLL_MAPS,
  INSIGHTS_MODE_INSPECT
]);

export const readWorkspaceModeFromSearch = search => {
  const params = new URLSearchParams(search);
  const mode = params.get(WORKSPACE_MODE_QUERY_KEY);
  return mode === WORKSPACE_MODE_PAGE_INSIGHTS || mode === WORKSPACE_MODE_SESSION_NOTES
    ? mode
    : WORKSPACE_MODE_SESSION_REPLAY;
};

export const readInsightsModeFromSearch = search => {
  const mode = new URLSearchParams(search).get(INSIGHTS_MODE_QUERY_KEY);
  return INSIGHTS_MODES.has(mode) ? mode : INSIGHTS_MODE_CLICK_MAPS;
};

export const writeWorkspaceModeToSearch = (search, workspaceMode, insightsMode) => {
  const params = new URLSearchParams(search);
  if (workspaceMode === WORKSPACE_MODE_SESSION_REPLAY) {
    params.delete(WORKSPACE_MODE_QUERY_KEY);
    params.delete(INSIGHTS_MODE_QUERY_KEY);
    return params;
  }
  if (workspaceMode === WORKSPACE_MODE_SESSION_NOTES) {
    params.set(WORKSPACE_MODE_QUERY_KEY, WORKSPACE_MODE_SESSION_NOTES);
    params.delete(INSIGHTS_MODE_QUERY_KEY);
    return params;
  }
  params.set(WORKSPACE_MODE_QUERY_KEY, WORKSPACE_MODE_PAGE_INSIGHTS);
  params.set(
    INSIGHTS_MODE_QUERY_KEY,
    INSIGHTS_MODES.has(insightsMode) ? insightsMode : INSIGHTS_MODE_CLICK_MAPS
  );
  return params;
};

export const writeInsightsModeToSearch = (search, insightsMode) => (
  writeWorkspaceModeToSearch(search, WORKSPACE_MODE_PAGE_INSIGHTS, insightsMode)
);
