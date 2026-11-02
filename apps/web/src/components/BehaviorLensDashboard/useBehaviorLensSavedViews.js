import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import { Notification } from '../../ui';
import { createSavedView, deleteSavedView, listSavedViews, replaceSavedView } from '../../services/BehaviorLensService';
import {
  SAVED_VIEW_ID_PARAM,
  applySavedViewToSearch,
  areSavedViewFiltersApplied,
  buildSavedViewFilters,
  clearSavedViewFiltersFromSearch,
  clearSavedViewIdFromSearch,
  getSavedViewErrorMessage,
  getSavedViewId,
  getSavedViewNameError,
  normalizeSavedViewFilters,
  normalizeSavedViewId,
  savedViewIdsMatch
} from './behaviorLensSavedViews';

export const SAVED_VIEWS_NOTIFICATION_ID = 'behaviorlens-saved-views-notification';

const useBehaviorLensSavedViews = ({
  enabled = true, syncUrl = true, urlSearch, replaceSearchParams
}) => {
  const [savedViews, setSavedViews] = useState([]);
  const [savedViewsLoading, setSavedViewsLoading] = useState(true);
  const [savedViewsError, setSavedViewsError] = useState('');
  const [savedViewsTotal, setSavedViewsTotal] = useState(0);
  const [savedViewsLimit, setSavedViewsLimit] = useState(50);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedViewName, setSavedViewName] = useState('');
  const [pendingSaveFilters, setPendingSaveFilters] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [replaceError, setReplaceError] = useState('');
  const [replacingSavedViewId, setReplacingSavedViewId] = useState(null);
  const [pendingDeleteSavedView, setPendingDeleteSavedView] = useState(null);
  const [pendingSelectedView, setPendingSelectedView] = useState(null);
  const filterParams = useMemo(() => new URLSearchParams(urlSearch), [urlSearch]);
  const selectedSavedViewId = getSavedViewId(filterParams);
  const selectedSavedView = useMemo(() => (
    savedViews.find(view => savedViewIdsMatch(view.id, selectedSavedViewId)) || null
  ), [savedViews, selectedSavedViewId]);
  const savedViewsRequestRef = useRef(0);

  const loadSavedViews = useCallback(async () => {
    if (!enabled) {
      setSavedViewsLoading(false);
      return;
    }
    const requestId = savedViewsRequestRef.current + 1;
    savedViewsRequestRef.current = requestId;
    setSavedViewsLoading(true);
    setSavedViewsError('');

    try {
      const response = await listSavedViews();
      if (savedViewsRequestRef.current !== requestId) {
        return;
      }
      const items = Array.isArray(response?.items) ? response.items : [];
      const total = Number(response?.total);
      const limit = Number(response?.limit);
      setSavedViews(items);
      setSavedViewsTotal(Number.isInteger(total) && total >= 0 ? total : items.length);
      setSavedViewsLimit(Number.isInteger(limit) && limit > 0 ? limit : 50);
    } catch (error) {
      if (savedViewsRequestRef.current === requestId) {
        setSavedViewsError(getSavedViewErrorMessage(error, 'Saved Filters could not be loaded.'));
      }
    } finally {
      if (savedViewsRequestRef.current === requestId) {
        setSavedViewsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSavedViewsLoading(false);
      return undefined;
    }
    loadSavedViews();
    return () => {
      savedViewsRequestRef.current += 1;
    };
  }, [enabled, loadSavedViews]);

  useEffect(() => {
    if (!syncUrl || savedViewsLoading || savedViewsError || !filterParams.has(SAVED_VIEW_ID_PARAM)) {
      return;
    }

    if (!selectedSavedViewId || !selectedSavedView) {
      replaceSearchParams(clearSavedViewIdFromSearch(urlSearch));
      return;
    }

    if (!areSavedViewFiltersApplied(urlSearch, selectedSavedView.filters)) {
      replaceSearchParams(applySavedViewToSearch(urlSearch, selectedSavedView));
    }
  }, [
    filterParams,
    replaceSearchParams,
    savedViewsError,
    savedViewsLoading,
    selectedSavedView,
    selectedSavedViewId,
    syncUrl,
    urlSearch
  ]);

  const hasReachedSavedViewsLimit = savedViewsTotal >= savedViewsLimit;

  const handleSavedViewChange = useCallback(value => {
    if (savedViewIdsMatch(selectedSavedViewId, value)) {
      setPendingSelectedView(null);
      replaceSearchParams(clearSavedViewFiltersFromSearch(urlSearch));
      return;
    }

    const nextView = savedViews.find(view => savedViewIdsMatch(view.id, value));
    if (nextView) {
      setPendingSelectedView(nextView);
      replaceSearchParams(applySavedViewToSearch(urlSearch, nextView));
    }
  }, [replaceSearchParams, savedViews, selectedSavedViewId, urlSearch]);

  const handleReplaceSavedView = useCallback(async view => {
    const viewId = normalizeSavedViewId(view?.id);
    if (viewId === null || replacingSavedViewId !== null) {
      return;
    }

    setReplacingSavedViewId(viewId);
    setReplaceError('');
    try {
      const updatedView = await replaceSavedView(viewId, {
        name: view.name,
        filters: buildSavedViewFilters(urlSearch)
      });
      if (!savedViewIdsMatch(updatedView?.id, viewId)) {
        throw new Error('The Saved Filter response was invalid.');
      }

      setSavedViews(previous => previous.map(savedView => (
        savedViewIdsMatch(savedView.id, viewId) ? updatedView : savedView
      )));
      if (savedViewIdsMatch(selectedSavedView?.id, viewId)) {
        replaceSearchParams(applySavedViewToSearch(urlSearch, updatedView));
      }
      Notification.show({
        description: `Saved Filter "${updatedView.name}" updated.`,
        colorStyle: 'success',
        containerId: SAVED_VIEWS_NOTIFICATION_ID
      });
    } catch (error) {
      setReplaceError(getSavedViewErrorMessage(error, 'The Saved Filter could not be updated.'));
    } finally {
      setReplacingSavedViewId(null);
    }
  }, [replaceSearchParams, replacingSavedViewId, selectedSavedView, urlSearch]);

  const reportSelectedViewResults = useCallback(hasResults => {
    if (!pendingSelectedView) {
      return;
    }
    if (!hasResults) {
      Notification.show({
        description: `Saved Filter "${pendingSelectedView.name}" has no matching sessions.`,
        colorStyle: 'warning',
        containerId: SAVED_VIEWS_NOTIFICATION_ID
      });
    }
    setPendingSelectedView(null);
  }, [pendingSelectedView]);

  const openSaveDialog = useCallback(filters => {
    setSavedViewName('');
    setSaveError('');
    setPendingSaveFilters(filters === undefined
      ? buildSavedViewFilters(urlSearch)
      : normalizeSavedViewFilters(filters));
    setSaveDialogOpen(true);
  }, [urlSearch]);

  const closeSaveDialog = useCallback(() => {
    if (!saving) {
      setSaveDialogOpen(false);
      setPendingSaveFilters(null);
    }
  }, [saving]);

  const handleSaveCurrentView = useCallback(async event => {
    event.preventDefault();
    if (saving) {
      return;
    }

    const validationError = getSavedViewNameError(savedViewName);
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    if (hasReachedSavedViewsLimit) {
      setSaveError(`The maximum of ${savedViewsLimit} Saved Filters has been reached.`);
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const name = savedViewName.trim();
      const createdView = await createSavedView({
        name,
        filters: pendingSaveFilters || {}
      });
      const createdId = normalizeSavedViewId(createdView?.id);
      if (createdId === null) {
        throw new Error('The Saved Filter response was invalid.');
      }

      setSavedViews(previous => [
        createdView,
        ...previous.filter(view => !savedViewIdsMatch(view.id, createdId))
      ]);
      setSavedViewsTotal(previous => previous + 1);
      replaceSearchParams(applySavedViewToSearch(urlSearch, createdView));
      setSaveDialogOpen(false);
      setPendingSaveFilters(null);
      Notification.show({
        description: `Saved Filter "${createdView.name}" created.`,
        colorStyle: 'success',
        containerId: SAVED_VIEWS_NOTIFICATION_ID
      });
    } catch (error) {
      setSaveError(getSavedViewErrorMessage(error, 'The Saved Filter could not be created.'));
    } finally {
      setSaving(false);
    }
  }, [
    hasReachedSavedViewsLimit,
    pendingSaveFilters,
    replaceSearchParams,
    savedViewName,
    savedViewsLimit,
    saving,
    urlSearch
  ]);

  const openDeleteDialog = useCallback(view => {
    if (!view) {
      return;
    }

    setPendingDeleteSavedView(view);
    setDeleteError('');
    setDeleteDialogOpen(true);
  }, [selectedSavedView]);

  const closeDeleteDialog = useCallback(() => {
    if (!deleting) {
      setPendingDeleteSavedView(null);
      setDeleteDialogOpen(false);
    }
  }, [deleting]);

  const reconcileMissingSavedView = useCallback(view => {
    const isDeletingSelectedView = savedViewIdsMatch(selectedSavedView?.id, view.id);

    if (isDeletingSelectedView) {
      replaceSearchParams(clearSavedViewFiltersFromSearch(urlSearch));
      setPendingSelectedView(null);
    }

    setSavedViews(previous => previous.filter(savedView => !savedViewIdsMatch(savedView.id, view.id)));
    setSavedViewsTotal(previous => Math.max(0, previous - 1));
    setPendingDeleteSavedView(null);
    setDeleteDialogOpen(false);
  }, [replaceSearchParams, selectedSavedView, urlSearch]);

  const handleDeleteSavedView = useCallback(async () => {
    if (!pendingDeleteSavedView || deleting) {
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteSavedView(pendingDeleteSavedView.id);
      reconcileMissingSavedView(pendingDeleteSavedView);
      Notification.show({
        description: `Saved Filter "${pendingDeleteSavedView.name}" deleted.`,
        colorStyle: 'success',
        containerId: SAVED_VIEWS_NOTIFICATION_ID
      });
    } catch (error) {
      const response = error?.response || error;
      const status = Number(response?.data?.responseCode || response?.status);
      const message = getSavedViewErrorMessage(error, 'The Saved Filter could not be deleted.');
      if (status === 404) {
        reconcileMissingSavedView(pendingDeleteSavedView);
        Notification.show({
          description: message,
          colorStyle: 'error',
          containerId: SAVED_VIEWS_NOTIFICATION_ID
        });
      } else {
        setDeleteError(message);
      }
    } finally {
      setDeleting(false);
    }
  }, [deleting, pendingDeleteSavedView, reconcileMissingSavedView]);

  return {
    closeDeleteDialog,
    closeSaveDialog,
    deleteDialogOpen,
    deleteError,
    deleting,
    handleDeleteSavedView,
    handleReplaceSavedView,
    handleSaveCurrentView,
    handleSavedViewChange,
    hasReachedSavedViewsLimit,
    loadSavedViews,
    openDeleteDialog,
    openSaveDialog,
    pendingDeleteSavedView,
    pendingSelectedView,
    replaceError,
    replacingSavedViewId,
    reportSelectedViewResults,
    saveDialogOpen,
    saveError,
    savedViewName,
    savedViews,
    savedViewsError,
    savedViewsLimit,
    savedViewsLoading,
    saving,
    selectedSavedView,
    selectedSavedViewId,
    setSaveError,
    setSavedViewName
  };
};

export default useBehaviorLensSavedViews;
