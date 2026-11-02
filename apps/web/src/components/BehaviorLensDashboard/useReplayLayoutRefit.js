import { useCallback } from 'react';
import { getPlayerSize, WORKSPACE_PLAYER_CONTROLLER_H } from './behaviorLensEmbed';

const useReplayLayoutRefit = ({
  isAIReviewDashboardEmbed,
  isEmbedded,
  playerInstanceRef,
  playerMountRef
}) => useCallback(() => {
  const mountNode = playerMountRef.current;
  const player = playerInstanceRef.current;
  if (!mountNode || !player) return;
  requestAnimationFrame(() => {
    const { width, height } = getPlayerSize(
      mountNode,
      isEmbedded,
      isAIReviewDashboardEmbed,
      isEmbedded ? undefined : WORKSPACE_PLAYER_CONTROLLER_H
    );
    try {
      player.$set?.({ width, height });
      player.triggerResize?.();
    } catch (error) {
      /* A disposed player cannot be refitted. */
    }
  });
}, [isAIReviewDashboardEmbed, isEmbedded, playerInstanceRef, playerMountRef]);

export default useReplayLayoutRefit;
