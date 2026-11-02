import React from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import {
  IconArrowPointerClickFilled,
  IconArrowsSwitchVerticalReverse,
  IconAngleDown,
  IconClockEllipsis,
  IconHourglassHalf,
  IconWrenchScrewdriver
} from '../../ui/icons';
import { ToolbarTrigger, ToolbarTriggerBadge, ToolbarTriggerLabel } from './ScBehaviorLensSessionListPage';
import {
  PopoverAnchor,
  PopoverCard,
  SortList,
  SortOptionButton
} from './ScBehaviorLensSessionPopovers';
import useSessionListPopover from './useSessionListPopover';
import { SORT_OPTIONS, getSortOption, normalizeSortValue } from './behaviorLensSessionSort';

// Sized for the longest option plus icon/padding. Do not match the trigger
// width — that shrinks with "Oldest" and ellipsizes labels like "A to Z (username)".
const SORT_CARD_WIDTH = 252;
const SORT_CARD_MAX_HEIGHT = 360;

const SORT_ICONS = {
  alpha: IconArrowsSwitchVerticalReverse,
  click: IconArrowPointerClickFilled,
  clock: IconClockEllipsis,
  hourglass: IconHourglassHalf,
  issue: IconWrenchScrewdriver
};

const SessionSortPopover = ({
  onChange, onClose, onOpen, open, value
}) => {
  const {
    anchorRef, cardPosition, cardRef, closeAndRestoreFocus, triggerRef
  } = useSessionListPopover({
    align: 'left',
    onClose,
    open,
    width: SORT_CARD_WIDTH
  });
  const selectedValue = normalizeSortValue(value);
  const selectedOption = getSortOption(selectedValue);
  const maxHeight = Math.min(SORT_CARD_MAX_HEIGHT, cardPosition.maxHeight);

  return (
    <PopoverAnchor ref={anchorRef}>
      <ToolbarTrigger
        type="button"
        ref={triggerRef}
        $open={open}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => (open ? closeAndRestoreFocus() : onOpen())}
      >
        <ToolbarTriggerLabel>
          Sorted by
          <ToolbarTriggerBadge>{selectedOption.label}</ToolbarTriggerBadge>
        </ToolbarTriggerLabel>
        <IconAngleDown aria-hidden="true" />
      </ToolbarTrigger>

      {open && maxHeight > 0 && createPortal(
        <PopoverCard
          ref={cardRef}
          role="dialog"
          aria-label="Sort sessions"
          tabIndex={-1}
          $fixed
          $top={cardPosition.top}
          $left={cardPosition.left}
          $width={cardPosition.width || SORT_CARD_WIDTH}
          $maxHeight={maxHeight}
          $menu
        >
          <SortList role="listbox" aria-label="Sort sessions">
            {SORT_OPTIONS.map(option => {
              const Icon = SORT_ICONS[option.icon];
              const selected = option.value === selectedValue;
              return (
                <SortOptionButton
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  $selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    closeAndRestoreFocus();
                  }}
                >
                  <Icon aria-hidden="true" />
                  <span>{option.label}</span>
                </SortOptionButton>
              );
            })}
          </SortList>
        </PopoverCard>,
        document.body
      )}
    </PopoverAnchor>
  );
};

SessionSortPopover.propTypes = {
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  value: PropTypes.string.isRequired
};

export default SessionSortPopover;
