export const MIN_SESSION_PAGE_SIZE = 3;
// Hard cap so a single page cannot request an unbounded catalog. Matches the
// largest Show-dropdown option.
export const MAX_SESSION_PAGE_SIZE = 100;
export const SESSION_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_SESSION_PAGE_SIZE = 25;

export const normalizeSessionPageSize = value => {
  const parsed = Number(value);
  return SESSION_PAGE_SIZE_OPTIONS.includes(parsed)
    ? parsed
    : DEFAULT_SESSION_PAGE_SIZE;
};

export const SESSION_ROW_MIN_HEIGHT = 62;
// Auto-fit (for list scrolling) drops after a chip-row-sized shrink (~28px).
export const SESSION_LIST_PAGE_SIZE_SHRINK_SLACK = 16;
export const SESSION_ROW_SELECTOR = '[data-session-row]:not([data-session-skeleton])';
export const SESSION_LIST_SHELL_SELECTOR = '[data-behaviorlens-shell]';
export const PLAYLIST_CARD_SELECTOR = '[data-behaviorlens-playlist]';
export const SESSION_PAGER_SELECTOR = '[data-session-pager]';
// Desktop reservation: playlist card padding-bottom (24) + pager margin (24)
// + pager height (32). Narrow layouts compact these, so the real values are
// measured when possible and this constant stays the fallback.
export const SESSION_LIST_BELOW_PANE = 80;

// Whole rows that currently fit in the pane, with no three-row floor. 0 means
// the pane has not been measured yet (or cannot fit a row).
export const countVisibleSessionRows = (
  availableHeight,
  rowHeight = SESSION_ROW_MIN_HEIGHT
) => {
  if (!(availableHeight > 0) || !(rowHeight > 0)) {
    return 0;
  }

  return Math.floor(availableHeight / rowHeight);
};

// Whole rows only: a leftover slice of a row is not counted, and a short
// list still asks for three sessions instead of shrinking to a single row.
export const countFittingSessionRows = (
  availableHeight,
  rowHeight = SESSION_ROW_MIN_HEIGHT
) => Math.max(MIN_SESSION_PAGE_SIZE, countVisibleSessionRows(availableHeight, rowHeight));

// Inner list scroll is for overflow we can actually use: more sessions
// requested than currently fit, or more painted rows than whole rows that
// fit (the three-row floor on a short pane). An unmeasured pane
// (visibleRowCount 0) must not enable the short-pane branch, or a 25-row
// request would always look overflowed in jsdom before the first measure.
export const sessionListShouldScroll = (
  rowCount,
  visibleRowCount,
  pageSize,
  autoFitPageSize
) => (
  pageSize > autoFitPageSize
  || (visibleRowCount > 0 && rowCount > visibleRowCount)
);

export const measureSessionRowHeights = viewport => {
  const realRows = [...(viewport?.querySelectorAll(SESSION_ROW_SELECTOR) || [])];
  const rows = realRows.length
    ? realRows
    : [...(viewport?.querySelectorAll('[data-session-row]') || [])];
  return rows
    .map(row => Math.round(row.getBoundingClientRect().height))
    .filter(height => height > 0);
};

export const measureSessionRowHeight = (viewport, fallback = SESSION_ROW_MIN_HEIGHT) => {
  const heights = measureSessionRowHeights(viewport);
  return heights.length ? Math.min(...heights) : fallback;
};

// Tags and bookmarks make later rows taller. Keep the shorter typical height
// from the first real measure so those pages do not request fewer sessions.
export const pickCachedSessionRowHeight = (cachedHeight, measuredHeight) => {
  if (!(measuredHeight > 0)) {
    return cachedHeight;
  }

  if (!(cachedHeight > SESSION_ROW_MIN_HEIGHT) || measuredHeight < cachedHeight) {
    return measuredHeight;
  }

  return cachedHeight;
};

// Page size follows the pane, not the current row mix. Taller tagged rows
// must not drop a page that already fit; a shorter window still can.
export const pickSessionListPageSize = ({
  availableHeight,
  measuredSize,
  previousAvailableHeight,
  previousSize
}) => {
  const viewportShrunk = previousAvailableHeight > 0
    && availableHeight + SESSION_LIST_PAGE_SIZE_SHRINK_SLACK < previousAvailableHeight;

  if (viewportShrunk) {
    return measuredSize;
  }

  return Math.max(previousSize, measuredSize);
};

// Resize events can shrink the pane by a few pixels at a time. Keep the
// height from the last grow or page-size change so those steps still count
// as one viewport shrink against the original 6-row pane.
export const pickSessionListAvailableHeightBaseline = (
  availableHeight,
  previousBaseline,
  pageSizeChanged
) => {
  if (!(availableHeight > 0)) {
    return previousBaseline;
  }
  if (pageSizeChanged || availableHeight > previousBaseline) {
    return availableHeight;
  }
  return previousBaseline;
};

