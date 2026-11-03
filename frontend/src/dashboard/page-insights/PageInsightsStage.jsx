import React, {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import {
  FullPageOverlay,
  InsightsSnapshotMount,
  InsightsStage,
  InsightsStateBody,
  InsightsStatePanel,
  InsightsStateTitle,
  InsightsStateWrap,
  ScrollFullPageFrame,
  ScrollFullPageSurface
} from './ScBehaviorLensPageInsights';
import {
  measureReconstructedDocumentGeometry,
  measureReconstructedDocumentGeometryAtViewport
} from './behaviorLensScrollMap';
import {
  fitPageInsightsSnapshotToFullDocument,
  getPageInsightsFrameDocument,
  getPageInsightsMirror,
  usePageInsightsSnapshot
} from './usePageInsightsSnapshot';

// One full-page reconstruction shared by Click Maps, Scroll Maps and Inspect
// Mode.
//
// The page is rendered at the width it was recorded at, so its layout is the
// layout the person actually saw, and at its true document height, so the
// reviewer scrolls the real page instead of a clipped viewport. The whole
// frame is then scaled down to fit the stage; overlays receive that scale and
// draw in rendered pixels, which keeps labels and blur radii screen-sized.

// Resizing the iframe to the document height can nudge the document's own
// scrollHeight by a pixel or two (a body sized in viewport units, a scrollbar
// appearing). Accepting those would re-fit, re-measure and oscillate, so a
// measurement has to differ by more than this to count as a real change.
export const GEOMETRY_TOLERANCE_PX = 8;
// display:none and the fullscreen transition both report a 0×0 box. Stamping
// that onto scale / the depth probe unmounts the overlay and looks like a
// broken map. Click Maps already ignores this floor.
const STAGE_LAYOUT_MIN_PX = 2;

const readVisibleStageBox = stageNode => {
  const rect = stageNode?.getBoundingClientRect?.();
  const width = Number(stageNode?.clientWidth) || Number(rect?.width) || 0;
  const height = Number(stageNode?.clientHeight) || Number(rect?.height) || 0;
  return { height, width };
};

const isUsableStageBox = box => (
  box.width >= STAGE_LAYOUT_MIN_PX && box.height >= STAGE_LAYOUT_MIN_PX
);

const getAvailableWidth = stageNode => {
  const { width } = readVisibleStageBox(stageNode);
  // The stage has no padding of its own — the surface fills it, exactly as in
  // Session Replay.
  return width >= STAGE_LAYOUT_MIN_PX ? Math.max(1, width) : null;
};

const isCollapsedGeometry = (previous, next) => (
  Boolean(previous)
  && previous.width === next.width
  && next.height + GEOMETRY_TOLERANCE_PX < previous.height
);

const scheduleAfterLayout = callback => {
  callback();
  if (typeof requestAnimationFrame !== 'function') {
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
};

const PageInsightsStage = ({
  activeMode = null,
  backdropOffset = null,
  children,
  events,
  layoutActive = false,
  muted = false,
  onGeometryChange,
  pageView = null,
  recordedViewport = null,
  replayDurationMs = 0,
  testId = 'behaviorlens-insights-stage'
}) => {
  const stageRef = useRef(null);
  const mountRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(null);
  const [documentGeometry, setDocumentGeometry] = useState(null);
  const [isSeeking, setIsSeeking] = useState(true);
  const [player, setPlayer] = useState(null);
  const [revision, setRevision] = useState(0);
  // The scroll map pins its depth probe to the visible window, so it needs to
  // know where that window currently is.
  const [scrollWindow, setScrollWindow] = useState({
    scrollLeft: 0, scrollTop: 0, viewportHeight: 0, viewportWidth: 0
  });
  const lastPublished = useRef(null);
  const stageScrollCleanupRef = useRef(null);
  // The frame the page is drawn at. Chosen by behaviorLensReplayFrames from the
  // recording's own mutations — the frame that still contains the most of what
  // was clicked — falling back to the page view's last frame.
  const targetOffset = Number.isFinite(Number(backdropOffset))
    ? Number(backdropOffset)
    : (Number(pageView?.endOffset) || 0);
  const recordedWidth = Number(pageView?.viewport?.width) || Number(recordedViewport?.width) || null;
  const recordedHeight = Number(pageView?.viewport?.height)
    || Number(recordedViewport?.height)
    || null;

  const handleSnapshotReady = useCallback(nextPlayer => {
    if (nextPlayer === null) {
      setDocumentGeometry(null);
    } else if (nextPlayer) {
      // The snapshot hook republishes the same player after its mount-time
      // confirmation seek. A state setter alone would bail out for the same
      // object, so advance the revision to remeasure geometry and overlays.
      setRevision(current => current + 1);
    }
    setPlayer(nextPlayer);
  }, []);

  const snapshotPlayerRef = usePageInsightsSnapshot({
    contentHeight: documentGeometry?.height,
    contentWidth: documentGeometry?.width || recordedWidth,
    events,
    mountRef,
    onReady: handleSnapshotReady,
    replayDurationMs,
    targetOffset
  });

  useLayoutEffect(() => {
    setIsSeeking(true);
    setDocumentGeometry(null);
    lastPublished.current = null;
    onGeometryChange(null);
  }, [onGeometryChange, targetOffset]);

  useEffect(() => {
    const stageNode = stageRef.current;
    if (!stageNode) {
      return undefined;
    }
    let frame = 0;
    const publishScroll = () => {
      frame = 0;
      const box = readVisibleStageBox(stageNode);
      if (!isUsableStageBox(box)) {
        return;
      }
      setScrollWindow(current => {
        const next = {
          scrollLeft: stageNode.scrollLeft,
          scrollTop: stageNode.scrollTop,
          viewportHeight: box.height,
          viewportWidth: box.width
        };
        return current.scrollLeft === next.scrollLeft
          && current.scrollTop === next.scrollTop
          && current.viewportHeight === next.viewportHeight
          && current.viewportWidth === next.viewportWidth
          ? current
          : next;
      });
    };
    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(publishScroll)
        : (publishScroll(), 0);
    };
    stageNode.addEventListener('scroll', onScroll, { passive: true });
    publishScroll();
    stageScrollCleanupRef.current = () => {
      stageNode.removeEventListener('scroll', onScroll);
      if (frame && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frame);
      }
    };
    const publishLayout = () => {
      const width = getAvailableWidth(stageNode);
      if (width) {
        setAvailableWidth(width);
      }
      publishScroll();
    };
    const refitFullDocument = () => {
      publishLayout();
      const currentPlayer = snapshotPlayerRef.current;
      const geometry = lastPublished.current;
      // rrweb triggerResize sizes the iframe to the visible fold. Scroll Maps
      // has already stretched that iframe to the document; calling it here
      // collapses overlays, the heatmap, and the depth probe to one screen.
      if (currentPlayer && geometry) {
        fitPageInsightsSnapshotToFullDocument({
          geometry,
          mountNode: mountRef.current,
          player: currentPlayer
        });
      }
      setRevision(current => current + 1);
    };
    publishLayout();
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(publishLayout);
    observer?.observe(stageNode);
    const onFullscreenChange = () => scheduleAfterLayout(refitFullDocument);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      observer?.disconnect();
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      stageScrollCleanupRef.current?.();
    };
  }, [snapshotPlayerRef]);

  useEffect(() => {
    if (!layoutActive) {
      return undefined;
    }
    const refitVisibleStage = () => {
      const stageNode = stageRef.current;
      if (!stageNode) {
        return;
      }
      const width = getAvailableWidth(stageNode);
      if (width) {
        setAvailableWidth(width);
      }
      const box = readVisibleStageBox(stageNode);
      if (isUsableStageBox(box)) {
        setScrollWindow(current => {
          const next = {
            scrollLeft: stageNode.scrollLeft,
            scrollTop: stageNode.scrollTop,
            viewportHeight: box.height,
            viewportWidth: box.width
          };
          return current.scrollLeft === next.scrollLeft
            && current.scrollTop === next.scrollTop
            && current.viewportHeight === next.viewportHeight
            && current.viewportWidth === next.viewportWidth
            ? current
            : next;
        });
      }
      const currentPlayer = snapshotPlayerRef.current;
      const geometry = lastPublished.current;
      if (currentPlayer && geometry) {
        fitPageInsightsSnapshotToFullDocument({
          geometry,
          mountNode: mountRef.current,
          player: currentPlayer
        });
      }
    };
    scheduleAfterLayout(refitVisibleStage);
    return undefined;
  }, [layoutActive, snapshotPlayerRef]);

  useEffect(() => {
    if (!player) {
      return undefined;
    }
    const publishGeometry = () => {
      const frameDocument = getPageInsightsFrameDocument(mountRef.current, player);
      let measured = measureReconstructedDocumentGeometry(frameDocument);
      if (!measured) {
        return;
      }
      const previous = lastPublished.current;
      if (
        previous
        && previous.width === (recordedWidth || measured.width)
        && measured.height > previous.height + GEOMETRY_TOLERANCE_PX
      ) {
        const iframe = player?.getReplayer?.()?.iframe
          || mountRef.current?.querySelector?.('iframe')
          || null;
        measured = measureReconstructedDocumentGeometryAtViewport({
          documentNode: frameDocument,
          frameElement: iframe,
          viewportHeight: recordedHeight
        }) || measured;
      }
      // Width is the recorded viewport width whenever the recording carries
      // one: reflowing the page to a different width would show a layout the
      // person never saw.
      const geometry = {
        height: measured.height,
        width: recordedWidth || measured.width
      };
      if (frameDocument.documentElement) {
        frameDocument.documentElement.scrollTop = 0;
        frameDocument.documentElement.scrollLeft = 0;
      }
      if (frameDocument.body) {
        frameDocument.body.scrollTop = 0;
        frameDocument.body.scrollLeft = 0;
      }
      if (
        previous
        && previous.width === geometry.width
        && Math.abs(previous.height - geometry.height) <= GEOMETRY_TOLERANCE_PX
      ) {
        return;
      }
      if (isCollapsedGeometry(previous, geometry)) {
        fitPageInsightsSnapshotToFullDocument({
          geometry: previous,
          mountNode: mountRef.current,
          player
        });
        return;
      }
      lastPublished.current = geometry;
      setDocumentGeometry(geometry);
      setIsSeeking(false);
      onGeometryChange(geometry);
      // Overlays re-project on this: it is the signal that element boxes in
      // the reconstructed page are measurable at their final positions.
      setRevision(current => current + 1);
    };
    const frame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(publishGeometry)
      : 0;
    const shortTimeout = setTimeout(publishGeometry, 50);
    const settledTimeout = setTimeout(publishGeometry, 300);
    const frameDocument = getPageInsightsFrameDocument(mountRef.current, player);
    const observer = typeof ResizeObserver !== 'undefined' && frameDocument
      ? new ResizeObserver(publishGeometry)
      : null;
    if (frameDocument?.documentElement) {
      observer?.observe(frameDocument.documentElement);
    }
    if (frameDocument?.body) {
      observer?.observe(frameDocument.body);
    }
    return () => {
      if (frame && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frame);
      }
      clearTimeout(shortTimeout);
      clearTimeout(settledTimeout);
      observer?.disconnect();
    };
  }, [onGeometryChange, player, recordedHeight, recordedWidth, revision, targetOffset]);

  const scale = useMemo(() => {
    const documentWidth = Number(documentGeometry?.width);
    const width = Number(availableWidth);
    if (!(documentWidth > 0) || !(width > 0)) {
      return null;
    }
    return Math.min(1, width / documentWidth);
  }, [availableWidth, documentGeometry]);

  useEffect(() => {
    if (!player || !documentGeometry || !scale) {
      return;
    }
    fitPageInsightsSnapshotToFullDocument({
      geometry: documentGeometry,
      mountNode: mountRef.current,
      player
    });
  }, [documentGeometry, player, scale]);

  const scrollToDocumentY = useCallback(documentY => {
    const stageNode = stageRef.current;
    if (!stageNode || !Number.isFinite(documentY) || !scale) {
      return;
    }
    const target = (documentY * scale) - (stageNode.clientHeight / 2);
    if (typeof stageNode.scrollTo === 'function') {
      stageNode.scrollTo({ behavior: 'smooth', top: Math.max(0, target) });
      return;
    }
    stageNode.scrollTop = Math.max(0, target);
  }, [scale]);

  if (player === false) {
    return (
      <InsightsStage>
        <InsightsStateWrap>
          <InsightsStatePanel role="status">
            <InsightsStateTitle>The page snapshot could not be rendered</InsightsStateTitle>
            <InsightsStateBody>
              This page view could not be reconstructed from the recording, so no
              positions are estimated for it.
            </InsightsStateBody>
          </InsightsStatePanel>
        </InsightsStateWrap>
      </InsightsStage>
    );
  }

  const ready = Boolean(documentGeometry && scale);
  const renderedWidth = ready ? documentGeometry.width * scale : null;
  const renderedHeight = ready ? documentGeometry.height * scale : null;

  return (
    <InsightsStage
      ref={stageRef}
      $fullPage
      className="behaviorlens-workspace-stage"
      data-active-mode={activeMode}
      data-testid={testId}
    >
      <ScrollFullPageFrame
        $ready={ready}
        $width={renderedWidth}
        $height={renderedHeight}
        data-document-height={documentGeometry?.height}
        data-document-width={documentGeometry?.width}
        data-rendered-height={renderedHeight}
        data-scale={scale}
        data-testid="behaviorlens-insights-full-page"
      >
        <ScrollFullPageSurface
          $height={documentGeometry?.height || 540}
          $muted={muted}
          $scale={scale || 1}
          $width={documentGeometry?.width || recordedWidth || 960}
        >
          <InsightsSnapshotMount
            ref={mountRef}
            aria-label="Reconstructed page for this page view"
            data-testid="behaviorlens-insights-snapshot"
          />
        </ScrollFullPageSurface>
        {ready && (
          <FullPageOverlay $height={renderedHeight} $width={renderedWidth}>
            {children({
              documentGeometry,
              frameDocument: getPageInsightsFrameDocument(mountRef.current, player),
              mirror: getPageInsightsMirror(player),
              mountNode: mountRef.current,
              renderedHeight,
              renderedWidth,
              revision,
              scale,
              scrollToDocumentY,
              scrollLeft: scrollWindow.scrollLeft,
              scrollTop: scrollWindow.scrollTop,
              stageViewportHeight: scrollWindow.viewportHeight,
              stageViewportWidth: scrollWindow.viewportWidth
            })}
          </FullPageOverlay>
        )}
      </ScrollFullPageFrame>
      {(player === null || isSeeking) && (
        <InsightsStateWrap $overlay>
          <InsightsStatePanel role="status" data-testid="behaviorlens-insights-loading">
            <InsightsStateTitle>Reconstructing page</InsightsStateTitle>
            <InsightsStateBody>Preparing the full page for this page view.</InsightsStateBody>
          </InsightsStatePanel>
        </InsightsStateWrap>
      )}
    </InsightsStage>
  );
};

PageInsightsStage.propTypes = {
  // Presentational only: the stage never rebuilds for a mode change.
  activeMode: PropTypes.string,
  backdropOffset: PropTypes.number,
  children: PropTypes.func.isRequired,
  events: PropTypes.array.isRequired,
  layoutActive: PropTypes.bool,
  muted: PropTypes.bool,
  onGeometryChange: PropTypes.func.isRequired,
  pageView: PropTypes.object,
  recordedViewport: PropTypes.object,
  replayDurationMs: PropTypes.number,
  testId: PropTypes.string
};

export default PageInsightsStage;
