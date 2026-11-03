import React, {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { DropdownOption, Tooltip } from '../../ui';
import { IconAngleDown, IconTrashFilled, IconXmark } from '../../ui/icons';
import { listReviewUsers } from '../../services/BehaviorLensService';
import { ReviewerDisplay } from './ReviewInlineControls';
import { loadReviewerFilterOptions, matchesReviewerDirectoryQuery } from './behaviorLensSessionReviewers';
import { ToolbarTrigger, ToolbarTriggerBadge, ToolbarTriggerLabel } from './ScBehaviorLensSessionListPage';
import {
  FilterAddCondition,
  FilterClearAll,
  FilterCondition,
  FilterConditionActions,
  FilterConditionList,
  FilterConditionRemove,
  FilterConditionWhere,
  FilterFieldSelect,
  FilterOperator,
  FilterSection,
  FilterSectionTitle,
  FilterValueInput,
  FilterValueNumber,
  FilterValueSelect,
  PopoverAnchor,
  PopoverBody,
  PopoverCard,
  PopoverClose,
  PopoverFooter,
  PopoverGhostButton,
  PopoverPrimaryButton,
  MomentTagPill,
  NOTE_TAG_PRESENTATION,
  TagOptionMenuStyle
} from './ScBehaviorLensSessionPopovers';
import useSessionListPopover from './useSessionListPopover';
import {
  CUSTOM_FIELD_KEYS,
  FILTER_FIELD_BY_KEY,
  REVIEW_FIELD_KEYS,
  SESSION_FIELD_KEYS
} from './behaviorLensSessionFilters';
import { NOOP } from '../../lib/propDefaults';

// 75% of the original 900px value-column leftover, so the row fills the card.
const FILTER_CARD_WIDTH = 787;
const FILTER_CARD_MAX_HEIGHT = 654;
const FILTER_DROPDOWN_Z_INDEX = 500;
// Magnet medium rows are h-10 (40px). Search sits above the option list; keep
// the empty "Select Reviewer" row plus four people in view, then scroll.
const REVIEWER_MENU_ROW_PX = 40;
const REVIEWER_MENU_VISIBLE_COUNT = 4;
const REVIEWER_MENU_MAX_HEIGHT = REVIEWER_MENU_ROW_PX
  + ((REVIEWER_MENU_VISIBLE_COUNT + 1) * REVIEWER_MENU_ROW_PX);

let nextConditionId = 0;
const createConditionId = () => {
  nextConditionId += 1;
  return `filter-condition-${nextConditionId}`;
};

const SECTIONS = [
  {
    id: 'session',
    title: 'Session Fields',
    clearLabel: 'Session Fields',
    fieldKeys: SESSION_FIELD_KEYS
  },
  {
    id: 'review',
    title: 'Review Fields',
    clearLabel: 'Review Fields',
    fieldKeys: REVIEW_FIELD_KEYS
  },
  {
    id: 'custom',
    title: 'Custom fields · UX Issues & Technology',
    clearLabel: 'Custom fields',
    fieldKeys: CUSTOM_FIELD_KEYS
  }
];

// The popup edits a draft; nothing reaches the URL until Apply Filter or until
// the named Saved Filter is successfully created.
const buildDraft = values => Object.keys(values).map(key => ({
  id: createConditionId(),
  key,
  value: values[key]
}));

const draftToValues = draft => draft.reduce((values, condition) => {
  if (condition.value) {
    values[condition.key] = condition.value;
  }
  return values;
}, {});

// Chip × writes the URL immediately. Drop those keys from an already-open
// draft so the condition rows match, without wiping unapplied extra rows.
const dropRemovedAppliedKeys = (draft, previousKeys, nextValues) => {
  const nextKeys = new Set(Object.keys(nextValues));
  const removed = previousKeys.filter(key => !nextKeys.has(key));
  if (removed.length === 0) {
    return draft;
  }
  const removedSet = new Set(removed);
  return draft.filter(condition => !removedSet.has(condition.key));
};

const normalizeReviewerSearch = value => String(value || '').trim().toLocaleLowerCase();

const FilterReviewerValue = ({ id, onChange, value }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

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
    loadReviewerFilterOptions();
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = normalizeReviewerSearch(query);
    if (!normalizedQuery) {
      return users;
    }
    return users.filter(user => matchesReviewerDirectoryQuery(user, normalizedQuery));
  }, [query, users]);

  const selectedUser = users.find(user => user.username === value);

  return (
    <FilterValueSelect
      id={id}
      zIndex={FILTER_DROPDOWN_Z_INDEX}
      value={value}
      $placeholder={!value}
      searchable="Search reviewers"
      noResultFoundText="No reviewers found"
      loader={usersLoading}
      placeholder="Select Reviewer"
      aria-label="Reviewer value"
      data-behaviorlens-filter-value="reviewer"
      style={{ maxHeight: `${REVIEWER_MENU_MAX_HEIGHT}px` }}
      onOpenChange={open => open && setQuery('')}
      onSearch={setQuery}
      onChange={onChange}
    >
      <DropdownOption value="">Select Reviewer</DropdownOption>
      {value && !selectedUser && (
        <DropdownOption value={value}>
          <ReviewerDisplay name={value} showAvatar={false} />
        </DropdownOption>
      )}
      {filteredUsers.map(user => (
        <DropdownOption key={user.username} value={user.username}>
          <ReviewerDisplay avatar={user.avatar} name={user.name} />
        </DropdownOption>
      ))}
    </FilterValueSelect>
  );
};

