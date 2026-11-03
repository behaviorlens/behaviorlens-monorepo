import React, {
  useCallback, useEffect, useLayoutEffect, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { getLocalStorage } from '../../lib/storage';

export const DEFAULT_WORKSPACE_RAIL_WIDTH = 556;
export const MIN_WORKSPACE_RAIL_WIDTH = 320;
export const MAX_WORKSPACE_RAIL_WIDTH = 680;
export const MIN_WORKSPACE_STAGE_WIDTH = 520;
export const WORKSPACE_RAIL_WIDTH_STORAGE_KEY = 'behaviorlens:workspace-rail-width:v4';
let workspaceRailWidthMemory = DEFAULT_WORKSPACE_RAIL_WIDTH;

const WorkspaceRailResizeHandle = styled.div`
  position: absolute;
  z-index: 40;
  grid-column: 1 / -1;
  grid-row: 1;
  top: 0;
  left: calc(100% - var(--behaviorlens-workspace-rail-width, 556px) - 6px);
  bottom: 0;
  width: 12px;
  cursor: col-resize;
  touch-action: none;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: ${({ $dragging }) => ($dragging ? '3px' : '1px')};
    background: ${({ $dragging }) => ($dragging ? '#1463ff' : '#dfe5ee')};
    transform: translateX(-50%);
    transition: width 120ms ease, background 120ms ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 42px;
    border: 1px solid #cdd8e8;
    border-radius: 999px;
    background: #ffffff;
    box-shadow: 0 2px 7px rgba(31, 45, 72, 0.14);
    opacity: ${({ $dragging }) => ($dragging ? 1 : 0)};
    transform: translate(-50%, -50%);
    transition: opacity 120ms ease, border-color 120ms ease;
  }

  &:hover::before,
  &:focus-visible::before { width: 3px; background: #1463ff; }
  &:hover::after,
  &:focus-visible::after { border-color: #7ca5f1; opacity: 1; }
  &:focus-visible { outline: none; }

  @media (max-width: 1180px) { display: none; }
`;

export const clampWorkspaceRailWidth = (width, containerWidth = Infinity) => {
  const hasUsableContainerWidth = Number.isFinite(containerWidth)
    && containerWidth >= MIN_WORKSPACE_STAGE_WIDTH + MIN_WORKSPACE_RAIL_WIDTH;
  const availableMaximum = hasUsableContainerWidth
    ? Math.max(MIN_WORKSPACE_RAIL_WIDTH, containerWidth - MIN_WORKSPACE_STAGE_WIDTH)
    : MAX_WORKSPACE_RAIL_WIDTH;
  const maximum = Math.min(MAX_WORKSPACE_RAIL_WIDTH, availableMaximum);
  const numericWidth = width === null || width === '' ? NaN : Number(width);
  const normalizedWidth = Number.isFinite(numericWidth)
    ? numericWidth
    : DEFAULT_WORKSPACE_RAIL_WIDTH;
  return Math.round(Math.min(maximum, Math.max(MIN_WORKSPACE_RAIL_WIDTH, normalizedWidth)));
};

const readWorkspaceRailWidth = () => {
  try {
    const storage = typeof window === 'undefined'
      ? null
      : getLocalStorage();
    if (!storage) {
      return workspaceRailWidthMemory;
    }
    const storedWidth = storage.getItem(WORKSPACE_RAIL_WIDTH_STORAGE_KEY);
    if (storedWidth !== null) {
      workspaceRailWidthMemory = clampWorkspaceRailWidth(storedWidth);
    }
  } catch (error) {
    // Fall back to the preference retained by this browser tab's JS runtime.
  }
  return workspaceRailWidthMemory;
};

const writeWorkspaceRailWidth = width => {
  workspaceRailWidthMemory = clampWorkspaceRailWidth(width);
  try {
    const storage = typeof window === 'undefined'
      ? null
      : getLocalStorage();
    storage?.setItem(
      WORKSPACE_RAIL_WIDTH_STORAGE_KEY,
      String(workspaceRailWidthMemory)
    );
  } catch (error) {
    // Preference storage is optional; keep the current in-memory width usable.
  }
};

export const useWorkspaceRailWidth = () => {
  const [width, setWidth] = useState(readWorkspaceRailWidth);
  const updateWidth = useCallback(nextWidth => {
    const clampedWidth = clampWorkspaceRailWidth(nextWidth);
    setWidth(clampedWidth);
    writeWorkspaceRailWidth(clampedWidth);
  }, []);
  return [width, updateWidth];
};

const DEFAULT_RAIL_SELECTOR = '[data-testid="session-insights-column"]';
const DEFAULT_SPLITTER_LABEL = 'video and session panel';

const getRenderedRailWidth = (container, fallbackWidth, railSelector = DEFAULT_RAIL_SELECTOR) => {
  const rail = container?.querySelector?.(railSelector);
  const measuredWidth = rail?.getBoundingClientRect?.().width;
  if (Number.isFinite(measuredWidth) && measuredWidth > 0) {
    return clampWorkspaceRailWidth(measuredWidth, container.clientWidth);
  }
  const cssWidth = container
    ? Number.parseFloat(window.getComputedStyle(container)
      .getPropertyValue('--behaviorlens-workspace-rail-width'))
    : NaN;
  return clampWorkspaceRailWidth(
    Number.isFinite(cssWidth) ? cssWidth : fallbackWidth,
    container?.clientWidth
  );
};

const WorkspaceRailSplitter = ({
  containerRef,
  label = DEFAULT_SPLITTER_LABEL,
  onWidthChange,
  railSelector = DEFAULT_RAIL_SELECTOR,
  width
}) => {
  const railWidth = clampWorkspaceRailWidth(width);
  const [dragging, setDragging] = useState(false);
  const dragCleanupRef = useRef(null);

  const renderRailWidth = useCallback(nextWidth => {
    const container = containerRef.current;
    const clampedWidth = clampWorkspaceRailWidth(nextWidth, container?.clientWidth);
    if (container) {
      container.style.setProperty('--behaviorlens-workspace-rail-width', `${clampedWidth}px`);
    }
    return clampedWidth;
  }, [containerRef]);

  const applyRailWidth = useCallback(nextWidth => {
    const clampedWidth = renderRailWidth(nextWidth);
    onWidthChange(clampedWidth);
    return clampedWidth;
  }, [onWidthChange, renderRailWidth]);

  useLayoutEffect(() => {
    renderRailWidth(railWidth);
    const handleWindowResize = () => renderRailWidth(railWidth);
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [railWidth, renderRailWidth]);

  useEffect(() => () => dragCleanupRef.current?.(), []);

  const startDragging = event => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = getRenderedRailWidth(container, railWidth, railSelector);
    let latestWidth = startWidth;
    onWidthChange(startWidth);
    setDragging(true);
    const handlePointerMove = moveEvent => {
      latestWidth = applyRailWidth(startWidth - (moveEvent.clientX - startX));
    };
    let cleanup = () => {};
    const handlePointerUp = () => {
      cleanup();
      applyRailWidth(latestWidth);
      setDragging(false);
    };
    cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      dragCleanupRef.current = null;
    };
    dragCleanupRef.current = cleanup;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleKeyDown = event => {
    const step = event.shiftKey ? 48 : 16;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const currentWidth = getRenderedRailWidth(containerRef.current, railWidth, railSelector);
    const nextWidth = event.key === 'ArrowLeft'
      ? currentWidth + step
      : event.key === 'ArrowRight'
        ? currentWidth - step
        : event.key === 'Home'
          ? MIN_WORKSPACE_RAIL_WIDTH
          : MAX_WORKSPACE_RAIL_WIDTH;
    applyRailWidth(nextWidth);
  };

  return (
    <WorkspaceRailResizeHandle
      role="separator"
      tabIndex="0"
      aria-label={`Resize ${label}`}
      aria-orientation="vertical"
      aria-valuemin={MIN_WORKSPACE_RAIL_WIDTH}
      aria-valuemax={MAX_WORKSPACE_RAIL_WIDTH}
      aria-valuenow={railWidth}
      $dragging={dragging}
      title={`Drag to resize ${label}`}
      onDoubleClick={() => applyRailWidth(DEFAULT_WORKSPACE_RAIL_WIDTH)}
      onKeyDown={handleKeyDown}
      onPointerDown={startDragging}
    />
  );
};

WorkspaceRailSplitter.propTypes = {
  containerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  label: PropTypes.string,
  onWidthChange: PropTypes.func.isRequired,
  railSelector: PropTypes.string,
  width: PropTypes.number.isRequired
};

export default WorkspaceRailSplitter;
