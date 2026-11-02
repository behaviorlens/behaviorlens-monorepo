import React from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  InputText,
  Modal,
  ModalHeader,
  NotificationContainer
} from '../../ui';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import {
  SavedViewModalActions,
  SavedViewModalBody,
  SavedViewsMessage
} from './ScBehaviorLensSavedViews';
import { SAVED_VIEWS_NOTIFICATION_ID } from './useBehaviorLensSavedViews';
import { savedViewIdsMatch } from './behaviorLensSavedViews';
import { useBehaviorLensSavedViewsContext } from './BehaviorLensSavedViewsContext';

const SavedViewsDialogs = () => {
  const controller = useBehaviorLensSavedViewsContext();

  if (!controller) {
    return null;
  }

  const {
    closeDeleteDialog,
    closeSaveDialog,
    deleteDialogOpen,
    deleteError,
    deleting,
    handleDeleteSavedView,
    handleSaveCurrentView,
    hasReachedSavedViewsLimit,
    pendingDeleteSavedView,
    saveDialogOpen,
    saveError,
    savedViewName,
    savedViewsLimit,
    saving,
    selectedSavedView,
    setSaveError,
    setSavedViewName
  } = controller;

  return (
    <>
      <NotificationContainer
        containerId={SAVED_VIEWS_NOTIFICATION_ID}
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
        <SavedViewModalBody tabIndex={0}>
          <form className="w-full" id="behaviorlens-save-view-form" onSubmit={handleSaveCurrentView}>
            <FormControl
              className="w-full"
              id="behaviorlens-saved-view-name"
              colorStyle={saveError ? 'error' : 'default'}
              required
            >
              <FormLabel>Filter name</FormLabel>
              <InputText
                className="w-full"
                value={savedViewName}
                placeholder="My Filter"
                disabled={saving}
                onChange={event => {
                  setSavedViewName(event.target.value);
                  setSaveError('');
                }}
              />
              {saveError && <SavedViewsMessage $error role="alert">{saveError}</SavedViewsMessage>}
            </FormControl>
          </form>
          {hasReachedSavedViewsLimit && (
            <SavedViewsMessage>{`The ${savedViewsLimit}-filter limit has been reached.`}</SavedViewsMessage>
          )}
        </SavedViewModalBody>
        <SavedViewModalActions>
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
            form="behaviorlens-save-view-form"
            colorStyle="primary"
            variant="filled"
            loader={saving}
            loaderText="Saving..."
            disabled={!savedViewName.trim() || hasReachedSavedViewsLimit}
          >
            Save Filter
          </Button>
        </SavedViewModalActions>
      </Modal>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        isConfirming={deleting}
        showCloseButton={false}
        title={pendingDeleteSavedView ? `Delete "${pendingDeleteSavedView.name}"?` : 'Delete Saved Filter?'}
        description={savedViewIdsMatch(pendingDeleteSavedView?.id, selectedSavedView?.id)
          ? 'Session filters will return to their defaults.'
          : 'This saved filter will be removed without changing the current filters.'}
        footer={deleteError ? <SavedViewsMessage $error role="alert">{deleteError}</SavedViewsMessage> : null}
        confirmText="Delete Filter"
        confirmLoadingText="Deleting..."
        confirmButtonProps={{ colorStyle: 'error' }}
        onCancel={closeDeleteDialog}
        onConfirm={handleDeleteSavedView}
      />
    </>
  );
};

export default SavedViewsDialogs;
