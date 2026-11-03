import { useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  BOOKMARKED_OVERRIDE_PARAM,
  PAGE_PARAM,
  SAVED_FILTER_ID_PARAM,
  readBookmarkedOnly,
  readPageNumber,
  updateDashboardFilterSearch,
  updateSavedFilterBookmarkedOverrideSearch,
  writePageNumber
} from './behaviorLensSavedFilters';
import {
  readSessionFilterValues,
  writeSessionFilterValues
} from './behaviorLensSessionFilters';
import { readTagFilters } from './behaviorLensSessionTags';
import { normalizeSortValue } from './behaviorLensSessionSort';

// Filters live in the URL, so browser navigation and the detail-page back link
// always restore the exact list state instead of stale component state.
const useSessionListSearchParams = () => {
  const history = useHistory();
  const location = useLocation();
  const filterParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const replaceSearchParams = useCallback(params => {
    const queryString = params.toString();
    const nextSearch = queryString ? `?${queryString}` : '';
    if (nextSearch !== location.search) {
      history.replace({ pathname: location.pathname, search: nextSearch });
    }
  }, [history, location.pathname, location.search]);

  const updateFilter = useCallback((name, value, defaultValue = '') => {
    replaceSearchParams(updateDashboardFilterSearch(location.search, name, value, defaultValue));
  }, [location.search, replaceSearchParams]);

  const applyFilterValues = useCallback(values => {
    const params = writeSessionFilterValues(location.search, values);
    params.delete(BOOKMARKED_OVERRIDE_PARAM);
    params.delete(SAVED_FILTER_ID_PARAM);
    params.delete(PAGE_PARAM);
    replaceSearchParams(params);
  }, [location.search, replaceSearchParams]);

  const updateBookmarkedOnly = useCallback((bookmarked, selectedSavedFilter = null) => {
    if (selectedSavedFilter) {
      replaceSearchParams(updateSavedFilterBookmarkedOverrideSearch(
        location.search,
        bookmarked,
        selectedSavedFilter.filters?.bookmarked
      ));
      return;
    }
    replaceSearchParams(updateDashboardFilterSearch(
      location.search,
      'bookmarked',
      bookmarked ? 'true' : ''
    ));
  }, [location.search, replaceSearchParams]);

  const goToPage = useCallback(page => {
    replaceSearchParams(writePageNumber(location.search, page));
  }, [location.search, replaceSearchParams]);

  // Memoized so the derived request filters keep a stable identity and the
  // session list is not re-fetched on every render.
  const filterValues = useMemo(() => readSessionFilterValues(filterParams), [filterParams]);
  const activeTags = useMemo(() => readTagFilters(filterParams), [filterParams]);

  return {
    activeTags,
    applyFilterValues,
    bookmarkedOnly: readBookmarkedOnly(filterParams),
    filterValues,
    goToPage,
    location,
    page: readPageNumber(filterParams),
    search: filterParams.get('q') || '',
    sortBy: normalizeSortValue(filterParams.get('sort')),
    updateBookmarkedOnly,
    updateFilter
  };
};

export default useSessionListSearchParams;
