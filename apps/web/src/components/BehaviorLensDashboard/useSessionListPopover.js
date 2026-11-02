import {
  useCallback, useEffect, useLayoutEffect, useRef, useState
} from 'react';

const VIEWPORT_GAP = 16;
const TRIGGER_GAP = 8;
const EMPTY_POSITION = {
  left: 0,
  maxHeight: 0,
  top: 0,
  width: 0
};

// Shared popover plumbing for the Filters and Sort triggers: Escape and
// outside clicks close, and focus always returns to the trigger afterwards.
// The card is portaled, so it is positioned against the viewport instead of
// being clipped by the session-list scroll pane.
const useSessionListPopover = ({
  align = 'left', onClose, open, width
}) => {
  const anchorRef = useRef(null);
  const triggerRef = useRef(null);
  const cardRef = useRef(null);
  const wasOpenRef = useRef(false);
  const [cardPosition, setCardPosition] = useState(EMPTY_POSITION);

  const closeAndRestoreFocus = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose]);

  const updateCardPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const top = Math.round(rect.bottom + TRIGGER_GAP);
    const cardWidth = Math.min(width, window.innerWidth - 16);
    const preferredLeft = align === 'right' ? rect.right - cardWidth : rect.left;
    const left = Math.round(Math.min(
      Math.max(8, preferredLeft),
      Math.max(8, window.innerWidth - cardWidth - 8)
    ));

    const remaining = Math.floor(window.innerHeight - top - VIEWPORT_GAP);
    setCardPosition({
      left,
      // jsdom reports a 0-height window; keep a designed fallback so tests and
      // first paint still mount the portaled card.
      maxHeight: remaining > 0 ? remaining : 682,
      top,
      width: cardWidth
    });
  }, [align, width]);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
      }
      return undefined;
    }

    wasOpenRef.current = true;
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeAndRestoreFocus();
      }
    };
    const handlePointerDown = event => {
      const { target } = event;
      if (
        anchorRef.current?.contains(target)
        || cardRef.current?.contains(target)
        || target.closest?.('.bl-dropdown-list')
        || target.closest?.('[data-floating-ui-portal]')
        || target.closest?.('[data-behaviorlens-applied-filter-chip]')
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [closeAndRestoreFocus, onClose, open]);

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    updateCardPosition();
    window.addEventListener('resize', updateCardPosition);
    window.addEventListener('scroll', updateCardPosition, true);
    return () => {
      window.removeEventListener('resize', updateCardPosition);
      window.removeEventListener('scroll', updateCardPosition, true);
    };
  }, [open, updateCardPosition]);

  useEffect(() => {
    if (open) {
      cardRef.current?.focus();
    }
  }, [open]);

  return {
    anchorRef,
    cardPosition,
    cardRef,
    closeAndRestoreFocus,
    triggerRef
  };
};

export default useSessionListPopover;
