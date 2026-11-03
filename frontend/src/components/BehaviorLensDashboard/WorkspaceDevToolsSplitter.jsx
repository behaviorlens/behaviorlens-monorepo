import React, {
  useCallback, useEffect, useLayoutEffect, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { getLocalStorage } from '../../lib/storage';

export const DEFAULT_WORKSPACE_DEVTOOLS_HEIGHT = 270;
export const MIN_WORKSPACE_DEVTOOLS_HEIGHT = 180;
export const MAX_WORKSPACE_DEVTOOLS_HEIGHT = 560;
export const MIN_WORKSPACE_STAGE_HEIGHT = 150;
export const WORKSPACE_DEVTOOLS_HEIGHT_STORAGE_KEY = 'behaviorlens:workspace-devtools-height:v1';
let workspaceDevToolsHeightMemory = DEFAULT_WORKSPACE_DEVTOOLS_HEIGHT;

// Same handle as WorkspaceRailSplitter, rotated for a top-edge dock:
// 12px hit target, 1px #dfe5ee rule that thickens to #1463ff, pill grip
// while hovering or dragging.
const WorkspaceDevToolsResizeHandle = styled.div`
  position: absolute;
  z-index: 40;
  top: -6px;
  left: 0;
  right: 0;
  height: 12px;
  cursor: row-resize;
  touch-action: none;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: ${({ $dragging }) => ($dragging ? '3px' : '1px')};
    background: ${({ $dragging }) => ($dragging ? '#1463ff' : '#dfe5ee')};
    transform: translateY(-50%);
    transition: height 120ms ease, background 120ms ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 42px;
    height: 5px;
    border: 1px solid #cdd8e8;
    border-radius: 999px;
    background: #ffffff;
    box-shadow: 0 2px 7px rgba(31, 45, 72, 0.14);
    opacity: ${({ $dragging }) => ($dragging ? 1 : 0)};
    transform: translate(-50%, -50%);
    transition: opacity 120ms ease, border-color 120ms ease;
  }

  &:hover::before,
  &:focus-visible::before { height: 3px; background: #1463ff; }
  &:hover::after,
  &:focus-visible::after { border-color: #7ca5f1; opacity: 1; }
  &:focus-visible { outline: none; }
`;

export const clampWorkspaceDevToolsHeight = (height, flexSpace = Infinity) => {
  const hasUsableFlexSpace = Number.isFinite(flexSpace)
    && flexSpace >= MIN_WORKSPACE_STAGE_HEIGHT + MIN_WORKSPACE_DEVTOOLS_HEIGHT;
  const availableMaximum = hasUsableFlexSpace
    ? Math.max(MIN_WORKSPACE_DEVTOOLS_HEIGHT, flexSpace - MIN_WORKSPACE_STAGE_HEIGHT)
    : MAX_WORKSPACE_DEVTOOLS_HEIGHT;
  const maximum = Math.min(MAX_WORKSPACE_DEVTOOLS_HEIGHT, availableMaximum);
  const numericHeight = height === null || height === '' ? NaN : Number(height);
  const normalizedHeight = Number.isFinite(numericHeight)
    ? numericHeight
    : DEFAULT_WORKSPACE_DEVTOOLS_HEIGHT;
  return Math.round(Math.min(maximum, Math.max(MIN_WORKSPACE_DEVTOOLS_HEIGHT, normalizedHeight)));
};

const readWorkspaceDevToolsHeight = () => {
  try {
    const storage = typeof window === 'undefined'
      ? null
      : getLocalStorage();
    if (!storage) {
      return workspaceDevToolsHeightMemory;
    }
    const storedHeight = storage.getItem(WORKSPACE_DEVTOOLS_HEIGHT_STORAGE_KEY);
    if (storedHeight !== null) {
      workspaceDevToolsHeightMemory = clampWorkspaceDevToolsHeight(storedHeight);
    }
  } catch (error) {
    // Fall back to the preference retained by this browser tab's JS runtime.
  }
  return workspaceDevToolsHeightMemory;
};

const writeWorkspaceDevToolsHeight = height => {
  workspaceDevToolsHeightMemory = clampWorkspaceDevToolsHeight(height);
  try {
    const storage = typeof window === 'undefined'
      ? null
      : getLocalStorage();
    storage?.setItem(
      WORKSPACE_DEVTOOLS_HEIGHT_STORAGE_KEY,
      String(workspaceDevToolsHeightMemory)
    );
  } catch (error) {
    // Preference storage is optional; keep the current in-memory height usable.
  }
};

export const useWorkspaceDevToolsHeight = () => {
  const [height, setHeight] = useState(readWorkspaceDevToolsHeight);
  const updateHeight = useCallback(nextHeight => {
    const clampedHeight = clampWorkspaceDevToolsHeight(nextHeight);
    setHeight(clampedHeight);
    writeWorkspaceDevToolsHeight(clampedHeight);
  }, []);
  return [height, updateHeight];
};

const getDrawerEl = container => (
  container?.querySelector?.('[data-testid="behaviorlens-devtools-drawer"]') || null
);

const getFlexSpace = (container, fallbackHeight) => {
  const measured = container?.clientHeight;
  if (!Number.isFinite(measured) || measured <= 0) {
    return fallbackHeight;
  }
  const drawer = getDrawerEl(container);
  const stage = drawer?.previousElementSibling;
  let reserved = 0;
  Array.from(container.children || []).forEach(child => {
    if (child === drawer || child === stage) {
      return;
    }
    const childHeight = child.getBoundingClientRect?.().height;
    if (Number.isFinite(childHeight) && childHeight > 0) {
      reserved += childHeight;
    }
  });
  return Math.max(0, measured - reserved);
};

const getRenderedDevToolsHeight = (container, fallbackHeight) => {
  const drawer = getDrawerEl(container);
  const measuredHeight = drawer?.getBoundingClientRect?.().height;
  const flexSpace = getFlexSpace(container, Infinity);
  if (Number.isFinite(measuredHeight) && measuredHeight > 0) {
    return clampWorkspaceDevToolsHeight(measuredHeight, flexSpace);
  }
  const cssHeight = drawer
    ? Number.parseFloat(window.getComputedStyle(drawer)
      .getPropertyValue('--behaviorlens-workspace-devtools-height'))
    : NaN;
  return clampWorkspaceDevToolsHeight(
    Number.isFinite(cssHeight) ? cssHeight : fallbackHeight,
    flexSpace
  );
};

const WorkspaceDevToolsSplitter = ({ containerRef, onHeightChange, height }) => {
  const drawerHeight = clampWorkspaceDevToolsHeight(height);
  const [dragging, setDragging] = useState(false);
  const dragCleanupRef = useRef(null);

  const renderDevToolsHeight = useCallback(nextHeight => {
    const container = containerRef.current;
    const flexSpace = getFlexSpace(container, Infinity);
    const clampedHeight = clampWorkspaceDevToolsHeight(nextHeight, flexSpace);
    const drawer = getDrawerEl(container);
    if (drawer) {
      drawer.style.setProperty('--behaviorlens-workspace-devtools-height', `${clampedHeight}px`);
    }
    return clampedHeight;
  }, [containerRef]);

  const applyDevToolsHeight = useCallback(nextHeight => {
    const clampedHeight = renderDevToolsHeight(nextHeight);
    onHeightChange(clampedHeight);
    return clampedHeight;
  }, [onHeightChange, renderDevToolsHeight]);

  useLayoutEffect(() => {
    renderDevToolsHeight(drawerHeight);
    const handleWindowResize = () => renderDevToolsHeight(drawerHeight);
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [drawerHeight, renderDevToolsHeight]);

  useEffect(() => () => dragCleanupRef.current?.(), []);

  const startDragging = event => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = getRenderedDevToolsHeight(container, drawerHeight);
    let latestHeight = startHeight;
    onHeightChange(startHeight);
    setDragging(true);
    const handlePointerMove = moveEvent => {
      latestHeight = applyDevToolsHeight(startHeight + (startY - moveEvent.clientY));
    };
    let cleanup = () => {};
    const handlePointerUp = () => {
      cleanup();
      applyDevToolsHeight(latestHeight);
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
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const currentHeight = getRenderedDevToolsHeight(containerRef.current, drawerHeight);
    const nextHeight = event.key === 'ArrowUp'
      ? currentHeight + step
      : event.key === 'ArrowDown'
        ? currentHeight - step
        : event.key === 'Home'
          ? MIN_WORKSPACE_DEVTOOLS_HEIGHT
          : MAX_WORKSPACE_DEVTOOLS_HEIGHT;
    applyDevToolsHeight(nextHeight);
  };

  return (
    <WorkspaceDevToolsResizeHandle
      role="separator"
      tabIndex="0"
      aria-label="Resize replay and Dev Tools"
      aria-orientation="horizontal"
      aria-valuemin={MIN_WORKSPACE_DEVTOOLS_HEIGHT}
      aria-valuemax={MAX_WORKSPACE_DEVTOOLS_HEIGHT}
      aria-valuenow={drawerHeight}
      $dragging={dragging}
      title="Drag to resize replay and Dev Tools"
      onDoubleClick={() => applyDevToolsHeight(DEFAULT_WORKSPACE_DEVTOOLS_HEIGHT)}
      onKeyDown={handleKeyDown}
      onPointerDown={startDragging}
    />
  );
};

WorkspaceDevToolsSplitter.propTypes = {
  containerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  onHeightChange: PropTypes.func.isRequired,
  height: PropTypes.number.isRequired
};

export default WorkspaceDevToolsSplitter;
