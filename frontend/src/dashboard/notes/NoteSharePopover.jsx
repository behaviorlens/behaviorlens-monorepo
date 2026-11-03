import React, {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, InputText } from '../../ui';
import {
  IconCheck, IconCopyFilled, IconFilePencilFilled, IconXmark
} from '../../ui/icons';
import { useSessionReviewMetadataContext } from '../review/SessionReviewMetadataPanel';
import {
  SessionNoteComposer,
  SessionNotesStateGate,
  useReviewMentionUsers
} from './SessionNotesUI';
import { formatReplayTimestamp } from '../shared/behaviorLensNoteTimestamps';
import { buildShareMomentUrl } from './behaviorLensShareMomentUrl';
import { WorkspaceActionPopoverClose } from '../workspace/ScBehaviorLensWorkspace';
import { NOOP, RETURN_NULL } from '../../lib/propDefaults';

const POPOVER_MAX_HEIGHT = 900;
const POPOVER_EDGE_GAP = 12;
const DEFAULT_SHELL_TOP = 72;
const COPY_CONFIRMATION_MS = 2000;

const PopoverAnchor = styled.div`
  position: relative;
  display: inline-flex;

  > .bl-button {
    min-width: 80px;
    height: 32px;
    padding: 0 8px;
    border-color: #757fb5;
    border-radius: 4px;
    background: transparent;
    color: #0a1551;
    font-size: 12px;
    font-weight: 500;
  }

  > .bl-button:hover {
    border-color: #757fb5;
    background: transparent;
    color: #0a1551;
  }

  > .bl-button svg {
    width: 16px;
    height: 16px;
  }
`;

// Moment composer and timestamped share link from Figma 1341:59785.
const PopoverSurface = styled.div`
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  z-index: 30;
  box-sizing: border-box;
  width: min(420px, calc(100vw - 24px));
  height: auto;
  max-height: ${({ $maxHeight }) => `${$maxHeight}px`};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateX(-50%);
  border: 1px solid #e3e5f5;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 12px rgba(13, 20, 51, 0.18);
`;

const PopoverComposerSection = styled.div`
  flex: 0 0 auto;
  box-sizing: border-box;
  padding: 20px 20px 16px;
  overflow: visible;

  > form {
    display: flex;
    flex-direction: column;
  }

  .bl-form-helper-text {
    margin-top: 8px;
    color: #6f76a7;
    font-size: 12px;
    line-height: normal;
  }

  .bl-button {
    min-width: 80px;
    height: 32px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

`;

const PopoverHeader = styled.header`
  position: relative;
  margin-bottom: 16px;
  padding-right: 28px;
`;

const PopoverHeading = styled.h2`
  margin: 0;
  color: #0a1551;
  font-size: 18px;
  font-weight: 700;
  line-height: normal;
`;

const PopoverStartLabel = styled.p`
  margin: 2px 0 0;
  color: #6f76a7;
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
`;

const PopoverCloseButton = styled(WorkspaceActionPopoverClose)`
  position: absolute;
  top: 1px;
  right: 0;
`;

const PopoverShareSection = styled.section`
  flex: 0 0 auto;
  box-sizing: border-box;
  padding: 16px 20px 20px;
  border-top: 1px solid #e8e9ef;
`;

const PopoverShareTitle = styled.h3`
  margin: 0 0 10px;
  color: #0a1551;
  font-size: 14px;
  font-weight: 700;
  line-height: normal;
`;

const PopoverShareField = styled.div`
  cursor: pointer;

  &:hover button {
    color: #0a1551;
  }
`;

const PopoverShareInput = styled(InputText)`
  && {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: 36px;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid #d4d8e5;
    border-radius: 4px;
    color: #6c73a8;
    background: #ffffff;
    font-size: 12px;
    text-align: left;
    overflow: hidden;
  }

  && input {
    min-width: 0;
    padding-left: 0;
    padding-right: 0;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  && button {
    flex: 0 0 16px;
    width: 16px;
    height: 16px;
    margin-left: 12px;
    align-self: center;
    border: 0;
    padding: 0;
    background: transparent;
    color: #6c73a8;
    cursor: pointer;
    transition: color 120ms ease;
  }

  && button svg {
    width: 16px;
    height: 16px;
  }
`;

