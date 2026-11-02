import { useEffect, useLayoutEffect, useRef } from 'react';
import RrwebPlayer from 'rrweb-player';
import { clampPageInsightsOffset } from './behaviorLensPageInsightsScope';

// Shared, paused rrweb surface for Page Insights. Every mode receives the
// same privacy-masked reconstructed DOM and owns no second replay contract.
//
// The player is created at the recorded viewport width and then resized in
// place to the measured document height, so the reviewer scrolls the real page
// instead of a clipped viewport. It is never played.
export const usePageInsightsSnapshot = ({
  contentHeight, contentWidth, events, mountRef, onReady, replayDurationMs, targetOffset
}) => {
  const playerRef = useRef(null);
  const lastTargetOffsetRef = useRef(null);
  const contentWidthRef = useRef(contentWidth);
  const targetOffsetRef = useRef(targetOffset);
  contentWidthRef.current = contentWidth;
  targetOffsetRef.current = targetOffset;

  useLayoutEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode || !Array.isArray(events) || events.length === 0) {
      onReady(null);
      return undefined;
    }

    // Hide the previous frame before its evidence window changes. rrweb then
    // publishes one paused frame at the requested replay-relative offset.
    onReady(null);
    mountNode.innerHTML = '';
    let player = null;
    let confirmSeekTimer = null;
    try {
      // The stage can be temporarily narrow or collapsed while Page Insights
      // is mounted after a tab switch. Starting rrweb at that transient width
      // reflows the recorded document before its full-page geometry is
      // measured, leaving the snapshot and overlays permanently misaligned.
      // Prefer the viewport width stored in the recording from the very first
      // render; the resize effects below still own the final document height.
      const recordedContentWidth = Number(contentWidthRef.current);
      player = new RrwebPlayer({
        target: mountNode,
        props: {
          events,
          autoPlay: false,
          skipInactive: false,
          showController: false,
          mouseTail: false,
          width: Number.isFinite(recordedContentWidth) && recordedContentWidth > 0
            ? recordedContentWidth
            : Math.max(320, mountNode.clientWidth || 960),
          height: Math.max(240, mountNode.clientHeight || 540)
        }
      });
      playerRef.current = player;
      const replayer = typeof player.getReplayer === 'function' ? player.getReplayer() : null;
      const totalTime = replayer?.getMetaData?.()?.totalTime;
      const duration = Number.isFinite(totalTime) ? totalTime : replayDurationMs;
      const target = clampPageInsightsOffset(targetOffsetRef.current, duration);
      if (typeof player.goto === 'function') {
        player.goto(target, false);
      }
      player.pause?.();
      lastTargetOffsetRef.current = target;
      onReady(player);

      // rrweb creates its iframe synchronously, but its first seek can land
      // before the reconstructed document has finished attaching. This is
      // most visible after Session Replay is unmounted and Page Insights is
      // mounted again: the first goto can leave only a fragment of the page.
      // Confirm the seek once the player has crossed an event-loop boundary.
      // State-to-state navigation still uses the fast in-place effect below.
      confirmSeekTimer = setTimeout(() => {
        if (playerRef.current !== player) {
          return;
        }
        const latestReplayer = typeof player.getReplayer === 'function'
          ? player.getReplayer()
          : null;
        const latestTotalTime = latestReplayer?.getMetaData?.()?.totalTime;
        const latestDuration = Number.isFinite(latestTotalTime)
          ? latestTotalTime
          : replayDurationMs;
        const confirmedTarget = clampPageInsightsOffset(
          targetOffsetRef.current,
          latestDuration
        );
        player.goto?.(confirmedTarget, false);
        player.pause?.();
        lastTargetOffsetRef.current = confirmedTarget;
        onReady(player);
      }, 50);
    } catch (error) {
      try {
        player?.$destroy?.();
      } catch (destroyError) {
        /* noop */
      }
      playerRef.current = null;
      onReady(false);
      return undefined;
    }

    return () => {
      clearTimeout(confirmSeekTimer);
      try {
        player?.$destroy?.();
      } catch (error) {
        /* noop */
      }
      playerRef.current = null;
      lastTargetOffsetRef.current = null;
    };
  }, [events, mountRef, onReady, replayDurationMs]);

  // Recorded-state changes reuse the existing rrweb instance. Recreating the
  // player here would replay the entire event stream and rebuild the iframe on
  // every selection. The stage independently invalidates its geometry and
  // overlays until this sought frame has been measured again.
  useLayoutEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const replayer = typeof player.getReplayer === 'function' ? player.getReplayer() : null;
    const totalTime = replayer?.getMetaData?.()?.totalTime;
    const duration = Number.isFinite(totalTime) ? totalTime : replayDurationMs;
    const target = clampPageInsightsOffset(targetOffset, duration);
    if (lastTargetOffsetRef.current === target) {
      return;
    }
    try {
      player.goto?.(target, false);
      player.pause?.();
      lastTargetOffsetRef.current = target;
      onReady(player);
    } catch (error) {
      onReady(false);
    }
  }, [onReady, replayDurationMs, targetOffset]);

  useEffect(() => {
    const mountNode = mountRef.current;
    const ownsFullPageSize = Number.isFinite(contentWidth) && contentWidth > 0
      && Number.isFinite(contentHeight) && contentHeight > 0;
    if (!mountNode || ownsFullPageSize || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      try {
        player.$set?.({
          width: Number.isFinite(contentWidth) && contentWidth > 0
            ? contentWidth
            : Math.max(320, mountNode.clientWidth || 960),
          height: Number.isFinite(contentHeight) && contentHeight > 0
            ? contentHeight
            : Math.max(240, mountNode.clientHeight || 540)
        });
        player.triggerResize?.();
      } catch (error) {
        /* noop */
      }
    });
    observer.observe(mountNode);
    return () => observer.disconnect();
  }, [contentHeight, contentWidth, mountRef]);

  return playerRef;
};

