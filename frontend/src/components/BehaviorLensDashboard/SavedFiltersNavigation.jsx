import React from 'react';
import { Button, Notification } from '../../ui';
import {
  IconFunnelFilled,
  IconTrashFilled
} from '../../ui/icons';
import {
  SavedFiltersBody,
  SavedFiltersItem,
  SavedFiltersItemAction,
  SavedFiltersItemButton,
  SavedFiltersList,
  SavedFiltersListFade,
  SavedFiltersListWrap,
  SavedFiltersNav,
  SavedFiltersToggle,
  SavedFiltersMessage,
  SavedFiltersStatus
} from './ScBehaviorLensSavedFilters';
import { savedFilterIdsMatch } from './behaviorLensSavedFilters';
import { useBehaviorLensSavedFiltersContext } from './BehaviorLensSavedFiltersContext';
import { SAVED_FILTERS_NOTIFICATION_ID } from './useBehaviorLensSavedFilters';
import useScrollEdgeFades from './useScrollEdgeFades';

const SavedFiltersScrollableList = ({
  deleting,
  handleSavedFilterChange,
  openDeleteDialog,
  savedFilters,
  selectedSavedFilter
}) => {
  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(
    savedFilters.map(item => item.id).join(':')
  );

  return (
    <SavedFiltersListWrap>
      <SavedFiltersList
        ref={scrollRef}
        aria-label="Saved filters"
      >
        {savedFilters.map(item => {
          const selected = savedFilterIdsMatch(selectedSavedFilter?.id, item.id);
          return (
            <SavedFiltersItem key={item.id} $selected={selected}>
              <SavedFiltersItemButton
                type="button"
                $selected={selected}
                aria-current={selected ? 'true' : undefined}
                aria-pressed={selected}
                onClick={() => handleSavedFilterChange(String(item.id))}
              >
                <span>{item.name}</span>
              </SavedFiltersItemButton>
              <SavedFiltersItemAction
                type="button"
                aria-label={`Delete Saved Filter "${item.name}"`}
                disabled={deleting}
                onClick={() => openDeleteDialog(item)}
              >
                <IconTrashFilled aria-hidden="true" />
              </SavedFiltersItemAction>
            </SavedFiltersItem>
          );
        })}
      </SavedFiltersList>
      <SavedFiltersListFade aria-hidden="true" $edge="top" $opacity={fadeTop} />
      <SavedFiltersListFade aria-hidden="true" $edge="bottom" $opacity={fadeBottom} />
    </SavedFiltersListWrap>
  );
};

const SavedFiltersNavigation = () => {
  const controller = useBehaviorLensSavedFiltersContext();

  if (!controller) {
    return null;
  }

  const {
    deleting,
    handleSavedFilterChange,
    loadSavedFilters,
    openDeleteDialog,
    replaceError,
    savedFilters,
    savedFiltersError,
    savedFiltersLoading,
    selectedSavedFilter,
    selectedSavedFilterId
  } = controller;
  const savedFilterSelected = Boolean(
    selectedSavedFilter || (savedFiltersLoading && selectedSavedFilterId)
  );

  const handleSavedFiltersClick = () => {
    if (savedFiltersLoading || savedFiltersError) {
      return;
    }
    if (savedFilters.length > 0) {
      const firstSavedFilterId = String(savedFilters[0].id);
      if (!savedFilterIdsMatch(selectedSavedFilterId, firstSavedFilterId)) {
        handleSavedFilterChange(firstSavedFilterId);
      }
      return;
    }
    Notification.show({
      description: 'There are no saved filters yet.',
      colorStyle: 'warning',
      containerId: SAVED_FILTERS_NOTIFICATION_ID
    });
  };

  return (
    <SavedFiltersNav>
      <SavedFiltersToggle
        type="button"
        $selected={savedFilterSelected}
        aria-pressed={savedFilterSelected}
        onClick={handleSavedFiltersClick}
      >
        <IconFunnelFilled aria-hidden="true" />
        <span>Saved Filters</span>
      </SavedFiltersToggle>

      <SavedFiltersBody>
        {savedFiltersLoading && <SavedFiltersMessage $inset>Loading Saved Filters...</SavedFiltersMessage>}
        {!savedFiltersLoading && savedFiltersError && (
          <SavedFiltersStatus>
            <SavedFiltersMessage $error role="alert">{savedFiltersError}</SavedFiltersMessage>
            <Button
              type="button"
              size="small"
              colorStyle="secondary"
              variant="outline"
              onClick={loadSavedFilters}
            >
              Retry
            </Button>
          </SavedFiltersStatus>
        )}
        {!savedFiltersLoading && !savedFiltersError && replaceError && (
          <SavedFiltersMessage $error $inset role="alert">{replaceError}</SavedFiltersMessage>
        )}
        {!savedFiltersLoading && !savedFiltersError && !savedFilters.length && (
          <SavedFiltersMessage $inset>No saved filters yet.</SavedFiltersMessage>
        )}
        {!savedFiltersLoading && !savedFiltersError && savedFilters.length > 0 && (
          <SavedFiltersScrollableList
            deleting={deleting}
            handleSavedFilterChange={handleSavedFilterChange}
            openDeleteDialog={openDeleteDialog}
            savedFilters={savedFilters}
            selectedSavedFilter={selectedSavedFilter}
          />
        )}
      </SavedFiltersBody>
    </SavedFiltersNav>
  );
};

export default SavedFiltersNavigation;
