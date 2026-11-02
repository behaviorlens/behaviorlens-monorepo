import styled, { css } from 'styled-components';
import { Dropdown } from '../../ui';

export const ControlBar = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 0 20px;
  background: transparent;

  @media (max-width: 720px) {
    gap: 10px;
    padding: 0 10px;
  }
`;

export const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Play, clock, Notes & Share, speed, and Skip inactivity. Fullscreen stays
// outside so it never inherits the locked fade. Magnet Button uses
// `duration-300`; this group snaps opacity so Scroll Maps does not wait on
// that fade or on the stage swap.
export const ControlLockedGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  flex: 1 1 auto;
  min-width: 0;
  opacity: ${({ $locked }) => ($locked ? 0.45 : 1)};
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'default')};
  transition: none;

  .bl-button,
  button,
  [data-testid='behaviorlens-control-speed'] {
    transition: none;
    transition-duration: 0ms;
  }

  ${({ $locked }) => $locked && css`
    && button:disabled,
    && .bl-button,
    && [aria-disabled='true'] {
      opacity: 1;
      cursor: not-allowed;
    }
  `}
`;

export const ControlSpacer = styled.div`
  flex: 1 1 auto;
`;

// Figma triangle-circle-filled (`440:20235`): 40px navy disc, 16px white glyph.
// Play and pause share the same disc and glyph size.
export const ControlPlayButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
  max-width: 40px;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  flex: 0 0 auto;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #0a1551;
  color: #ffffff;
  cursor: pointer;
  line-height: 0;

  svg,
  svg.behaviorlens-transport-glyph {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    fill: currentColor;
  }

  &:hover:not(:disabled) {
    background: #0a1551;
    color: #ffffff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
    transition: none;
  }

  &:focus-visible {
    outline: 2px solid #0a1551;
    outline-offset: 2px;
  }
`;

export const ControlReplayGlyph = styled.span`
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  color: currentColor;

  && > svg {
    position: absolute;
    fill: currentColor;
  }

  && > svg:first-child {
    inset: 0;
    width: 18px;
    height: 18px;
  }

  && > svg:last-child {
    top: 6px;
    left: 7px;
    width: 6px;
    height: 6px;
  }
`;

export const ControlIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #0a1551;
  cursor: pointer;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    color: #0a1551;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

export const ControlTime = styled.span`
  color: #0a1551;
  font-size: 14px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

// styled(Dropdown) lands on Magnet's trigger only — never wrap Dropdown in a
// sized box or the open menu inherits the trigger height.
export const ControlSpeedSelect = styled(Dropdown).attrs({
  rounded: 'none',
  size: 'small',
  useAsSelect: false
})`
  && {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    width: max-content;
    min-width: 0;
    height: 20px;
    min-height: 20px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #0a1551;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: visible;
  }

  &&:hover {
    color: #0a1551;
  }

  && > span:first-of-type {
    flex: 0 0 auto;
    width: max-content;
    min-width: max-content;
    max-width: none;
    padding: 0;
    overflow: visible;
    text-overflow: clip;
    text-align: left;
  }

  && > :last-child {
    flex: 0 0 auto;
    margin-inline-start: 4px;
    padding: 0;
  }

  && svg {
    width: 14px;
    height: 14px;
  }

  &&:disabled,
  &&[aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
    color: #0a1551;
    transition: none;
  }
`;

// Figma 291:7254 "Skip inactivity": 16px checkbox + 13px label, no chrome.
export const ControlSkipToggle = styled.div`
  display: inline-flex;
  align-items: center;
  pointer-events: ${({ $locked }) => ($locked ? 'none' : 'auto')};

  label {
    gap: 6px;
    color: #0a1551;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }

  label:hover {
    color: #0a1551;
  }
`;

// ---------------------------------------------------------------------------
// Right rail
// ---------------------------------------------------------------------------
