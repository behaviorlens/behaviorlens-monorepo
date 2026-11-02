import React, {
  useEffect, useMemo, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import styled, { createGlobalStyle } from 'styled-components';
import {
  Avatar,
  Button,
  Dropdown,
  DropdownOption,
  FormControl,
  FormLabel,
  Loader,
  UnstyledButton,
  UnstyledInput
} from '../../ui';
import {
  IconAngleDown,
  IconAngleLeft,
  IconCheck,
  IconMagnifyingGlass
} from '../../ui/icons';
import { listReviewUsers } from '../../services/BehaviorLensService';
import { PRIORITY_LABELS } from './behaviorLensReviewQueue';
import {
  getReviewerInitials,
  matchesReviewerDirectoryQuery
} from './behaviorLensSessionReviewers';

export { getReviewerInitials } from './behaviorLensSessionReviewers';

const ControlWrap = styled.div`
  width: 100%;
  min-width: 0;
  max-width: 240px;

  @media (max-width: 520px) {
    max-width: none;
  }
`;

const InlineFormControl = styled(FormControl)`
  > * + * {
    margin-top: 0 !important;
  }
`;

const ScreenReaderLabel = styled(FormLabel)`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

const ReviewerTrigger = styled(Button)`
  width: 100%;
  min-width: 0;
  justify-content: flex-start !important;

  && {
    height: 32px;
    min-height: 32px;
    color: #0a1551;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
  }

  && span {
    color: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
  }

  > span {
    width: 100%;
  }
`;

const ReviewerContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

const ReviewerName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  transform: ${({ $visuallyCentered }) => ($visuallyCentered ? 'translateY(1px)' : 'none')};
`;

const ReviewerPickerShell = styled.div`
  min-width: 0;
`;

const ReviewerPickerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  margin-bottom: 8px;
`;

const ReviewerPickerBack = styled(UnstyledButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: #536074;
  cursor: pointer;

  svg { width: 15px; height: 15px; }
  &:hover { background: #f1f4f8; color: #1457d9; }
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: 1px; }
`;

const ReviewerPickerTitle = styled.strong`
  color: #253046;
  font-size: 13px;
`;

const ReviewerSearchWrap = styled.div`
  position: relative;
  margin-bottom: 6px;

  svg {
    position: absolute;
    top: 50%;
    left: 10px;
    width: 15px;
    height: 15px;
    color: #8c96a7;
    pointer-events: none;
    transform: translateY(-50%);
  }
`;

const ReviewerSearch = styled(UnstyledInput)`
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  border: 1px solid #dfe5ee;
  border-radius: 7px;
  padding: 0 10px 0 32px;
  background: #f8f9fb;
  color: #253046;
  font: inherit;
  font-size: 12px;

  &::placeholder { color: #99a2b2; }
  &:focus { outline: 2px solid #1463ff; outline-offset: -1px; background: #ffffff; }
`;

const ReviewerPickerList = styled.div`
  max-height: 210px;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

const ReviewerPickerOption = styled(UnstyledButton)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  border-radius: 7px;
  padding: 5px 8px;
  color: ${({ $selected }) => ($selected ? '#1457d9' : '#253046')};
  background: ${({ $selected }) => ($selected ? '#edf3ff' : 'transparent')};
  cursor: pointer;
  font: inherit;
  font-size: 12px;

  svg {
    flex: 0 0 auto;
    width: 13px;
    height: 13px;
  }

  &:hover { background: ${({ $selected }) => ($selected ? '#e3edff' : '#f5f7fa')}; }
  &:focus-visible { outline: 2px solid #1463ff; outline-offset: -2px; }
`;

const ReviewerPickerState = styled.div`
  padding: 18px 8px;
  color: #7b8494;
  font-size: 12px;
  text-align: center;
`;

const ReviewerDropdownGlobalStyle = createGlobalStyle`
  .behaviorlens-reviewer-dropdown-menu {
    overflow: hidden;
    border-radius: 4px 4px 12px 12px;
  }

  .behaviorlens-reviewer-dropdown-list {
    position: relative;
    border-radius: 0 0 12px 12px;
  }

  .behaviorlens-reviewer-dropdown-menu::before,
  .behaviorlens-reviewer-dropdown-menu::after {
    content: '';
    position: absolute;
    z-index: 3;
    right: 0;
    left: 0;
    height: 10px;
    pointer-events: none;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    transition: none;
  }

  .behaviorlens-reviewer-dropdown-menu::before {
    top: 32px;
    opacity: var(--behaviorlens-reviewer-fade-top, 0);
    mask-image: linear-gradient(to bottom, #000 30%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, #000 30%, transparent);
  }

  .behaviorlens-reviewer-dropdown-menu::after {
    bottom: 0;
    opacity: var(--behaviorlens-reviewer-fade-bottom, 0);
    mask-image: linear-gradient(to bottom, transparent, #000 70%);
    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 70%);
  }
`;

const REVIEWER_FADE_DISTANCE = 96;
const REVIEWER_DROPDOWN_OFFSET = 6;
const REVIEWER_DROPDOWN_DEFAULT_HEIGHT = 180;

const normalizeSearch = value => String(value || '').trim().toLocaleLowerCase();

const reviewerForValue = (users, value) => users.find(user => user.username === value) || null;

const shouldPersistSelection = (commitOnChange, onUpdate) => (
  commitOnChange !== false && typeof onUpdate === 'function'
);

export const ReviewerDisplay = ({
  avatar, avatarSize = '2x-small', name, showAvatar = true
}) => (
  <ReviewerContent>
    {showAvatar && (
      <Avatar
        aria-hidden="true"
        img={avatar || undefined}
        initials={getReviewerInitials(name) || undefined}
        size={avatarSize}
        variant="subtle"
      />
    )}
    <ReviewerName $visuallyCentered={avatarSize === '3x-small'}>{name}</ReviewerName>
  </ReviewerContent>
);

ReviewerDisplay.propTypes = {
  avatar: PropTypes.string,
  avatarSize: PropTypes.oneOf(['2x-small', '3x-small', '4x-small']),
  name: PropTypes.string.isRequired,
  showAvatar: PropTypes.bool
};

ReviewerDisplay.defaultProps = {
  avatar: null,
  avatarSize: '2x-small',
  showAvatar: true
};

export const InlinePriorityControl = ({
  commitOnChange = true, controlId, disabled, onChange, onUpdate, showArrow, value
}) => {
  const [priority, setPriority] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const requestRef = useRef(0);
  const persistSelection = shouldPersistSelection(commitOnChange, onUpdate);

  useEffect(() => {
    if (!saving) {
      setPriority(value || '');
    }
  }, [saving, value]);

  const changePriority = async nextPriority => {
    if (saving || !Object.prototype.hasOwnProperty.call(PRIORITY_LABELS, nextPriority)) {
      return;
    }
    if (!persistSelection) {
      setPriority(nextPriority);
      onChange?.({ priority: nextPriority });
      return;
    }
    const previousPriority = priority;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setPriority(nextPriority);
    setSaving(true);
    try {
      const updated = await onUpdate({ priority: nextPriority });
      if (requestRef.current === requestId) {
        setPriority(updated?.priority || previousPriority);
      }
    } catch {
      if (requestRef.current === requestId) {
        setPriority(previousPriority);
      }
    } finally {
      if (requestRef.current === requestId) {
        setSaving(false);
      }
    }
  };

  return (
    <ControlWrap>
      <InlineFormControl id={controlId}>
        <ScreenReaderLabel>Priority</ScreenReaderLabel>
        <Dropdown
          value={priority}
          onChange={changePriority}
          disabled={disabled}
          aria-busy={saving || undefined}
          hideArrowIcon={!showArrow}
          placeholder="Select priority"
          size="small"
        >
          {Object.entries(PRIORITY_LABELS).map(([optionValue, label]) => (
            <DropdownOption key={optionValue} value={optionValue}>{label}</DropdownOption>
          ))}
        </Dropdown>
      </InlineFormControl>
    </ControlWrap>
  );
};

InlinePriorityControl.propTypes = {
  commitOnChange: PropTypes.bool,
  controlId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onUpdate: PropTypes.func,
  showArrow: PropTypes.bool,
  value: PropTypes.string
};

InlinePriorityControl.defaultProps = {
  commitOnChange: true,
  disabled: false,
  onChange: undefined,
  onUpdate: undefined,
  showArrow: false,
  value: ''
};

export const InlineReviewerControl = ({
  avatarSize,
  commitOnChange = true,
  controlId,
  disabled,
  matchPopoverBottom,
  onChange,
  onOpenPicker,
  onPickerClose,
  onUpdate,
  placeholder,
  pickerMode,
  scrollFades,
  showArrow,
  value
}) => {
  const [reviewer, setReviewer] = useState(value || '');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuHeight, setMenuHeight] = useState(REVIEWER_DROPDOWN_DEFAULT_HEIGHT);
  const requestRef = useRef(0);
  const menuCleanupRef = useRef(null);
  const menuSetupTimerRef = useRef(null);
  const controlWrapRef = useRef(null);
  const persistSelection = shouldPersistSelection(commitOnChange, onUpdate);

  const clearMenuEnhancements = () => {
    if (menuSetupTimerRef.current !== null) {
      clearTimeout(menuSetupTimerRef.current);
      menuSetupTimerRef.current = null;
    }
    menuCleanupRef.current?.();
    menuCleanupRef.current = null;
  };

  const enhanceOpenMenu = () => {
    const openMenus = Array.from(document.querySelectorAll('.bl-dropdown-list'));
    const list = openMenus[openMenus.length - 1];
    if (!list) return;

    const menu = list.parentElement;
    if (!menu) return;

    list.classList.add('behaviorlens-reviewer-dropdown-list');
    menu.classList.add('behaviorlens-reviewer-dropdown-menu');

    const updateFades = () => {
      const remaining = Math.max(0, list.scrollHeight - list.scrollTop - list.clientHeight);
      menu.style.setProperty(
        '--behaviorlens-reviewer-fade-top',
        String(Math.min(1, list.scrollTop / REVIEWER_FADE_DISTANCE))
      );
      menu.style.setProperty(
        '--behaviorlens-reviewer-fade-bottom',
        String(Math.min(1, remaining / REVIEWER_FADE_DISTANCE))
      );
    };

    updateFades();
    list.addEventListener('scroll', updateFades, { passive: true });
    const observer = typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(updateFades);
    observer?.observe(list, { childList: true, subtree: true });
    menuCleanupRef.current = () => {
      list.removeEventListener('scroll', updateFades);
      observer?.disconnect();
      list.classList.remove('behaviorlens-reviewer-dropdown-list');
      menu.classList.remove('behaviorlens-reviewer-dropdown-menu');
      menu.style.removeProperty('--behaviorlens-reviewer-fade-top');
      menu.style.removeProperty('--behaviorlens-reviewer-fade-bottom');
    };
  };

  useEffect(() => {
    let active = true;
    setUsersLoading(true);
    listReviewUsers()
      .then(response => {
        if (active) {
          setUsers(Array.isArray(response) ? response : []);
        }
      })
      .catch(() => {
        if (active) {
          setUsers([]);
        }
      })
      .finally(() => {
        if (active) {
          setUsersLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (menuSetupTimerRef.current !== null) {
      clearTimeout(menuSetupTimerRef.current);
    }
    menuCleanupRef.current?.();
  }, []);

  useEffect(() => {
    setReviewer(value || '');
  }, [value]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) {
      return users;
    }
    return users.filter(user => matchesReviewerDirectoryQuery(user, normalizedQuery));
  }, [query, users]);

  const selectedUser = reviewerForValue(users, reviewer);
  const displayName = selectedUser?.name || reviewer || placeholder;
  const handleOpenChange = open => {
    if (!open) {
      clearMenuEnhancements();
      return;
    }
    setQuery('');
    if (matchPopoverBottom) {
      const controlWrap = controlWrapRef.current;
      const popover = controlWrap?.closest('[data-testid="behaviorlens-review-popover"]');
      if (controlWrap && popover) {
        const availableHeight = Math.floor(
          popover.getBoundingClientRect().bottom
          - controlWrap.getBoundingClientRect().bottom
          - REVIEWER_DROPDOWN_OFFSET
        );
        setMenuHeight(Math.max(
          0,
          Math.min(REVIEWER_DROPDOWN_DEFAULT_HEIGHT, availableHeight)
        ));
      }
    }
    if (scrollFades || matchPopoverBottom) {
      clearMenuEnhancements();
      menuSetupTimerRef.current = setTimeout(enhanceOpenMenu, 0);
    }
  };

  const changeReviewer = async nextReviewer => {
    const selected = reviewerForValue(users, nextReviewer);
    if (saving || !selected) {
      return;
    }
    const nextReviewerValue = selected.username === reviewer ? null : selected.username;
    if (!persistSelection) {
      setReviewer(nextReviewerValue);
      onChange?.({ reviewer: nextReviewerValue });
      return;
    }
    const previousReviewer = reviewer;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setReviewer(nextReviewerValue);
    setSaving(true);
    try {
      const updated = await onUpdate({ reviewer: nextReviewerValue });
      if (requestRef.current === requestId) {
        const hasCanonicalReviewer = Object.prototype.hasOwnProperty.call(
          updated || {}, 'reviewer'
        );
        setReviewer(hasCanonicalReviewer ? updated.reviewer || '' : previousReviewer);
        if (hasCanonicalReviewer && pickerMode) {
          onPickerClose?.();
        }
      }
    } catch {
      if (requestRef.current === requestId) {
        setReviewer(previousReviewer);
      }
    } finally {
      if (requestRef.current === requestId) {
        setSaving(false);
      }
    }
  };

  if (pickerMode) {
    return (
      <ReviewerPickerShell>
        <ReviewerPickerHeader>
          <ReviewerPickerBack
            type="button"
            aria-label="Back to Review"
            onClick={onPickerClose}
          >
            <IconAngleLeft aria-hidden="true" />
          </ReviewerPickerBack>
          <ReviewerPickerTitle>Select reviewer</ReviewerPickerTitle>
        </ReviewerPickerHeader>
        <ReviewerSearchWrap>
          <IconMagnifyingGlass aria-hidden="true" />
          <ReviewerSearch
            autoFocus
            type="search"
            aria-label="Search reviewers"
            placeholder="Search reviewers"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </ReviewerSearchWrap>
        <ReviewerPickerList role="listbox" aria-label="Reviewers">
          {usersLoading && (
            <ReviewerPickerState role="status"><Loader size="small" /></ReviewerPickerState>
          )}
          {!usersLoading && filteredUsers.map(user => {
            const selected = user.username === reviewer;
            return (
              <ReviewerPickerOption
                key={user.username}
                type="button"
                role="option"
                $selected={selected}
                aria-selected={selected}
                disabled={disabled || saving}
                onClick={() => changeReviewer(user.username)}
              >
                <ReviewerDisplay
                  avatar={user.avatar}
                  avatarSize={avatarSize}
                  name={user.name}
                />
                {selected && <IconCheck aria-hidden="true" />}
              </ReviewerPickerOption>
            );
          })}
          {!usersLoading && filteredUsers.length === 0 && (
            <ReviewerPickerState>No reviewers found</ReviewerPickerState>
          )}
        </ReviewerPickerList>
      </ReviewerPickerShell>
    );
  }

  if (onOpenPicker) {
    return (
      <ControlWrap ref={controlWrapRef}>
        <ReviewerTrigger
          type="button"
          size="small"
          colorStyle="secondary"
          variant="outline"
          aria-label={controlId}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={onOpenPicker}
        >
          <ReviewerDisplay
            avatar={selectedUser?.avatar}
            avatarSize={avatarSize}
            name={displayName}
            showAvatar={Boolean(reviewer)}
          />
        </ReviewerTrigger>
      </ControlWrap>
    );
  }

  return (
    <>
      {(scrollFades || matchPopoverBottom) && <ReviewerDropdownGlobalStyle />}
      <ControlWrap ref={controlWrapRef}>
        <InlineFormControl id={controlId}>
          <ScreenReaderLabel>Reviewer</ScreenReaderLabel>
          <Dropdown
            value={selectedUser ? selectedUser.email : ''}
            onChange={changeReviewer}
            onOpenChange={handleOpenChange}
            onSearch={setQuery}
            disabled={disabled}
            loader={usersLoading}
            aria-busy={saving || undefined}
            searchable="Search reviewers"
            noResultFoundText="No reviewers found"
            placement="bottom-start"
            forceWidth
            style={{
              height: matchPopoverBottom ? menuHeight : undefined,
              maxHeight: menuHeight
            }}
            zIndex={40}
            size="small"
            customTrigger={() => (
              <ReviewerTrigger
                type="button"
                size="small"
                colorStyle="secondary"
                variant="outline"
                endIcon={showArrow ? IconAngleDown : undefined}
                aria-label={controlId}
              >
                <ReviewerDisplay
                  avatar={selectedUser?.avatar}
                  avatarSize={avatarSize}
                  name={displayName}
                  showAvatar={Boolean(reviewer)}
                />
              </ReviewerTrigger>
            )}
          >
            {filteredUsers.map(user => (
              <DropdownOption key={user.username} value={user.username}>
                <ReviewerDisplay
                  avatar={user.avatar}
                  avatarSize={avatarSize}
                  name={user.name}
                />
              </DropdownOption>
            ))}
          </Dropdown>
        </InlineFormControl>
      </ControlWrap>
    </>
  );
};

InlineReviewerControl.propTypes = {
  avatarSize: PropTypes.oneOf(['2x-small', '3x-small', '4x-small']),
  commitOnChange: PropTypes.bool,
  controlId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  matchPopoverBottom: PropTypes.bool,
  onChange: PropTypes.func,
  onOpenPicker: PropTypes.func,
  onPickerClose: PropTypes.func,
  onUpdate: PropTypes.func,
  placeholder: PropTypes.string,
  pickerMode: PropTypes.bool,
  scrollFades: PropTypes.bool,
  showArrow: PropTypes.bool,
  value: PropTypes.string
};

InlineReviewerControl.defaultProps = {
  avatarSize: '2x-small',
  commitOnChange: true,
  disabled: false,
  matchPopoverBottom: false,
  onChange: undefined,
  onOpenPicker: undefined,
  onPickerClose: undefined,
  onUpdate: undefined,
  placeholder: 'Select a Reviewer',
  pickerMode: false,
  scrollFades: false,
  showArrow: false,
  value: ''
};
