import {
  useCallback, useRef, useState
} from 'react';
import { WORKSPACE_MODE_SESSION_REPLAY } from './WorkspaceModeTabs';

const useWorkspaceChrome = ({
  initialWorkspaceMode = WORKSPACE_MODE_SESSION_REPLAY,
  replayPaneRef
}) => {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState(initialWorkspaceMode);
  const workspaceFullscreenRef = useRef(null);
  const toggleDevTools = useCallback(() => setDevToolsOpen(open => !open), []);
  const scrollToReplayTop = useCallback(() => {
    replayPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [replayPaneRef]);
  return {
    devToolsOpen,
    scrollToReplayTop,
    setWorkspaceMode,
    toggleDevTools,
    workspaceFullscreenRef,
    workspaceMode
  };
};

export default useWorkspaceChrome;