const getVisibleViewportBottom = () => {
  const viewHeight = window.visualViewport?.height ?? window.innerHeight ?? 0;
  const viewTop = window.visualViewport?.offsetTop ?? 0;
  return viewTop + viewHeight;
};

// Space reserved under the list pane: the pager, its margin and the playlist
// card padding-bottom. Responsive breakpoints compact them, so the rendered
// values win whenever they can be read; anything unmeasurable (jsdom, loading,
// error state) falls back to the desktop reservation.
export const measureSessionListBelowPane = viewport => {
  const card = viewport?.closest?.(PLAYLIST_CARD_SELECTOR) || null;
  const pager = card?.querySelector?.(SESSION_PAGER_SELECTOR) || null;
  if (!pager) {
    return SESSION_LIST_BELOW_PANE;
  }

  const computedStyle = typeof window !== 'undefined' && window.getComputedStyle
    ? window.getComputedStyle(pager)
    : null;
  const cardStyle = card && window.getComputedStyle ? window.getComputedStyle(card) : null;
  const measured = (
    Number(pager.offsetHeight || 0)
    + (Number.parseFloat(computedStyle?.marginTop) || 0)
    + (Number.parseFloat(cardStyle?.paddingBottom) || 0)
  );

  return measured > 0 ? Math.ceil(measured) : SESSION_LIST_BELOW_PANE;
};

export const measureAvailableSessionListHeight = viewport => {
  if (!viewport) {
    return 0;
  }

  const belowPane = measureSessionListBelowPane(viewport);
  const paneHeight = Number(viewport.clientHeight || 0);
  const paneTop = viewport.getBoundingClientRect().top;
  const viewBottom = getVisibleViewportBottom();
  const shell = viewport.closest?.(SESSION_LIST_SHELL_SELECTOR);
  const shellBottom = shell ? shell.getBoundingClientRect().bottom : viewBottom;
  const bottom = Math.min(shellBottom || viewBottom, viewBottom);
  const fromWindow = Math.floor(bottom - paneTop - belowPane);

  // Unused window below an unstretched pane → grow. A stretched pane taller
  // than the visible window (the user shrank the viewport) → follow the
  // window, not the leftover content height.
  if (paneTop > 0 && fromWindow > 0) {
    const windowHasUnusedSpace = fromWindow > paneHeight + SESSION_ROW_MIN_HEIGHT;
    const paneOverflowsWindow = paneHeight > fromWindow + SESSION_LIST_PAGE_SIZE_SHRINK_SLACK;
    if (windowHasUnusedSpace || paneOverflowsWindow) {
      return Math.max(0, fromWindow);
    }
  }

  if (paneHeight > 0) {
    return paneHeight;
  }

  if (paneTop > 0) {
    return Math.max(0, fromWindow);
  }

  return 0;
};

const measureTypicalSessionRowLayout = (viewport, cachedRowHeight = SESSION_ROW_MIN_HEIGHT) => {
  const availableHeight = measureAvailableSessionListHeight(viewport);
  const heights = measureSessionRowHeights(viewport);
  const measuredMin = heights.length ? Math.min(...heights) : 0;
  const typicalRowHeight = cachedRowHeight > SESSION_ROW_MIN_HEIGHT && measuredMin > 0
    ? Math.min(measuredMin, cachedRowHeight)
    : (measuredMin || cachedRowHeight);

  return { availableHeight, heights, typicalRowHeight };
};

export const measureVisibleSessionRowCount = (
  viewport,
  cachedRowHeight = SESSION_ROW_MIN_HEIGHT
) => {
  if (!viewport) {
    return 0;
  }

  const { availableHeight, heights, typicalRowHeight } = measureTypicalSessionRowLayout(
    viewport,
    cachedRowHeight
  );

  if (heights.length > 0 && availableHeight > 0 && typicalRowHeight > 0) {
    const usedHeight = heights.reduce((sum, height) => sum + height, 0);
    if (usedHeight <= availableHeight) {
      return heights.length + Math.floor((availableHeight - usedHeight) / typicalRowHeight);
    }
  }

  return countVisibleSessionRows(availableHeight, typicalRowHeight);
};

export const measureSessionListPageSize = (viewport, cachedRowHeight = SESSION_ROW_MIN_HEIGHT) => {
  if (!viewport) {
    return MIN_SESSION_PAGE_SIZE;
  }

  return Math.max(MIN_SESSION_PAGE_SIZE, measureVisibleSessionRowCount(viewport, cachedRowHeight));
};
