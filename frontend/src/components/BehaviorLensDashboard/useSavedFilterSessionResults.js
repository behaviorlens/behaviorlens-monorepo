import { useCallback, useEffect, useRef } from 'react';
import { areSavedFilterFiltersApplied, savedFilterIdsMatch } from './behaviorLensSavedFilters';

const useSavedFilterSessionResults = ({
  bookmarkFilterLoading,
  filteredSessionCount,
  loading,
  locationSearch,
  queryKey,
  savedFiltersController
}) => {
  const settledQueryKeyRef = useRef(null);
  const {
    pendingSelectedFilter,
    reportSelectedFilterResults,
    selectedSavedFilter
  } = savedFiltersController;

  const markSessionResultsSettled = useCallback(() => {
    settledQueryKeyRef.current = queryKey;
  }, [queryKey]);

  const markSessionResultsFailed = useCallback(() => {
    settledQueryKeyRef.current = null;
  }, []);

  useEffect(() => {
    const selectedFilterIsApplied = pendingSelectedFilter
      && savedFilterIdsMatch(selectedSavedFilter?.id, pendingSelectedFilter.id)
      && areSavedFilterFiltersApplied(locationSearch, pendingSelectedFilter.filters);
    if (
      !selectedFilterIsApplied
      || loading
      || bookmarkFilterLoading
      || settledQueryKeyRef.current !== queryKey
    ) {
      return;
    }
    reportSelectedFilterResults(filteredSessionCount > 0);
  }, [
    bookmarkFilterLoading,
    filteredSessionCount,
    loading,
    locationSearch,
    pendingSelectedFilter,
    queryKey,
    reportSelectedFilterResults,
    selectedSavedFilter
  ]);

  return { markSessionResultsFailed, markSessionResultsSettled };
};

export default useSavedFilterSessionResults;
