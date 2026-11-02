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
  SavedViewsMessage,
  SavedViewsStatus
} from './ScBehaviorLensSavedViews';
import { savedViewIdsMatch } from './behaviorLensSavedViews';
import { useBehaviorLensSavedViewsContext } from './BehaviorLensSavedViewsContext';
import { SAVED_VIEWS_NOTIFICATION_ID } from './useBehaviorLensSavedViews';
import useScrollEdgeFades from './useScrollEdgeFades';

const SavedFiltersScrollableList = ({
  deleting,
  handleSavedViewChange,
  openDeleteDialog,
  savedViews,
  selectedSavedView
}) => {
  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(
    savedViews.map(view => view.id).join(':')
  );

  return (
    <SavedFiltersListWrap>
      <SavedFiltersList
        ref={scrollRef}
        aria-label="Saved filters"
      >
        {savedViews.map(view => {
          const selected = savedViewIdsMatch(selectedSavedView?.id, view.id);
          return (
            <SavedFiltersItem key={view.id} $selected={selected}>
              <SavedFiltersItemButton
                type="button"
                $selected={selected}
                aria-current={selected ? 'true' : undefined}
                aria-pressed={selected}
                onClick={() => handleSavedViewChange(String(view.id))}
              >
                <span>{view.name}</span>
              </SavedFiltersItemButton>
              <SavedFiltersItemAction
                type="button"
                aria-label={`Delete Saved Filter "${view.name}"`}
                disabled={deleting}
                onClick={() => openDeleteDialog(view)}
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
  const controller = useBehaviorLensSavedViewsContext();

  if (!controller) {
    return null;
  }

  const {
    deleting,
    handleSavedViewChange,
    loadSavedViews,
    openDeleteDialog,
    replaceError,
    savedViews,
    savedViewsError,
    savedViewsLoading,
    selectedSavedView,
    selectedSavedViewId
  } = controller;
  const savedFilterSelected = Boolean(
    selectedSavedView || (savedViewsLoading && selectedSavedViewId)
  );

  const handleSavedFiltersClick = () => {
    if (savedViewsLoading || savedViewsError) {
      return;
    }
    if (savedViews.length > 0) {
      const firstSavedViewId = String(savedViews[0].id);
      if (!savedViewIdsMatch(selectedSavedViewId, firstSavedViewId)) {
        handleSavedViewChange(firstSavedViewId);
      }
      return;
    }
    Notification.show({
      description: 'There are no saved filters yet.',
      colorStyle: 'warning',
      containerId: SAVED_VIEWS_NOTIFICATION_ID
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
        {savedViewsLoading && <SavedViewsMessage $inset>Loading Saved Filters...</SavedViewsMessage>}
        {!savedViewsLoading && savedViewsError && (
          <SavedViewsStatus>
            <SavedViewsMessage $error role="alert">{savedViewsError}</SavedViewsMessage>
            <Button
              type="button"
              size="small"
              colorStyle="secondary"
              variant="outline"
              onClick={loadSavedViews}
            >
              Retry
            </Button>
          </SavedViewsStatus>
        )}
        {!savedViewsLoading && !savedViewsError && replaceError && (
          <SavedViewsMessage $error $inset role="alert">{replaceError}</SavedViewsMessage>
        )}
        {!savedViewsLoading && !savedViewsError && !savedViews.length && (
          <SavedViewsMessage $inset>No saved filters yet.</SavedViewsMessage>
        )}
        {!savedViewsLoading && !savedViewsError && savedViews.length > 0 && (
          <SavedFiltersScrollableList
            deleting={deleting}
            handleSavedViewChange={handleSavedViewChange}
            openDeleteDialog={openDeleteDialog}
            savedViews={savedViews}
            selectedSavedView={selectedSavedView}
          />
        )}
      </SavedFiltersBody>
    </SavedFiltersNav>
  );
};

export default SavedFiltersNavigation;