FilterReviewerValue.propTypes = {
  id: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

const useRevealFilterValue = (autoOpen, field, id, onOpened) => {
  useEffect(() => {
    if (!autoOpen) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      const control = (id && document.getElementById(id))
        || document.querySelector(`[data-behaviorlens-filter-value="${field.key}"]`);
      if (!control) {
        return;
      }
      if (typeof control.scrollIntoView === 'function') {
        control.scrollIntoView({ block: 'nearest' });
      }
      control.focus();
      if (field.control === 'text' || field.control === 'number') {
        if (typeof control.select === 'function') {
          control.select();
        }
      } else {
        control.click();
      }
      onOpened();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoOpen, field, id, onOpened]);
};

const ConditionValue = ({
  autoOpen = false, field, id, onChange, onOpened = NOOP, value
}) => {
  useRevealFilterValue(autoOpen, field, id, onOpened);
  if (field.control === 'multiselect') {
    // The draft (and URL) keep the comma-joined list; the dropdown works on
    // the array form and selections are stored back in allowlist order.
    const selectedValues = value ? value.split(',') : [];
    return (
      <>
        <TagOptionMenuStyle />
        <FilterValueSelect
          id={id}
          multiple
          zIndex={FILTER_DROPDOWN_Z_INDEX}
          value={selectedValues}
          $placeholder={!selectedValues.length}
          $tagPills
          placeholder={field.placeholder}
          aria-label={`${field.label} value`}
          data-behaviorlens-filter-value={field.key}
          onChange={nextValues => onChange(
            field.options
              .filter(option => nextValues.includes(option.value))
              .map(option => option.value)
              .join(',')
          )}
        >
          {field.options.map(option => {
            const presentation = NOTE_TAG_PRESENTATION[option.value] || {
              background: `${option.color}1f`,
              border: option.color,
              color: option.color
            };
            const selected = selectedValues.includes(option.value);
            return (
              <DropdownOption
                key={option.value}
                value={option.value}
                className="behaviorlens-tag-option"
                style={{
                  '--behaviorlens-tag-border': presentation.border,
                  '--behaviorlens-tag-color': presentation.color
                }}
                tagStyles={{
                  backgroundColor: presentation.background,
                  border: `1px solid ${presentation.color}`,
                  borderRadius: '999px',
                  boxSizing: 'border-box',
                  color: presentation.color
                }}
              >
                <MomentTagPill
                  data-tag-option-pill
                  $presentation={presentation}
                  $selected={selected}
                >
                  {option.label}
                </MomentTagPill>
              </DropdownOption>
            );
          })}
        </FilterValueSelect>
      </>
    );
  }

  if (field.control === 'reviewer') {
    return <FilterReviewerValue id={id} value={value} onChange={onChange} />;
  }

  if (field.control === 'select') {
    return (
      <FilterValueSelect
        id={id}
        zIndex={FILTER_DROPDOWN_Z_INDEX}
        value={value}
        $placeholder={!value}
        aria-label={`${field.label} value`}
        data-behaviorlens-filter-value={field.key}
        onChange={onChange}
      >
        <DropdownOption value="">{field.placeholder || `Select ${field.label}`}</DropdownOption>
        {field.options.map(option => (
          <DropdownOption key={option.value} value={option.value}>{option.label}</DropdownOption>
        ))}
      </FilterValueSelect>
    );
  }

  if (field.control === 'number') {
    return (
      <FilterValueNumber
        id={id}
        min={1}
        step={1}
        value={value}
        placeholder={field.placeholder}
        aria-label={`${field.label} value`}
        data-behaviorlens-filter-value={field.key}
        onChange={event => onChange(event.target.value)}
      />
    );
  }

  return (
    <FilterValueInput
      id={id}
      type="text"
      value={value}
      placeholder={field.placeholder}
      aria-label={`${field.label} value`}
      data-behaviorlens-filter-value={field.key}
      onChange={event => onChange(event.target.value)}
    />
  );
};

ConditionValue.propTypes = {
  autoOpen: PropTypes.bool,
  field: PropTypes.object.isRequired,
  id: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onOpened: PropTypes.func,
  value: PropTypes.string.isRequired
};

const SessionFiltersPopover = ({
  activeFilterCount,
  focusFieldKey = null,
  onApply,
  onClose,
  onFocusFieldConsumed = NOOP,
  onOpen,
  onSaveFilter,
  open,
  saveDisabled = false,
  values
}) => {
  const {
    anchorRef, cardPosition, cardRef, closeAndRestoreFocus, triggerRef
  } = useSessionListPopover({
    align: 'left',
    onClose,
    open,
    width: FILTER_CARD_WIDTH
  });
  const appliedKeysRef = useRef(Object.keys(values));
  const wasOpenRef = useRef(false);
  const [draft, setDraft] = useState(() => buildDraft(values));
  const [valueRevealEpoch, setValueRevealEpoch] = useState(0);

  useEffect(() => {
    const nextKeys = Object.keys(values);
    if (!open) {
      wasOpenRef.current = false;
      appliedKeysRef.current = nextKeys;
      setValueRevealEpoch(0);
      return;
    }
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setDraft(buildDraft(values));
      appliedKeysRef.current = nextKeys;
      setValueRevealEpoch(epoch => epoch + 1);
      return;
    }
    const previousKeys = appliedKeysRef.current;
    appliedKeysRef.current = nextKeys;
    if (previousKeys.some(key => !(key in values))) {
      setDraft(previous => dropRemovedAppliedKeys(previous, previousKeys, values));
    }
  }, [open, values]);

  const usedKeys = draft.map(condition => condition.key);

  const addCondition = useCallback(fieldKeys => {
    setDraft(previous => {
      const nextKey = fieldKeys.find(key => !previous.some(condition => condition.key === key));
      return nextKey
        ? [...previous, { id: createConditionId(), key: nextKey, value: '' }]
        : previous;
    });
  }, []);

  const updateCondition = useCallback((index, changes) => {
    setDraft(previous => previous.map((condition, conditionIndex) => {
      if (conditionIndex !== index) {
        return condition;
      }
      const nextKey = changes.key && FILTER_FIELD_BY_KEY.has(changes.key)
        ? changes.key
        : condition.key;
      return { ...condition, ...changes, key: nextKey };
    }));
  }, []);

  const removeCondition = useCallback(index => {
    setDraft(previous => previous.filter((condition, conditionIndex) => conditionIndex !== index));
  }, []);

  // Draft-only, like + Add condition and the per-row ×: nothing reaches the
  // URL until Apply Filter. Other sections are left untouched.
  const clearSection = useCallback(sectionId => {
    setDraft(previous => previous.filter(condition => (
      FILTER_FIELD_BY_KEY.get(condition.key)?.section !== sectionId
    )));
  }, []);

  const applyDraft = useCallback(() => {
    onApply(draftToValues(draft));
    closeAndRestoreFocus();
  }, [closeAndRestoreFocus, draft, onApply]);

  const saveDraft = useCallback(() => {
    const draftValues = draftToValues(draft);
    closeAndRestoreFocus();

    // Let the popover finish closing before mounting the naming dialog. Opening
    // both overlays in the same interaction makes the dialog get dismissed by
    // the popover's outside-click/focus cleanup.
    window.requestAnimationFrame(() => onSaveFilter(draftValues));
  }, [closeAndRestoreFocus, draft, onSaveFilter]);

  return (
    <PopoverAnchor ref={anchorRef}>
      <ToolbarTrigger
        type="button"
        ref={triggerRef}
        $open={open}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? closeAndRestoreFocus() : onOpen())}
      >
        <ToolbarTriggerLabel>
          Filters
          {activeFilterCount > 0 && (
            <ToolbarTriggerBadge aria-label={`${activeFilterCount} active filters`}>
              {activeFilterCount}
            </ToolbarTriggerBadge>
          )}
        </ToolbarTriggerLabel>
        <IconAngleDown aria-hidden="true" />
      </ToolbarTrigger>

      {open && createPortal(
        <PopoverCard
          ref={cardRef}
          role="dialog"
          aria-label="Filter sessions"
          tabIndex={-1}
          $fixed
          $top={cardPosition.top}
          $left={cardPosition.left}
          $width={FILTER_CARD_WIDTH}
          $maxHeight={Math.min(FILTER_CARD_MAX_HEIGHT, cardPosition.maxHeight || FILTER_CARD_MAX_HEIGHT)}
        >
          <PopoverClose type="button" aria-label="Close filters" onClick={closeAndRestoreFocus}>
            <IconXmark aria-hidden="true" />
          </PopoverClose>
          <PopoverBody>
            {SECTIONS.map(section => {
              const conditions = draft
                .map((condition, index) => ({ ...condition, index }))
                .filter(condition => FILTER_FIELD_BY_KEY.get(condition.key)?.section === section.id);
              const availableKeys = section.fieldKeys.filter(key => !usedKeys.includes(key));

              return (
                <FilterSection key={section.id}>
                  <FilterSectionTitle $small={section.id === 'custom'}>
                    {section.title}
                  </FilterSectionTitle>
                  <FilterConditionList>
                    {conditions.map(condition => {
                      const field = FILTER_FIELD_BY_KEY.get(condition.key);
                      return (
                        <FilterCondition key={condition.id}>
                          <FilterConditionWhere aria-hidden="true">Where</FilterConditionWhere>
                          <FilterFieldSelect
                            id={`behaviorlens-filter-field-${condition.id}`}
                            zIndex={FILTER_DROPDOWN_Z_INDEX}
                            value={condition.key}
                            aria-label="Filter field"
                            onChange={key => {
                              if (!FILTER_FIELD_BY_KEY.has(key) || (
                                usedKeys.includes(key) && key !== condition.key
                              )) {
                                return;
                              }
                              updateCondition(condition.index, { key, value: '' });
                            }}
                          >
                            <DropdownOption value={condition.key}>{field.label}</DropdownOption>
                            {availableKeys.map(key => (
                              <DropdownOption key={key} value={key}>
                                {FILTER_FIELD_BY_KEY.get(key).label}
                              </DropdownOption>
                            ))}
                          </FilterFieldSelect>
                          <FilterOperator>{field.operator}</FilterOperator>
                          <ConditionValue
                            autoOpen={Boolean(valueRevealEpoch && focusFieldKey === condition.key)}
                            field={field}
                            id={`behaviorlens-filter-value-${condition.id}`}
                            value={condition.value}
                            onChange={value => updateCondition(condition.index, { value })}
                            onOpened={onFocusFieldConsumed}
                          />
                          <FilterConditionRemove
                            type="button"
                            aria-label={`Remove ${field.label} filter`}
                            onClick={() => removeCondition(condition.index)}
                          >
                            &times;
                          </FilterConditionRemove>
                        </FilterCondition>
                      );
                    })}
                    <FilterConditionActions>
                      <FilterAddCondition
                        type="button"
                        disabled={!availableKeys.length}
                        onClick={() => addCondition(section.fieldKeys)}
                      >
                        + Add condition
                      </FilterAddCondition>
                      {conditions.length > 1 && (
                        <Tooltip
                          as={FilterClearAll}
                          className="flex"
                          type="button"
                          placement="top"
                          title="Clear all"
                          usePortal
                          aria-label={`Clear all ${section.clearLabel} filters`}
                          onClick={() => clearSection(section.id)}
                        >
                          <IconTrashFilled aria-hidden="true" />
                        </Tooltip>
                      )}
                    </FilterConditionActions>
                  </FilterConditionList>
                </FilterSection>
              );
            })}
          </PopoverBody>
          <PopoverFooter>
            <PopoverPrimaryButton type="button" onClick={applyDraft}>Apply Filter</PopoverPrimaryButton>
            <PopoverGhostButton type="button" disabled={saveDisabled} onClick={saveDraft}>
              Save Filter
            </PopoverGhostButton>
          </PopoverFooter>
        </PopoverCard>,
        document.body
      )}
    </PopoverAnchor>
  );
};

SessionFiltersPopover.propTypes = {
  activeFilterCount: PropTypes.number.isRequired,
  focusFieldKey: PropTypes.string,
  onApply: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onFocusFieldConsumed: PropTypes.func,
  onOpen: PropTypes.func.isRequired,
  onSaveFilter: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  saveDisabled: PropTypes.bool,
  values: PropTypes.object.isRequired
};

export default SessionFiltersPopover;
