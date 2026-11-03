import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import { Notification } from '../../ui';
import { createSavedFilter, deleteSavedFilter, listSavedFilters, replaceSavedFilter } from '../../services/BehaviorLensService';
import {
  SAVED_FILTER_ID_PARAM,
  applySavedFilterToSearch,
  areSavedFilterFiltersApplied,
  buildSavedFilterFilters,
  clearSavedFilterFiltersFromSearch,
  clearSavedFilterIdFromSearch,
  getSavedFilterErrorMessage,
  getSavedFilterId,
  getSavedFilterNameError,
  normalizeSavedFilterFilters,
  normalizeSavedFilterId,
  savedFilterIdsMatch
} from './behaviorLensSavedFilters';

export const SAVED_FILTERS_NOTIFICATION_ID = 'behaviorlens-saved-filters-notification';

const useBehaviorLensSavedFilters = ({
  enabled = true, syncUrl = true, urlSearch, replaceSearchParams
}) => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [savedFiltersLoading, setSavedFiltersLoading] = useState(true);
  const [savedFiltersError, setSavedFiltersError] = useState('');
  const [savedFiltersTotal, setSavedFiltersTotal] = useState(0);
  const [savedFiltersLimit, setSavedFiltersLimit] = useState(50);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedFilterName, setSavedFilterName] = useState('');
  const [pendingSaveFilters, setPendingSaveFilters] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [replaceError, setReplaceError] = useState('');
  const [replacingSavedFilterId, setReplacingSavedFilterId] = useState(null);
  const [pendingDeleteSavedFilter, setPendingDeleteSavedFilter] = useState(null);
  const [pendingSelectedFilter, setPendingSelectedFilter] = useState(null);
  const filterParams = useMemo(() => new URLSearchParams(urlSearch), [urlSearch]);
  const selectedSavedFilterId = getSavedFilterId(filterParams);
  const selectedSavedFilter = useMemo(() => (
    savedFilters.find(item => savedFilterIdsMatch(item.id, selectedSavedFilterId)) || null
  ), [savedFilters, selectedSavedFilterId]);
  const savedFiltersRequestRef = useRef(0);

  const loadSavedFilters = useCallback(async () => {
    if (!enabled) {
      setSavedFiltersLoading(false);
      return;
    }
    const requestId = savedFiltersRequestRef.current + 1;
    savedFiltersRequestRef.current = requestId;
    setSavedFiltersLoading(true);
    setSavedFiltersError('');

    try {
      const response = await listSavedFilters();
      if (savedFiltersRequestRef.current !== requestId) {
        return;
      }
      const items = Array.isArray(response?.items) ? response.items : [];
      const total = Number(response?.total);
      const limit = Number(response?.limit);
      setSavedFilters(items);
      setSavedFiltersTotal(Number.isInteger(total) && total >= 0 ? total : items.length);
      setSavedFiltersLimit(Number.isInteger(limit) && limit > 0 ? limit : 50);
    } catch (error) {
      if (savedFiltersRequestRef.current === requestId) {
        setSavedFiltersError(getSavedFilterErrorMessage(error, 'Saved Filters could not be loaded.'));
      }
    } finally {
      if (savedFiltersRequestRef.current === requestId) {
        setSavedFiltersLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSavedFiltersLoading(false);
      return undefined;
    }
    loadSavedFilters();
    return () => {
      savedFiltersRequestRef.current += 1;
    };
  }, [enabled, loadSavedFilters]);

  useEffect(() => {
    if (!syncUrl || savedFiltersLoading || savedFiltersError || !filterParams.has(SAVED_FILTER_ID_PARAM)) {
      return;
    }

    if (!selectedSavedFilterId || !selectedSavedFilter) {
      replaceSearchParams(clearSavedFilterIdFromSearch(urlSearch));
      return;
    }

    if (!areSavedFilterFiltersApplied(urlSearch, selectedSavedFilter.filters)) {
      replaceSearchParams(applySavedFilterToSearch(urlSearch, selectedSavedFilter));
    }
  }, [
    filterParams,
    replaceSearchParams,
    savedFiltersError,
    savedFiltersLoading,
    selectedSavedFilter,
    selectedSavedFilterId,
    syncUrl,
    urlSearch
  ]);

  const hasReachedSavedFiltersLimit = savedFiltersTotal >= savedFiltersLimit;

  const handleSavedFilterChange = useCallback(value => {
    if (savedFilterIdsMatch(selectedSavedFilterId, value)) {
      setPendingSelectedFilter(null);
      replaceSearchParams(clearSavedFilterFiltersFromSearch(urlSearch));
      return;
    }

    const nextFilter = savedFilters.find(item => savedFilterIdsMatch(item.id, value));
    if (nextFilter) {
      setPendingSelectedFilter(nextFilter);
      replaceSearchParams(applySavedFilterToSearch(urlSearch, nextFilter));
    }
  }, [replaceSearchParams, savedFilters, selectedSavedFilterId, urlSearch]);

  const handleReplaceSavedFilter = useCallback(async item => {
    const itemId = normalizeSavedFilterId(item?.id);
    if (itemId === null || replacingSavedFilterId !== null) {
      return;
    }

    setReplacingSavedFilterId(itemId);
    setReplaceError('');
    try {
      const updatedFilter = await replaceSavedFilter(itemId, {
        name: item.name,
        filters: buildSavedFilterFilters(urlSearch)
      });
      if (!savedFilterIdsMatch(updatedFilter?.id, itemId)) {
        throw new Error('The Saved Filter response was invalid.');
      }

      setSavedFilters(previous => previous.map(savedFilter => (
        savedFilterIdsMatch(savedFilter.id, itemId) ? updatedFilter : savedFilter
      )));
      if (savedFilterIdsMatch(selectedSavedFilter?.id, itemId)) {
        replaceSearchParams(applySavedFilterToSearch(urlSearch, updatedFilter));
      }
      Notification.show({
        description: `Saved Filter "${updatedFilter.name}" updated.`,
        colorStyle: 'success',
        containerId: SAVED_FILTERS_NOTIFICATION_ID
      });
    } catch (error) {
      setReplaceError(getSavedFilterErrorMessage(error, 'The Saved Filter could not be updated.'));
    } finally {
      setReplacingSavedFilterId(null);
    }
  }, [replaceSearchParams, replacingSavedFilterId, selectedSavedFilter, urlSearch]);

  const reportSelectedFilterResults = useCallback(hasResults => {
    if (!pendingSelectedFilter) {
      return;
    }
    if (!hasResults) {
      Notification.show({
        description: `Saved Filter "${pendingSelectedFilter.name}" has no matching sessions.`,
        colorStyle: 'warning',
        containerId: SAVED_FILTERS_NOTIFICATION_ID
      });
    }
    setPendingSelectedFilter(null);
  }, [pendingSelectedFilter]);

  const openSaveDialog = useCallback(filters => {
    setSavedFilterName('');
    setSaveError('');
    setPendingSaveFilters(filters === undefined
      ? buildSavedFilterFilters(urlSearch)
      : normalizeSavedFilterFilters(filters));
    setSaveDialogOpen(true);
  }, [urlSearch]);

  const closeSaveDialog = useCallback(() => {
    if (!saving) {
      setSaveDialogOpen(false);
      setPendingSaveFilters(null);
    }
  }, [saving]);

  const handleSaveCurrentFilter = useCallback(async event => {
    event.preventDefault();
    if (saving) {
      return;
    }

    const validationError = getSavedFilterNameError(savedFilterName);
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    if (hasReachedSavedFiltersLimit) {
      setSaveError(`The maximum of ${savedFiltersLimit} Saved Filters has been reached.`);
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const name = savedFilterName.trim();
      const createdFilter = await createSavedFilter({
        name,
        filters: pendingSaveFilters || {}
      });
      const createdId = normalizeSavedFilterId(createdFilter?.id);
      if (createdId === null) {
        throw new Error('The Saved Filter response was invalid.');
      }

      setSavedFilters(previous => [
        createdFilter,
        ...previous.filter(item => !savedFilterIdsMatch(item.id, createdId))
      ]);
      setSavedFiltersTotal(previous => previous + 1);
      replaceSearchParams(applySavedFilterToSearch(urlSearch, createdFilter));
      setSaveDialogOpen(false);
      setPendingSaveFilters(null);
      Notification.show({
        description: `Saved Filter "${createdFilter.name}" created.`,
        colorStyle: 'success',
        containerId: SAVED_FILTERS_NOTIFICATION_ID
      });
    } catch (error) {
      setSaveError(getSavedFilterErrorMessage(error, 'The Saved Filter could not be created.'));
    } finally {
      setSaving(false);
    }
  }, [
    hasReachedSavedFiltersLimit,
    pendingSaveFilters,
    replaceSearchParams,
    savedFilterName,
    savedFiltersLimit,
    saving,
    urlSearch
  ]);

  const openDeleteDialog = useCallback(item => {
    if (!item) {
      return;
    }

    setPendingDeleteSavedFilter(item);
    setDeleteError('');
    setDeleteDialogOpen(true);
  }, [selectedSavedFilter]);

  const closeDeleteDialog = useCallback(() => {
    if (!deleting) {
      setPendingDeleteSavedFilter(null);
      setDeleteDialogOpen(false);
    }
  }, [deleting]);

  const reconcileMissingSavedFilter = useCallback(item => {
    const isDeletingSelectedFilter = savedFilterIdsMatch(selectedSavedFilter?.id, item.id);

    if (isDeletingSelectedFilter) {
      replaceSearchParams(clearSavedFilterFiltersFromSearch(urlSearch));
      setPendingSelectedFilter(null);
    }

    setSavedFilters(previous => previous.filter(savedFilter => !savedFilterIdsMatch(savedFilter.id, item.id)));
    setSavedFiltersTotal(previous => Math.max(0, previous - 1));
    setPendingDeleteSavedFilter(null);
    setDeleteDialogOpen(false);
  }, [replaceSearchParams, selectedSavedFilter, urlSearch]);

  const handleDeleteSavedFilter = useCallback(async () => {
    if (!pendingDeleteSavedFilter || deleting) {
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteSavedFilter(pendingDeleteSavedFilter.id);
      reconcileMissingSavedFilter(pendingDeleteSavedFilter);
      Notification.show({
        description: `Saved Filter "${pendingDeleteSavedFilter.name}" deleted.`,
        colorStyle: 'success',
        containerId: SAVED_FILTERS_NOTIFICATION_ID
      });
    } catch (error) {
      const response = error?.response || error;
      const status = Number(response?.data?.responseCode || response?.status);
      const message = getSavedFilterErrorMessage(error, 'The Saved Filter could not be deleted.');
      if (status === 404) {
        reconcileMissingSavedFilter(pendingDeleteSavedFilter);
        Notification.show({
          description: message,
          colorStyle: 'error',
          containerId: SAVED_FILTERS_NOTIFICATION_ID
        });
      } else {
        setDeleteError(message);
      }
    } finally {
      setDeleting(false);
    }
  }, [deleting, pendingDeleteSavedFilter, reconcileMissingSavedFilter]);

  return {
    closeDeleteDialog,
    closeSaveDialog,
    deleteDialogOpen,
    deleteError,
    deleting,
    handleDeleteSavedFilter,
    handleReplaceSavedFilter,
    handleSaveCurrentFilter,
    handleSavedFilterChange,
    hasReachedSavedFiltersLimit,
    loadSavedFilters,
    openDeleteDialog,
    openSaveDialog,
    pendingDeleteSavedFilter,
    pendingSelectedFilter,
    replaceError,
    replacingSavedFilterId,
    reportSelectedFilterResults,
    saveDialogOpen,
    saveError,
    savedFilterName,
    savedFilters,
    savedFiltersError,
    savedFiltersLimit,
    savedFiltersLoading,
    saving,
    selectedSavedFilter,
    selectedSavedFilterId,
    setSaveError,
    setSavedFilterName
  };
};

export default useBehaviorLensSavedFilters;
