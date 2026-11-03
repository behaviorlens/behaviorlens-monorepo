import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import { useHistory } from 'react-router-dom';
import { useReplaySpaceControls } from '../replay/behaviorLensReplayControls';
import useRecentSessionNavigation from './useRecentSessionNavigation';
import {
  DEFAULT_SESSION_DETAIL_TAB, isSessionDetailTab, readSessionDetailTab
} from '../shared/behaviorLensLayoutPreferences';

export const REPLAY_UP_NEXT_COUNTDOWN_SECONDS = 15;
// Workspace rail tabs (dense, reference-style). Notes has no rail tab in the
// workspace — it lives in the Note & Share popover — but stays available as a
// tab in embedded mode, which has no replay control bar.
const SESSION_DETAIL_TABS = [
  {
    id: 'sessionSummary',
    label: 'Session',
    bodyId: 'behaviorlens-session-summary-body',
    availableWhenEmbedded: false,
    availableInWorkspace: true
  },
  {
    id: 'review',
    label: 'Review',
    bodyId: 'behaviorlens-review-body',
    availableWhenEmbedded: true,
    availableInWorkspace: true
  },
  {
    id: 'sessionLabels',
    label: 'Tags',
    bodyId: 'behaviorlens-session-labels-body',
    availableWhenEmbedded: true,
    availableInWorkspace: true
  },
  {
    id: 'notes',
    label: 'Notes',
    bodyId: 'behaviorlens-session-notes-body',
    availableWhenEmbedded: true,
    availableInWorkspace: false
  },
  {
    id: 'timeline',
    label: 'Activity',
    bodyId: 'behaviorlens-activity-timeline-body',
    availableWhenEmbedded: true,
    availableInWorkspace: true
  }
];

export const getVisibleInsightTabs = isEmbedded => SESSION_DETAIL_TABS.filter(tab => (
  isEmbedded ? tab.availableWhenEmbedded : tab.availableInWorkspace
));

const resolveInsightTab = (tabId, isEmbedded) => {
  const visibleTabs = getVisibleInsightTabs(isEmbedded);
  if (visibleTabs.some(tab => tab.id === tabId)) {
    return tabId;
  }
  return visibleTabs[0]?.id || DEFAULT_SESSION_DETAIL_TAB;
};

export const useInsightTabState = isEmbedded => {
  const [activeTab, setActiveTab] = useState(() => (
    resolveInsightTab(isEmbedded ? DEFAULT_SESSION_DETAIL_TAB : readSessionDetailTab(), isEmbedded)
  ));

  useEffect(() => {
    setActiveTab(current => resolveInsightTab(
      isEmbedded ? current : readSessionDetailTab(),
      isEmbedded
    ));
  }, [isEmbedded]);

  const selectInsightTab = useCallback(tabId => {
    if (!isSessionDetailTab(tabId)) {
      return;
    }
    // Workspace rail views persist through writeSessionReplayRailView on
    // the same storage key. Do not write embedded tab ids (timeline, notes)
    // from this helper or they overwrite the rail dropdown.
    setActiveTab(resolveInsightTab(tabId, isEmbedded));
  }, [isEmbedded]);

  return [activeTab, selectInsightTab, getVisibleInsightTabs(isEmbedded)];
};

// Play/pause driven by the reviewer — the control-bar button, a click on the
// replay itself, or the Space shortcut. The intent flag lets the warm-up
// autoplay stand down once the reviewer has taken control, so pressing pause
// during buffering is not undone a moment later.
export const useIntentAwarePlayback = (playerInstanceRef, heatmapBeforeToggleRef) => {
  const userToggledPlaybackRef = useRef(false);
  const { togglePlay: toggleReplayPlayback, isPlayingRef } = useReplaySpaceControls(
    playerInstanceRef,
    { beforeToggle: () => heatmapBeforeToggleRef.current() }
  );
  const togglePlay = useCallback(() => {
    userToggledPlaybackRef.current = true;
    toggleReplayPlayback();
  }, [toggleReplayPlayback]);

  return { isPlayingRef, togglePlay, userToggledPlaybackRef };
};

// Recent Sessions navigation for the rail header. The position comes from the
// real session list the reviewer arrived from; when that list cannot place
// this session the header shows an unavailable state rather than a
// fabricated count.
export const useSessionRailNavigation = ({ enabled, listReturnPath, sessionId }) => {
  const history = useHistory();
  const recentSessions = useRecentSessionNavigation({
    enabled, returnTo: listReturnPath, sessionId
  });
  const navigateToSession = useCallback(target => {
    if (!target?.sessionId) {
      return;
    }
    const params = new URLSearchParams({ returnTo: listReturnPath });
    if (target.slug) {
      params.set('slug', target.slug);
    }
    history.push({
      pathname: `/app/${target.sessionId}`,
      search: `?${params.toString()}`,
      state: { returnTo: listReturnPath, slug: target.slug }
    });
  }, [history, listReturnPath]);

  return { navigateToSession, recentSessions };
};

export const useReplayRefs = () => ({
  insightsPaneRef: useRef(null),
  playerInstanceRef: useRef(null),
  playerMountRef: useRef(null),
  replayPaneRef: useRef(null),
  warmupTimerRef: useRef(null)
});

// Tie rrweb teardown to the stage mount so mode switches cannot retain a stale player.
export const useReplayPlayerMount = (
  playerMountRef, playerInstanceRef, onPlayerUnmount, isPlayingRef
) => {
  const [playerMountEl, setPlayerMountEl] = useState(null);
  const [playerMountRevision, setPlayerMountRevision] = useState(0);
  const resumeTimeRef = useRef(0);
  const resumePlayingRef = useRef(false);
  const assignPlayerMount = useCallback(node => {
    if (!node && playerInstanceRef.current) {
      // Snapshot play state before $destroy, which can emit a pause event.
      resumePlayingRef.current = Boolean(isPlayingRef?.current);
      try {
        const currentTime = playerInstanceRef.current.getReplayer?.()?.getCurrentTime?.();
        if (Number.isFinite(currentTime) && currentTime > 0) {
          resumeTimeRef.current = currentTime;
        }
      } catch (error) {
        // A disposed player cannot report its time; resume from the start.
      }
      try {
        playerInstanceRef.current.$destroy?.();
      } catch (error) {
        /* noop */
      }
      playerInstanceRef.current = null;
    }
    if (!node) {
      onPlayerUnmount();
    }
    playerMountRef.current = node;
    setPlayerMountEl(current => (current === node ? current : node));
    setPlayerMountRevision(current => current + 1);
  }, [isPlayingRef, onPlayerUnmount, playerInstanceRef, playerMountRef]);
  return {
    assignPlayerMount, playerMountEl, playerMountRevision, resumePlayingRef, resumeTimeRef
  };
};
export const useSessionReplayEvents = payload => {
  const playerEvents = useMemo(
    () => (Array.isArray(payload?.events) ? payload.events : []),
    [payload]
  );

  const replayDurationMs = useMemo(() => {
    if (playerEvents.length < 2) {
      return 0;
    }
    const firstTimestamp = Number(playerEvents[0]?.timestamp || 0);
    const lastTimestamp = Number(playerEvents[playerEvents.length - 1]?.timestamp || 0);
    return Math.max(0, lastTimestamp - firstTimestamp);
  }, [playerEvents]);

  return {
    playerEvents, replayDurationMs
  };
};
