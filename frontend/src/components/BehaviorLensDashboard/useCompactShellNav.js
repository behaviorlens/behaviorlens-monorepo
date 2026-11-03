import {
  useCallback, useEffect, useRef, useState
} from 'react';

// Shared by the shell stylesheet, the stacked navigation and the surfaces that
// compact with it, so every one of them switches at the same width. It lives
// here because this module imports no other BehaviorLens file.
export const SHELL_COMPACT_MAX_WIDTH = 860;
export const SHELL_COMPACT_MEDIA_QUERY = `(max-width: ${SHELL_COMPACT_MAX_WIDTH}px)`;
export const BEHAVIORLENS_SHELL_COLUMN_GAP = 37;
// Desktop shell inset on every side: sidebar left/top/bottom and page right.
export const BEHAVIORLENS_SHELL_PADDING_X = 24;
// Same inset as Sessions hover top → panel top, used under the last Saved
// Filter row hover so the list fills leftover height before it scrolls.
export const BEHAVIORLENS_SHELL_SIDEBAR_INSET = 24;

const getCompactMediaQueryList = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia(SHELL_COMPACT_MEDIA_QUERY);
};

// Open/closed is deliberately in-memory. `behaviorlens:saved-filters-expanded:v1`
// keeps the desktop Saved Filters list open, and that preference must not
// reopen the whole stacked navigation on a narrow window.
export const useCompactShellNav = () => {
  const [compact, setCompact] = useState(() => Boolean(getCompactMediaQueryList()?.matches));
  const [expanded, setExpanded] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const mediaQueryList = getCompactMediaQueryList();
    if (!mediaQueryList) {
      return undefined;
    }

    const handleChange = event => {
      const isCompact = Boolean(event?.matches ?? mediaQueryList.matches);
      setCompact(isCompact);
      if (!isCompact) {
        setExpanded(false);
      }
    };

    handleChange();

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    }

    // Safari below 14 only exposes the deprecated listener API.
    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, []);

  // Reading the page collapses the stacked navigation, the same way choosing a
  // page does. Scrolling inside the card itself (the Saved Filters list) is
  // deliberately excluded.
  useEffect(() => {
    if (!compact || !expanded) {
      return undefined;
    }

    const handleScroll = event => {
      const { target } = event;
      const scrolledInsideNav = target instanceof Element
        && sidebarRef.current
        && sidebarRef.current.contains(target);

      if (!scrolledInsideNav) {
        setExpanded(false);
      }
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', handleScroll, { capture: true });
  }, [compact, expanded]);

  const toggleExpanded = useCallback(() => setExpanded(previous => !previous), []);

  return {
    compact, expanded, sidebarRef, toggleExpanded
  };
};

export default useCompactShellNav;
