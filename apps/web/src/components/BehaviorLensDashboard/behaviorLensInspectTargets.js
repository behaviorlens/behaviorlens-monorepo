import { INTERACTIVE_SELECTOR, readDocumentRect, resolveClickableElement } from './behaviorLensClickMap';
import { describeLiveElement } from './behaviorLensElementLabels';

// Everything Inspect Mode can inspect, collected from the rendered page view.
//
// Inspect Mode has always been able to inspect any element under the cursor;
// what it could not do was *show* which ones those are, so a reviewer had to
// sweep the page with the mouse to find out. This module answers that: it
// enumerates the semantic, interactive elements of the reconstructed document
// so they can all be outlined at once and listed in the rail.
//
// The set is the same one the click pipeline treats as a click target, so an
// outlined element and a click hotspot always mean the same thing.

const MINIMUM_TARGET_SIZE_PX = 6;
// A wrapper that merely contains other targets is not itself worth outlining.
// Anything this much larger than a target it fully contains is dropped.
const CONTAINER_AREA_RATIO = 2.5;

const isRenderedElement = element => {
  const view = element?.ownerDocument?.defaultView;
  const style = view?.getComputedStyle?.(element);
  if (!style) {
    // Without a computed style there is nothing to disprove; the rect check
    // below still applies.
    return true;
  }
  return style.display !== 'none'
    && style.visibility !== 'hidden'
    && style.opacity !== '0';
};

const contains = (outer, inner) => (
  outer.left <= inner.left + 1
  && outer.top <= inner.top + 1
  && outer.right >= inner.right - 1
  && outer.bottom >= inner.bottom - 1
);

const area = rect => rect.width * rect.height;

// Smallest first, so a genuine control is accepted before the wrapper around
// it is considered.
export const dropContainerTargets = targets => {
  const bySize = targets.slice().sort((left, right) => area(left.rect) - area(right.rect));
  return bySize.reduce((accepted, candidate) => {
    const wrapsAccepted = accepted.some(target => (
      contains(candidate.rect, target.rect)
      && area(candidate.rect) > area(target.rect) * CONTAINER_AREA_RATIO
    ));
    return wrapsAccepted ? accepted : [...accepted, candidate];
  }, []);
};

export const collectInspectTargets = ({ documentNode, mirror }) => {
  if (!documentNode?.querySelectorAll || !mirror?.getId) {
    return [];
  }
  const seen = new Set();
  const targets = [];

  Array.from(documentNode.querySelectorAll(INTERACTIVE_SELECTOR)).forEach(candidate => {
    const element = resolveClickableElement(candidate) || candidate;
    if (element?.nodeType !== 1 || seen.has(element)) {
      return;
    }
    seen.add(element);
    const nodeId = mirror.getId(element);
    if (!Number.isFinite(nodeId) || nodeId < 0) {
      // Not part of the recording's mirror: no honest evidence can be shown
      // for it, so it is not offered as an inspect target.
      return;
    }
    const rect = readDocumentRect(element);
    if (!rect || rect.width < MINIMUM_TARGET_SIZE_PX || rect.height < MINIMUM_TARGET_SIZE_PX) {
      return;
    }
    if (!isRenderedElement(element)) {
      return;
    }
    targets.push({
      element,
      label: describeLiveElement(element) || element.tagName.toLowerCase(),
      nodeId,
      rect,
      tagName: element.tagName.toLowerCase()
    });
  });

  // Reading order, so the rail list matches the page top to bottom.
  return dropContainerTargets(targets)
    .sort((left, right) => left.rect.top - right.rect.top || left.rect.left - right.rect.left);
};

// Hit testing against the collected targets, in document coordinates.
//
// Inspect Mode does not rely on the reconstructed iframe receiving mouse
// events: rrweb sandboxes that iframe, and any style or stacking change around
// it would silently take pointing away again. The target boxes are already
// measured, so the overlay does its own hit testing over them and the two can
// never disagree about what is inspectable.
//
// The smallest box wins, so a control nested inside a larger one is chosen
// rather than its container.
export const findInspectTargetAtPoint = (targets, documentX, documentY) => {
  const x = Number(documentX);
  const y = Number(documentY);
  if (!Array.isArray(targets) || !Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return targets.reduce((best, target) => {
    const { rect } = target;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      return best;
    }
    const size = rect.width * rect.height;
    return !best || size < best.rect.width * best.rect.height ? target : best;
  }, null);
};

// The plain, serialisable shape the rail lists. DOM nodes stay inside the
// stage; React state only ever holds recording data.
export const toInspectTargetSummary = target => ({
  documentTop: target.rect.top,
  height: target.rect.height,
  label: target.label,
  nodeId: target.nodeId,
  tagName: target.tagName,
  width: target.rect.width
});
