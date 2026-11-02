import React, {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import {
  InspectHitLayer,
  InspectOutline,
  InspectTargetCanvas
} from './ScBehaviorLensPageInsights';
import { describeLiveElement, describeReplayNode } from './behaviorLensElementLabels';
import { readDocumentRect } from './behaviorLensClickMap';
import {
  collectInspectTargets,
  findInspectTargetAtPoint,
  toInspectTargetSummary
} from './behaviorLensInspectTargets';
import { buildFullSelector, buildOptimizedSelector } from './behaviorLensInspect';
import { getHeatmapDevicePixelRatio } from './behaviorLensHeatmap';

const scaleRect = (rect, scale) => (rect ? {
  height: rect.height * scale,
  left: rect.left * scale,
  top: rect.top * scale,
  width: rect.width * scale
} : null);

// Paint every inspectable element as one thin outline on a single canvas.
// A page can hold hundreds of them; one canvas keeps that off the DOM.
export const drawInspectTargets = (canvas, targets, {
  devicePixelRatio = 1, height, mapRect = null, scale = 1, width
} = {}) => {
  if (!canvas) {
    return false;
  }
  const cssWidth = Math.max(0, Number(width) || 0);
  const cssHeight = Math.max(0, Number(height) || 0);
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  const context = canvas.getContext('2d');
  if (!context) {
    return false;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);
  const list = Array.isArray(targets) ? targets : [];
  if (!list.length || cssWidth <= 0 || cssHeight <= 0) {
    return false;
  }
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(20, 99, 255, 0.55)';
  context.fillStyle = 'rgba(20, 99, 255, 0.05)';
  list.forEach(target => {
    const projected = mapRect?.(target.rect) || scaleRect(target.rect, scale);
    const {
      height: rectHeight, left, top, width: rectWidth
    } = projected;
    if (left + rectWidth < 0 || top + rectHeight < 0 || left > cssWidth || top > cssHeight) return;
    context.fillRect(left, top, rectWidth, rectHeight);
    context.strokeRect(left + 0.5, top + 0.5, Math.max(0, rectWidth - 1), Math.max(0, rectHeight - 1));
  });
  return true;
};

// Inspect Mode over the whole reconstructed page view.
//
// Hit testing runs against the real rendered document: whatever the reviewer
// points at is the element, and rrweb's mirror supplies its recording node id
// so the click evidence beside it stays real. The recorded snapshot index is
// consulted only as a labelling fallback — requiring a node to be present in
// it would silently make most of the page uninspectable.
//
// Nothing is selected on open. Every inspectable element is outlined instead,
// so what can be inspected is visible without sweeping the page with a mouse.
const InspectOverlay = ({
  hoveredNodeId,
  nodeIndex,
  onRequestHandled,
  onSelect,
  onTargetsChange,
  requestedNodeId,
  selectedElement,
  showTargets,
  stage
}) => {
  const {
    frameDocument, mirror, renderedHeight, renderedWidth, scale, scrollToDocumentY
  } = stage;
  const canvasRef = useRef(null);
  const [hoverRect, setHoverRect] = useState(null);
  const [selectedRect, setSelectedRect] = useState(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onTargetsChangeRef = useRef(onTargetsChange);
  onTargetsChangeRef.current = onTargetsChange;
  const onRequestHandledRef = useRef(onRequestHandled);
  onRequestHandledRef.current = onRequestHandled;
  const selectedNodeId = selectedElement?.nodeId ?? null;

  const describe = useCallback((element, nodeId) => ({
    fullSelector: buildFullSelector(element),
    label: describeLiveElement(element)
      || describeReplayNode(nodeIndex.get(nodeId))
      || element.tagName.toLowerCase(),
    nodeId,
    optimizedSelector: buildOptimizedSelector(element),
    rect: readDocumentRect(element)
  }), [nodeIndex]);

  // stage.revision changes when the reconstructed page settles, which is when
  // element boxes become measurable.
  const targets = useMemo(
    () => collectInspectTargets({ documentNode: frameDocument, mirror }),
    [frameDocument, mirror, stage.revision]
  );

  useEffect(() => {
    onTargetsChangeRef.current(targets.map(toInspectTargetSummary));
  }, [targets]);

  useEffect(() => {
    if (!showTargets) {
      return;
    }
    try {
      drawInspectTargets(canvasRef.current, targets, {
        devicePixelRatio: renderedHeight > 3000 ? 1 : Math.min(getHeatmapDevicePixelRatio(), 2),
        height: renderedHeight,
        mapRect: stage.documentRectToRendered,
        scale,
        width: renderedWidth
      });
    } catch (error) {
      /* A canvas without a 2D context leaves the outlines unpainted; hover and
         selection still work. */
    }
  }, [renderedHeight, renderedWidth, scale, showTargets, stage.documentRectToRendered, targets]);

  // Pointing happens on the overlay, not inside the reconstructed iframe.
  //
  // rrweb sandboxes that iframe, and any stacking or style change around it
  // would quietly take pointing away again. The target boxes are already
  // measured here, so a pointer position is converted to document coordinates
  // and matched against them — the same list the outlines and the rail show,
  // so the three can never disagree about what is inspectable.
  const targetAtEvent = useCallback(event => {
    const bounds = event.currentTarget?.getBoundingClientRect?.();
    if (!bounds || !(scale > 0)) {
      return null;
    }
    const renderedX = event.clientX - bounds.left;
    const renderedY = event.clientY - bounds.top;
    const point = stage.renderedPointToDocument
      ? stage.renderedPointToDocument(renderedX, renderedY)
      : { x: renderedX / scale, y: renderedY / scale };
    return findInspectTargetAtPoint(targets, point.x, point.y);
  }, [scale, stage, targets]);

  const handlePointerMove = useCallback(event => {
    const target = targetAtEvent(event);
    setHoverRect(target ? target.rect : null);
  }, [targetAtEvent]);

  const handlePointerLeave = useCallback(() => setHoverRect(null), []);

  const handlePointerClick = useCallback(event => {
    const target = targetAtEvent(event);
    if (!target) {
      return;
    }
    const described = describe(target.element, target.nodeId);
    setSelectedRect(described.rect);
    onSelectRef.current(described);
  }, [describe, targetAtEvent]);

  // Keep the selected outline on the element as the page settles or resizes.
  useEffect(() => {
    if (!mirror?.getNode || !Number.isFinite(selectedNodeId)) {
      setSelectedRect(null);
      return;
    }
    const node = mirror.getNode(selectedNodeId);
    setSelectedRect(node?.nodeType === 1 ? readDocumentRect(node) : null);
  }, [mirror, selectedNodeId, stage.revision]);

  // Selecting a row in the rail selects the element on the page and brings it
  // into view.
  //
  // The request is consumed once and cleared. Leaving it set re-applied it on
  // the next render — and because `stage` is rebuilt every render, that was
  // every render — so a rail selection permanently overrode anything the
  // reviewer then pointed at. Depend on the callback, never on `stage`.
  useEffect(() => {
    if (!Number.isFinite(requestedNodeId) || !mirror?.getNode) {
      return;
    }
    const node = mirror.getNode(requestedNodeId);
    if (node?.nodeType !== 1) {
      return;
    }
    onRequestHandledRef.current();
    const described = describe(node, requestedNodeId);
    setSelectedRect(described.rect);
    onSelectRef.current(described);
    if (described.rect) {
      scrollToDocumentY(described.rect.top);
    }
  }, [describe, mirror, requestedNodeId, scrollToDocumentY, stage.revision]);

  const hoveredTarget = Number.isFinite(hoveredNodeId)
    ? targets.find(target => target.nodeId === hoveredNodeId)
    : null;
  const projectRect = stage.documentRectToRendered
    || (rect => scaleRect(rect, scale));
  const hover = projectRect(hoveredTarget ? hoveredTarget.rect : hoverRect);
  const selected = projectRect(selectedRect);

  return (
    <>
      {showTargets && (
        <InspectTargetCanvas
          ref={canvasRef}
          aria-hidden="true"
          data-target-count={targets.length}
          data-testid="behaviorlens-inspect-targets"
        />
      )}
      <InspectHitLayer
        aria-hidden="true"
        data-testid="behaviorlens-inspect-hit-layer"
        onClick={handlePointerClick}
        onMouseLeave={handlePointerLeave}
        onMouseMove={handlePointerMove}
      />
      {hover && <InspectOutline $rect={hover} data-testid="behaviorlens-inspect-hover-outline" />}
      {selected && (
        <InspectOutline
          $rect={selected}
          $selected
          data-testid="behaviorlens-inspect-selected-outline"
        />
      )}
    </>
  );
};

InspectOverlay.defaultProps = {
  hoveredNodeId: null,
  requestedNodeId: null,
  selectedElement: null,
  showTargets: true
};
InspectOverlay.propTypes = {
  hoveredNodeId: PropTypes.number,
  onRequestHandled: PropTypes.func.isRequired,
  nodeIndex: PropTypes.instanceOf(Map).isRequired,
  onSelect: PropTypes.func.isRequired,
  onTargetsChange: PropTypes.func.isRequired,
  requestedNodeId: PropTypes.number,
  selectedElement: PropTypes.object,
  showTargets: PropTypes.bool,
  stage: PropTypes.object.isRequired
};

export default InspectOverlay;
