import { useEffect, useMemo, useState } from 'react';
import { useMessageBus } from '../../lib/useMessageBus';

export const PLAYER_CONTROLLER_H = 80;
export const AI_REVIEW_PLAYER_CONTROLLER_H = 44;
export const EMBEDDED_PLAYER_MAX_SCALE = 4;
export const AI_REVIEW_DASHBOARD_EMBED_SOURCE = 'ai-review-dashboard';

// Workspace mode owns timeline and transport in React; rrweb's controller is
// completely hidden and therefore reserves no layout height.
export const WORKSPACE_PLAYER_CONTROLLER_H = 0;

const getLegacyPlayerSize = (mountNode, controllerHeight = PLAYER_CONTROLLER_H) => {
  const view = mountNode.ownerDocument.defaultView;
  const mountWidth = mountNode.clientWidth;
  const viewportWidth = view?.innerWidth ?? 0;
  const width = Math.max(
    1,
    mountWidth > 40 ? mountWidth - 2 : (viewportWidth || mountWidth || 320)
  );
  const fromMount = mountNode.clientHeight;
  const fromViewport = view ? view.innerHeight - mountNode.getBoundingClientRect().top : 0;
  const available = fromMount > 40 ? fromMount : fromViewport;
  const usable = available > controllerHeight ? available : controllerHeight + 240;
  const height = Math.max(80, Math.round(usable - controllerHeight));
  return { width, height };
};

const getAIReviewPlayerSize = mountNode => {
  const view = mountNode.ownerDocument.defaultView;
  const rect = mountNode.getBoundingClientRect();
  const mountWidth = mountNode.clientWidth;
  const mountHeight = mountNode.clientHeight;
  const viewportWidth = view?.innerWidth ?? 0;
  const viewportHeight = view ? Math.max(0, view.innerHeight - rect.top) : 0;

  const width = Math.max(320, mountWidth > 40 ? mountWidth : (viewportWidth || mountWidth));
  const available = mountHeight > 40 ? mountHeight : viewportHeight;
  const embeddedAvailable = available > AI_REVIEW_PLAYER_CONTROLLER_H
    ? available
    : AI_REVIEW_PLAYER_CONTROLLER_H + 320;
  const height = Math.max(80, Math.round(embeddedAvailable - AI_REVIEW_PLAYER_CONTROLLER_H));
  return { width, height };
};

export const getPlayerSize = (
  mountNode,
  isEmbedded,
  isAIReviewDashboardEmbed = false,
  controllerHeight = PLAYER_CONTROLLER_H
) => {
  if (!isAIReviewDashboardEmbed) {
    return getLegacyPlayerSize(mountNode, controllerHeight);
  }
  return getAIReviewPlayerSize(mountNode);
};

export const fitEmbeddedPlayerToMount = (player, mountNode, isEmbedded, isAIReviewDashboardEmbed) => {
  if (!isAIReviewDashboardEmbed || !player || !mountNode || !isEmbedded) {
    return;
  }
  const size = getPlayerSize(mountNode, isEmbedded, true);
  try {
    if (typeof player.$set === 'function') {
      player.$set(size);
    }
    if (typeof player.triggerResize === 'function') {
      player.triggerResize();
    }
  } catch (error) {
    /* noop */
  }
};

const useBehaviorLensEmbedFlags = search => useMemo(() => {
  const searchParams = new URLSearchParams(search);
  const isEmbedded = searchParams.get('embed') === '1';
  return {
    isEmbedded,
    isAIReviewDashboardEmbed: isEmbedded && searchParams.get('source') === AI_REVIEW_DASHBOARD_EMBED_SOURCE
  };
}, [search]);

const useAgentUserActivityBarVisibility = isAIReviewDashboardEmbed => {
  const [visible, setVisible] = useState(!isAIReviewDashboardEmbed);

  useEffect(() => {
    if (!isAIReviewDashboardEmbed) {
      setVisible(true);
      return undefined;
    }

    setVisible(false);
  }, [isAIReviewDashboardEmbed]);

  useMessageBus({
    allowedOrigins: [window.location.origin],
    on: {
      'behaviorlens:setAgentUserActivityBarVisible': data => {
        if (!isAIReviewDashboardEmbed) return;
        setVisible(Boolean(data.visible));
      }
    }
  });

  return !isAIReviewDashboardEmbed || visible;
};

export const useBehaviorLensEmbedConfig = search => {
  const flags = useBehaviorLensEmbedFlags(search);
  return {
    ...flags,
    showAgentUserActivityBar: useAgentUserActivityBarVisibility(flags.isAIReviewDashboardEmbed)
  };
};