// Notes & Share is the replay-level entry point to the existing notes feature.
// Opening pauses the replay. Note saving and the generated share link both use
// the live replay clock, so either action targets the frame shown to the user.
const NoteSharePopover = ({
  disabled = false,
  getReplayCurrentTime = RETURN_NULL,
  onNoteSaved = NOOP,
  onOpenPopover = NOOP,
  openRequest = 0
}) => {
  const anchorRef = useRef(null);
  const openRequestRef = useRef(openRequest);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentReplayTimeMs, setCurrentReplayTimeMs] = useState(0);
  const [popoverMaxHeight, setPopoverMaxHeight] = useState(POPOVER_MAX_HEIGHT);
  const [selectedTags, setSelectedTags] = useState([]);
  const { mentionUsers, mentionUsersLoading } = useReviewMentionUsers();
  const { controller } = useSessionReviewMetadataContext();
  const shareMomentUrl = useMemo(() => {
    if (typeof window === 'undefined' || !window.location?.href) {
      return '';
    }
    return buildShareMomentUrl(window.location.href, currentReplayTimeMs);
  }, [currentReplayTimeMs]);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), COPY_CONFIRMATION_MS);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const updatePopoverMaxHeight = useCallback(() => {
    const anchorTop = anchorRef.current?.getBoundingClientRect().top;
    if (!Number.isFinite(anchorTop) || anchorTop <= 0) {
      setPopoverMaxHeight(POPOVER_MAX_HEIGHT);
      return;
    }
    const chromeTop = document.querySelector('[data-testid="behaviorlens-replay-context-chrome"]')
      ?.getBoundingClientRect().top;
    const shellTop = document.querySelector('[data-behaviorlens-shell]')
      ?.getBoundingClientRect().top;
    const topBoundary = Number.isFinite(chromeTop)
      ? chromeTop
      : (Number.isFinite(shellTop) ? shellTop : DEFAULT_SHELL_TOP);
    const availableHeight = anchorTop
      - topBoundary
      - POPOVER_EDGE_GAP;
    setPopoverMaxHeight(Math.max(0, Math.min(POPOVER_MAX_HEIGHT, availableHeight)));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }
    updatePopoverMaxHeight();
    window.addEventListener('resize', updatePopoverMaxHeight);
    window.visualViewport?.addEventListener('resize', updatePopoverMaxHeight);
    return () => {
      window.removeEventListener('resize', updatePopoverMaxHeight);
      window.visualViewport?.removeEventListener('resize', updatePopoverMaxHeight);
    };
  }, [open, updatePopoverMaxHeight]);

  const copyShareMoment = useCallback(async () => {
    if (!shareMomentUrl) {
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareMomentUrl);
        setCopied(true);
        return;
      } catch (error) {
        // Fall through to the selection-based copy path when permission is denied.
      }
    }
    const copyInput = document.createElement('textarea');
    copyInput.value = shareMomentUrl;
    copyInput.setAttribute('readonly', '');
    copyInput.style.position = 'fixed';
    copyInput.style.opacity = '0';
    document.body.appendChild(copyInput);
    copyInput.select();
    const copySucceeded = document.execCommand?.('copy');
    document.body.removeChild(copyInput);
    if (copySucceeded !== false) {
      setCopied(true);
    }
  }, [shareMomentUrl]);

  const closePopover = useCallback(({ restoreFocus = true } = {}) => {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  const openPopover = useCallback(startAtOverride => {
    if (typeof onOpenPopover === 'function') {
      onOpenPopover();
    }
    const currentTime = Number.isFinite(startAtOverride)
      ? startAtOverride
      : (typeof getReplayCurrentTime === 'function' ? getReplayCurrentTime() : null);
    setCopied(false);
    setCurrentReplayTimeMs(Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0);
    setSelectedTags([]);
    setOpen(true);
  }, [getReplayCurrentTime, onOpenPopover]);

  useEffect(() => {
    if (openRequestRef.current === openRequest) {
      return;
    }
    openRequestRef.current = openRequest;
    if (!disabled) {
      openPopover();
    }
  }, [disabled, openPopover, openRequest]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const sampleCurrentTime = () => {
      const currentTime = Number(getReplayCurrentTime?.());
      if (Number.isFinite(currentTime)) {
        setCurrentReplayTimeMs(Math.max(0, currentTime));
      }
    };
    sampleCurrentTime();
    const interval = window.setInterval(sampleCurrentTime, 250);
    return () => window.clearInterval(interval);
  }, [getReplayCurrentTime, open]);

  const toggle = useCallback(() => {
    if (disabled) {
      return;
    }
    if (open) {
      closePopover();
    } else {
      openPopover();
    }
  }, [closePopover, disabled, open, openPopover]);

  useEffect(() => {
    if (!disabled || !open) {
      return;
    }
    closePopover({ restoreFocus: false });
  }, [closePopover, disabled, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !controller.notePendingDelete) {
        closePopover();
      }
    };
    const handlePointerDown = event => {
      if (!anchorRef.current || anchorRef.current.contains(event.target)) {
        return;
      }
      // The delete confirmation is a portaled dialog outside this anchor.
      // Treating its clicks as "outside" used to close the popover and unmount
      // the dialog before the delete could run.
      if (controller.notePendingDelete) {
        return;
      }
      if (event.target?.closest?.('[role="dialog"], [data-headlessui-portal]')) {
        return;
      }
      closePopover({ restoreFocus: false });
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [closePopover, controller.notePendingDelete, open]);

  return (
    <PopoverAnchor ref={anchorRef}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        theme="dark"
        size="small"
        startIcon={IconFilePencilFilled}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        className="duration-0"
        title={disabled ? 'Playback is paused on Scroll Maps' : undefined}
        onClick={disabled ? undefined : toggle}
        data-testid="behaviorlens-control-note"
      >
        Notes & Share
      </Button>
      {open && (
        <PopoverSurface
          $maxHeight={popoverMaxHeight}
          role="dialog"
          aria-label="Notes & Share"
          data-testid="behaviorlens-note-share-popover"
        >
          <PopoverComposerSection>
            <PopoverHeader>
              <PopoverHeading>Add a note</PopoverHeading>
              <PopoverStartLabel>
                {`Start at ${formatReplayTimestamp(currentReplayTimeMs)}`}
              </PopoverStartLabel>
              <PopoverCloseButton
                type="button"
                aria-label="Close Notes & Share"
                onClick={() => closePopover()}
              >
                <IconXmark aria-hidden="true" />
              </PopoverCloseButton>
            </PopoverHeader>
            <SessionNotesStateGate controller={controller}>
              <SessionNoteComposer
                controller={controller}
                getReplayCurrentTime={getReplayCurrentTime}
                mentionUsers={mentionUsers}
                mentionUsersLoading={mentionUsersLoading}
                onSaved={() => {
                  closePopover();
                  onNoteSaved();
                }}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                variant="popover"
              />
            </SessionNotesStateGate>
          </PopoverComposerSection>
          <PopoverShareSection data-testid="behaviorlens-share-footer">
            <PopoverShareTitle>Share this moment</PopoverShareTitle>
            <PopoverShareField
              onClick={copyShareMoment}
              data-testid="behaviorlens-share-field"
            >
              <PopoverShareInput
                value={shareMomentUrl}
                readOnly
                showLockIconInReadOnly={false}
                useDefaultStyleInReadOnly
                aria-label="Share this moment link"
                title={shareMomentUrl}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    copyShareMoment();
                  }
                }}
                suffix={{
                  as: 'button',
                  type: 'button',
                  icon: copied ? IconCheck : IconCopyFilled,
                  iconOnly: true,
                  'aria-label': copied ? 'Copied' : 'Copy share link',
                  title: copied ? 'Copied' : 'Copy share link',
                  onMouseDown: event => {
                    event.preventDefault();
                    event.stopPropagation();
                  },
                  onClick: event => {
                    event.stopPropagation();
                    copyShareMoment();
                  },
                  'data-testid': 'behaviorlens-share-copy'
                }}
              />
            </PopoverShareField>
          </PopoverShareSection>
        </PopoverSurface>
      )}
    </PopoverAnchor>
  );
};

NoteSharePopover.propTypes = {
  disabled: PropTypes.bool,
  getReplayCurrentTime: PropTypes.func,
  onNoteSaved: PropTypes.func,
  onOpenPopover: PropTypes.func,
  openRequest: PropTypes.number
};

export default NoteSharePopover;