export const getPageInsightsFrameDocument = (mountNode, player) => (
  player?.getReplayer?.()?.iframe?.contentDocument
  || mountNode?.querySelector?.('iframe')?.contentDocument
  || null
);

export const getPageInsightsMirror = player => (
  player?.getMirror?.() || player?.getReplayer?.()?.getMirror?.() || null
);

const setFullPageSize = (node, width, height) => {
  if (!node) {
    return;
  }
  node.style.setProperty('width', `${width}px`, 'important');
  node.style.setProperty('height', `${height}px`, 'important');
};

// rrweb-player normally centers a recorded viewport inside its frame with a
// translated/scaled .replayer-wrapper. Scroll Map needs a different contract:
// one iframe viewport as tall as the reconstructed document, anchored at 0,0.
export const fitPageInsightsSnapshotToFullDocument = ({
  geometry, mountNode, player
}) => {
  const width = Number(geometry?.width);
  const height = Number(geometry?.height);
  if (!(width > 0) || !(height > 0) || !mountNode || !player) {
    return false;
  }
  const frameDocument = getPageInsightsFrameDocument(mountNode, player);
  const iframe = player?.getReplayer?.()?.iframe
    || mountNode.querySelector?.('iframe')
    || null;
  const wrapper = iframe?.closest?.('.replayer-wrapper');
  const playerFrame = mountNode.querySelector?.('.rr-player__frame');
  const playerNode = mountNode.querySelector?.('.rr-player');

  setFullPageSize(mountNode, width, height);
  setFullPageSize(playerNode, width, height);
  setFullPageSize(playerFrame, width, height);
  setFullPageSize(wrapper, width, height);
  setFullPageSize(iframe, width, height);
  if (wrapper) {
    wrapper.style.setProperty('left', '0', 'important');
    wrapper.style.setProperty('top', '0', 'important');
    wrapper.style.setProperty('float', 'none', 'important');
    wrapper.style.setProperty('transform', 'none', 'important');
    wrapper.style.setProperty('transform-origin', 'left top', 'important');
  }
  if (iframe) {
    iframe.setAttribute('width', String(width));
    iframe.setAttribute('height', String(height));
  }
  frameDocument?.defaultView?.scrollTo?.(0, 0);
  if (frameDocument?.documentElement) {
    frameDocument.documentElement.scrollTop = 0;
    frameDocument.documentElement.scrollLeft = 0;
  }
  if (frameDocument?.body) {
    frameDocument.body.scrollTop = 0;
    frameDocument.body.scrollLeft = 0;
  }
  return true;
};

export default usePageInsightsSnapshot;
