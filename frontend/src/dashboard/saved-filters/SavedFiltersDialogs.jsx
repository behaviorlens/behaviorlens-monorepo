import React from 'react';
import {
  Button, ConfirmationDialog, FormControl, FormLabel, InputText, Modal, ModalHeader, NotificationContainer
} from '../../ui';
import {
  SavedFilterModalActions,
  SavedFilterModalBody,
  SavedFiltersMessage
} from './ScBehaviorLensSavedFilters';
import { SAVED_FILTERS_NOTIFICATION_ID } from './useBehaviorLensSavedFilters';
import { savedFilterIdsMatch } from './behaviorLensSavedFilters';
import { useBehaviorLensSavedFiltersContext } from './BehaviorLensSavedFiltersContext';

const SavedFiltersDialogs = () => {
  const controller = useBehaviorLensSavedFiltersContext();

  if (!controller) {
    return null;
  }

  const {
    closeDeleteDialog,
    closeSaveDialog,
    deleteDialogOpen,
    deleteError,
    deleting,
    handleDeleteSavedFilter,
    handleSaveCurrentFilter,
    hasReachedSavedFiltersLimit,
    pendingDeleteSavedFilter,
    saveDialogOpen,
    saveError,
    savedFilterName,
    savedFiltersLimit,
    saving,
    selectedSavedFilter,
    setSaveError,
    setSavedFilterName
  } = controller;

  return (
    <>
      <NotificationContainer
        containerId={SAVED_FILTERS_NOTIFICATION_ID}
        position="top-right"
        autoClose={5000}
        draggable
        limit={3}
        offset="1rem"
        theme="light"
      />

      <Modal
        open={saveDialogOpen}
        ariaLabel="Save Current Filter"
        size="small"
        onClose={closeSaveDialog}
      >
        <ModalHeader
          title="Save Current Filter"
          description="Name this set of BehaviorLens filters."
          closeButtonVisible={false}
        />
        <SavedFilterModalBody tabIndex={0}>
          <form className="w-full" id="behaviorlens-save-filter-form" onSubmit={handleSaveCurrentFilter}>
            <FormControl
              className="w-full"
              id="behaviorlens-saved-filter-name"
              colorStyle={saveError ? 'error' : 'default'}
              required
            >
              <FormLabel>Filter name</FormLabel>
              <InputText
                className="w-full"
                value={savedFilterName}
                placeholder="My Filter"
                disabled={saving}
                onChange={event => {
                  setSavedFilterName(event.target.value);
                  setSaveError('');
                }}
              />
              {saveError && <SavedFiltersMessage $error role="alert">{saveError}</SavedFiltersMessage>}
            </FormControl>
          </form>
          {hasReachedSavedFiltersLimit && (
            <SavedFiltersMessage>{`The ${savedFiltersLimit}-filter limit has been reached.`}</SavedFiltersMessage>
          )}
        </SavedFilterModalBody>
        <SavedFilterModalActions>
          <Button
            type="button"
            colorStyle="secondary"
            variant="ghost"
            disabled={saving}
            onClick={closeSaveDialog}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="behaviorlens-save-filter-form"
            colorStyle="primary"
            variant="filled"
            loader={saving}
            loaderText="Saving..."
            disabled={!savedFilterName.trim() || hasReachedSavedFiltersLimit}
          >
            Save Filter
          </Button>
        </SavedFilterModalActions>
      </Modal>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        isConfirming={deleting}
        showCloseButton={false}
        title={pendingDeleteSavedFilter ? `Delete "${pendingDeleteSavedFilter.name}"?` : 'Delete Saved Filter?'}
        description={savedFilterIdsMatch(pendingDeleteSavedFilter?.id, selectedSavedFilter?.id)
          ? 'Session filters will return to their defaults.'
          : 'This saved filter will be removed without changing the current filters.'}
        footer={deleteError ? <SavedFiltersMessage $error role="alert">{deleteError}</SavedFiltersMessage> : null}
        confirmText="Delete Filter"
        confirmLoadingText="Deleting..."
        confirmButtonProps={{ colorStyle: 'error' }}
        onCancel={closeDeleteDialog}
        onConfirm={handleDeleteSavedFilter}
      />
    </>
  );
};

export default SavedFiltersDialogs;
