import { useCallback, useEffect, useRef } from 'react';
import { areSavedViewFiltersApplied, savedViewIdsMatch } from './behaviorLensSavedViews';

const useSavedViewSessionResults = ({
  bookmarkFilterLoading,
  filteredSessionCount,
  loading,
  locationSearch,
  queryKey,
  savedViewsController
}) => {
  const settledQueryKeyRef = useRef(null);
  const {
    pendingSelectedView,
    reportSelectedViewResults,
    selectedSavedView
  } = savedViewsController;

  const markSessionResultsSettled = useCallback(() => {
    settledQueryKeyRef.current = queryKey;
  }, [queryKey]);

  const markSessionResultsFailed = useCallback(() => {
    settledQueryKeyRef.current = null;
  }, []);

  useEffect(() => {
    const selectedViewIsApplied = pendingSelectedView
      && savedViewIdsMatch(selectedSavedView?.id, pendingSelectedView.id)
      && areSavedViewFiltersApplied(locationSearch, pendingSelectedView.filters);
    if (
      !selectedViewIsApplied
      || loading
      || bookmarkFilterLoading
      || settledQueryKeyRef.current !== queryKey
    ) {
      return;
    }
    reportSelectedViewResults(filteredSessionCount > 0);
  }, [
    bookmarkFilterLoading,
    filteredSessionCount,
    loading,
    locationSearch,
    pendingSelectedView,
    queryKey,
    reportSelectedViewResults,
    selectedSavedView
  ]);

  return { markSessionResultsFailed, markSessionResultsSettled };
};

export default useSavedViewSessionResults;
