import { useCallback, useLayoutEffect, useState } from 'react';

const FADE_DISTANCE = 96;

export const getScrollFadeOpacity = distance => {
  return Math.min(1, Math.max(0, Number(distance) || 0) / FADE_DISTANCE);
};

const assignRef = (ref, value) => {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
};

const useScrollEdgeFades = (contentKey, externalRef = null) => {
  const [node, setNode] = useState(null);
  const [fades, setFades] = useState({ bottom: 0, top: 0 });
  const scrollRef = useCallback(nextNode => {
    setNode(nextNode);
    assignRef(externalRef, nextNode);
  }, [externalRef]);

  useLayoutEffect(() => {
    if (!node) {
      setFades({ bottom: 0, top: 0 });
      return undefined;
    }

    const updateFades = () => {
      const remaining = Math.max(0, node.scrollHeight - node.scrollTop - node.clientHeight);
      const next = {
        bottom: getScrollFadeOpacity(remaining),
        top: getScrollFadeOpacity(node.scrollTop)
      };
      setFades(current => (
        current.bottom === next.bottom && current.top === next.top ? current : next
      ));
    };

    updateFades();
    node.addEventListener('scroll', updateFades, { passive: true });
    if (typeof ResizeObserver === 'undefined') {
      return () => node.removeEventListener('scroll', updateFades);
    }

    const observer = new ResizeObserver(updateFades);
    observer.observe(node);
    if (node.firstElementChild) {
      observer.observe(node.firstElementChild);
    }
    return () => {
      node.removeEventListener('scroll', updateFades);
      observer.disconnect();
    };
  }, [contentKey, node]);

  return { fadeBottom: fades.bottom, fadeTop: fades.top, scrollRef };
};

export default useScrollEdgeFades;
