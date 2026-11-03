import React, {
  useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react';
import {
  DropdownOption, NotificationContainer, Tag
} from '../../ui';
import {
  IconAngleLeft, IconAngleRight, IconMagnifyingGlass, IconXmark
} from '../../ui/icons';
import SessionEmptyIllustration from '../../assets/behaviorlens-session-empty.svg';
import { listEnteredSessions } from '../../services/BehaviorLensService';
import { UserContext } from '../../contexts/UserContext';
import {
  filterCatalogSessions,
  getSessionListItemId,
  listAllSessions,
  requiresSessionListCatalog,
  sliceSessionPage
} from './behaviorLensSessionListCatalog';
import {
  AppliedFilterChip,
  AppliedFilterChipEdit,
  AppliedFilterChipRemove,
  AppliedFilterLabel,
  AppliedFilterRow,
  BookmarkedToggleControl,
  EmptyState,
  ListHint,
  Pager,
  PagerButton,
  PagerCluster,
  PagerLabel,
  PagerPageField,
  PagerPageGroup,
  PagerSizeControl,
  PagerSizeSelect,
  PagerSpacer,
  PlaylistHeader,
  RetryButton,
  SearchInput,
  SearchWrap,
  SessionListEmptyCopy,
  SessionListEmptyDescription,
  SessionListEmptyIllustration,
  SessionListEmptyState,
  SessionListEmptyTitle,
  SessionList,
  SessionListFade,
  SessionListLayout,
  SessionListOverlay,
  SessionListPane,
  SessionListScrollFrame,
  VisuallyHiddenInput
} from './ScBehaviorLensSessionListPage';
import {
  PageIntro,
  PageIntroSubtitle
} from './ScBehaviorLensDashboardPage';
import {
  SavedFilterBookmarkedToggleLabel,
  SavedFilterPlaylistCard,
  SavedFilterPlaylistTitle,
  SavedFilterToolbar
} from '../saved-filters/ScBehaviorLensSavedFilterDashboard';
import useSessionListEffectivePageSize from './useSessionListEffectivePageSize';
import useSessionListSearchParams from './useSessionListSearchParams';
import useScrollEdgeFades from '../shared/useScrollEdgeFades';
import SessionFiltersPopover from './SessionFiltersPopover';
import SessionSortPopover from './SessionSortPopover';
import useSavedFilterSessionResults from '../saved-filters/useSavedFilterSessionResults';
import { useBehaviorLensSavedFiltersContext } from '../saved-filters/BehaviorLensSavedFiltersContext';
import { buildSavedFilterFilters } from '../saved-filters/behaviorLensSavedFilters';
import { SessionListReviewMetadataProvider } from '../review/SessionListReviewMetadataSummary';
import { loadSessionListReviewMetadata } from '../review/useSessionListReviewMetadata';
import { loadSessionListReviewStatuses } from '../review/behaviorLensSessionReviewStatus';
import { loadReviewerFilterOptions } from '../review/behaviorLensSessionReviewers';
import SessionListRow, { SessionListRowSkeleton } from './SessionListRow';
import {
  buildSessionMatchCounts,
  buildVisitorCategories,
  buildVisitorCountries,
  getSessionContext
} from './behaviorLensSessionRows';
import { buildVisitorProfiles } from './behaviorLensVisitorProfiles';
import {
  buildAppliedFilterChips,
  buildServerFilters,
  countActiveFilters,
  matchesClientFilters,
  matchesSearchTerm,
  requiresPriorityData,
  requiresReviewerData,
  requiresReviewStatusData,
  writeSessionFilterValues
} from './behaviorLensSessionFilters';
import { matchesTagFilters } from '../review/behaviorLensSessionTags';
import {
  getServerSortValue,
  getSortOption,
  sortSessionsClientSide
} from './behaviorLensSessionSort';
import {
  DEFAULT_SESSION_PAGE_SIZE,
  SESSION_PAGE_SIZE_OPTIONS
} from './behaviorLensSessionListPaging';
import { REVIEW_METADATA_NOTIFICATION_ID } from '../review/useSessionReviewMetadata';
import DashboardPage from './DashboardPage';

const FILTER_DEBOUNCE_MS = 300;
const SESSION_LIST_REFRESH_MS = 30000;

const EMPTY_LAZY_STATE = {
  failedSessionIds: [],
  loading: false,
  ready: false,
  settledKey: '',
  values: new Map()
};

// Bookmarks and tags live on separate Intern endpoints, so they
// are only fetched when a filter or sort on the current page needs them.
const useLazySessionData = ({
  enabled, load, sessionCollectionKey, sessionIds
}) => {
  const [state, setState] = useState(EMPTY_LAZY_STATE);
  const [retryCount, setRetryCount] = useState(0);
  const sessionIdsRef = useRef(sessionIds);
  const retry = useCallback(() => setRetryCount(count => count + 1), []);
  sessionIdsRef.current = sessionIds;

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_LAZY_STATE);
      return undefined;
    }

    let current = true;
    setState(previous => (
      previous.settledKey === sessionCollectionKey && previous.ready
        ? previous
        : { ...previous, loading: true, ready: false }
    ));
    load(sessionIdsRef.current).then(({ failedSessionIds, values }) => {
      if (current) {
        setState({
          failedSessionIds,
          loading: false,
          ready: true,
          settledKey: sessionCollectionKey,
          values
        });
      }
    });

    return () => {
      current = false;
    };
  }, [enabled, load, retryCount, sessionCollectionKey]);

  const upsert = useCallback((sessionId, value) => {
    setState(previous => {
      const current = previous.values.get(sessionId);
      if (current?.bookmarked === value?.bookmarked
        && current?.tags === value?.tags) {
        return previous;
      }

      const nextValues = new Map(previous.values);
      nextValues.set(sessionId, current && typeof current === 'object'
        ? { ...current, ...value }
        : value);
      return { ...previous, values: nextValues };
    });
  }, []);

  return {
    ...state,
    ready: state.ready && state.settledKey === sessionCollectionKey,
    retry,
    upsert
  };
};

const loadReviewMetadata = sessionIds => loadSessionListReviewMetadata(sessionIds)
  .then(({ failedSessionIds, metadataBySessionId }) => ({
    failedSessionIds,
    values: metadataBySessionId
  }));

// The playlist owns filters, URL state, paging, lazy metadata and the pager
// in one controller; splitting them further would scatter the request keys.
// eslint-disable-next-line max-statements
const SessionListPage = () => {
  const { state: userState } = useContext(UserContext);
  const currentUsername = typeof userState?.user?.username === 'string'
    ? userState.user.username.trim()
    : '';
  const [enteredSessionIds, setEnteredSessionIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [dashboardSessions, setDashboardSessions] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(false);
  const [catalogFailedSessionIds, setCatalogFailedSessionIds] = useState([]);
  const [catalogReviewStatusFailed, setCatalogReviewStatusFailed] = useState(false);
  const [catalogRetryCount, setCatalogRetryCount] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [openPopover, setOpenPopover] = useState('');
  const [filterFocusKey, setFilterFocusKey] = useState(null);
  const [filterChipKey, setFilterChipKey] = useState(null);
  const [pageDraft, setPageDraft] = useState(null);
  const sessionListPaneRef = useRef(null);
  const catalogMatchesRef = useRef(null);
  const pageRef = useRef(1);
  const pageSizeRef = useRef(DEFAULT_SESSION_PAGE_SIZE);

  useEffect(() => {
    setEnteredSessionIds(new Set());
    if (!currentUsername) return undefined;

    let active = true;
    listEnteredSessions().then(content => {
      const serverIds = Array.isArray(content?.items)
        ? content.items.map(item => String(item?.session_id || '').trim()).filter(Boolean)
        : [];
      if (active) {
        setEnteredSessionIds(new Set(serverIds));
      }
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [currentUsername]);

  const {
    activeTags,
    applyFilterValues,
    bookmarkedOnly,
    filterValues,
    goToPage,
    location,
    page,
    search,
    sortBy,
    updateBookmarkedOnly,
    updateFilter
  } = useSessionListSearchParams();
  const [reviewerDirectoryVersion, setReviewerDirectoryVersion] = useState(0);
  const appliedFilterChips = useMemo(
    () => buildAppliedFilterChips(filterValues),
    [filterValues, reviewerDirectoryVersion]
  );

  useEffect(() => {
    loadReviewerFilterOptions().then(() => setReviewerDirectoryVersion(version => version + 1));
  }, []);

  const { pageSize, setPageSize } = useSessionListEffectivePageSize();
  pageRef.current = page;
  pageSizeRef.current = pageSize;

  const visitorCountries = useMemo(() => buildVisitorCountries(), []);

  const needsCatalog = requiresSessionListCatalog({
    activeTags,
    bookmarkedOnly,
    filterValues,
    search,
    sortBy
  });
  const catalogQueryKey = JSON.stringify({
    bookmarked: bookmarkedOnly,
    country: filterValues.country || '',
    device: filterValues.device || '',
    duration: filterValues.duration || '',
    ip: filterValues.ip || '',
    minEvents: filterValues.minEvents || '',
    os: filterValues.os || '',
    priority: filterValues.priority || '',
    q: search,
    reviewer: filterValues.reviewer || '',
    reviewStatus: filterValues.reviewStatus || '',
    retry: catalogRetryCount,
    sort: getSortOption(sortBy).scope === 'server' ? '' : sortBy,
    tags: activeTags
  });
  const retryCatalog = useCallback(() => setCatalogRetryCount(count => count + 1), []);
  const catalogInputsRef = useRef({
    activeTags,
    bookmarkedOnly,
    countryByUsername: visitorCountries,
    filterValues,
    search,
    sortBy
  });
  const needsCatalogRef = useRef(needsCatalog);
  catalogInputsRef.current = {
    activeTags,
    bookmarkedOnly,
    countryByUsername: visitorCountries,
    filterValues,
    search,
    sortBy
  };
  needsCatalogRef.current = needsCatalog;

  const sessionIds = useMemo(() => sessions.map(getSessionListItemId).filter(Boolean), [sessions]);
  const sessionCollectionKey = useMemo(() => JSON.stringify(sessionIds), [sessionIds]);

  const savedFiltersController = useBehaviorLensSavedFiltersContext() || {};
  const {
    openSaveDialog, savedFiltersError, savedFiltersLoading, selectedSavedFilter
  } = savedFiltersController;

  const handleSaveFilter = useCallback(values => {
    const pendingSearch = writeSessionFilterValues(location.search, values);
    openSaveDialog?.(buildSavedFilterFilters(pendingSearch));
  }, [location.search, openSaveDialog]);

  const reviewMetadata = useLazySessionData({
    enabled: bookmarkedOnly || activeTags.length > 0,
    load: loadReviewMetadata,
    sessionCollectionKey,
    sessionIds
  });

  const reviewMetadataPending = reviewMetadata.loading || (
    (bookmarkedOnly || activeTags.length > 0) && !reviewMetadata.ready
  );
  const lazyDataPending = reviewMetadataPending;

  // Tags, bookmarks, search, Filters popup conditions and client-side sorts
  // scan the playlist first, then that matching set is paged locally.
  const visibleSessions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const applyTagFilter = activeTags.length > 0 && reviewMetadata.ready;
    const applyBookmarkFilter = bookmarkedOnly && reviewMetadata.ready;
    const entries = sessions
      .map(session => {
        const sessionId = getSessionListItemId(session);
        return {
          session,
          sessionId,
          tags: reviewMetadata.values.get(sessionId)?.tags || []
        };
      })
      .filter(entry => matchesSearchTerm(entry.session, entry.sessionId, term))
      .filter(entry => matchesClientFilters(entry.session, filterValues, visitorCountries))
      .filter(entry => (applyTagFilter ? matchesTagFilters(entry.tags, activeTags) : true))
      .filter(entry => (
        applyBookmarkFilter
          ? reviewMetadata.values.get(entry.sessionId)?.bookmarked === true
          : true
      ));

    return sortSessionsClientSide(entries, sortBy);
  }, [
    activeTags,
    bookmarkedOnly,
    filterValues,
    reviewMetadata.ready,
    reviewMetadata.values,
    search,
    sessions,
    sortBy,
    visitorCountries
  ]);
  const {
    fadeBottom: playlistFadeBottom,
    fadeTop: playlistFadeTop,
    scrollRef: sessionListScrollRef
  } = useScrollEdgeFades(`${loading}:${visibleSessions.length}:${page}`);

  // Everything below is sent to the backend: status/site path/username/date
  // range and the four supported sort values.
  const activeFilters = useMemo(
    () => buildServerFilters(filterValues, getServerSortValue(sortBy)),
    [filterValues, sortBy]
  );

  // Debounced so typing in text filters doesn't fire a request per keystroke.
  // The Dashboard and playlist share one complete matching catalog; later
  // page changes only slice that set locally.
  const activeFiltersKey = JSON.stringify(activeFilters);
  const listQueryKey = `catalog:${activeFiltersKey}:${catalogQueryKey}`;
  const loadingQueryKey = listQueryKey;
  const loadingQueryKeyRef = useRef('');

  const { markSessionResultsFailed, markSessionResultsSettled } = useSavedFilterSessionResults({
    bookmarkFilterLoading: lazyDataPending,
    filteredSessionCount: visibleSessions.length,
    loading,
    locationSearch: location.search,
    queryKey: listQueryKey,
    savedFiltersController
  });

  // New visits keep arriving, so the list is fetched again every
  // SESSION_LIST_REFRESH_MS while the tab is visible, and when it becomes visible.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        setRefreshTick(tick => tick + 1);
      }
    };
    const timer = setInterval(refresh, SESSION_LIST_REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // A background refresh of a query that already loaded keeps the current
    // rows on screen (no skeletons) and keeps them if the request fails.
    const silent = loadingQueryKeyRef.current === loadingQueryKey;
    if (!silent) {
      catalogMatchesRef.current = null;
      setLoading(true);
      setDashboardLoading(true);
    }
    setDashboardError(false);
    setListError(false);

    const timer = setTimeout(() => {
      const filters = JSON.parse(activeFiltersKey);
      const catalogEnabled = needsCatalogRef.current;
      const catalogInputs = catalogInputsRef.current;
      const needsReviewMetadata = (
        catalogInputs.activeTags.length > 0 || catalogInputs.bookmarkedOnly
      );
      const needsReviewRecords = (
        requiresReviewStatusData(catalogInputs.filterValues)
        || requiresReviewerData(catalogInputs.filterValues)
        || requiresPriorityData(catalogInputs.filterValues)
      );
      const request = listAllSessions(filters).then(async catalog => {
        if (catalogEnabled) {
          const catalogSessionIds = catalog.map(getSessionListItemId).filter(Boolean);
          const reviewResult = needsReviewMetadata
            ? await loadReviewMetadata(catalogSessionIds)
            : { failedSessionIds: [], values: new Map() };
          const reviewRecordResult = needsReviewRecords
            ? await loadSessionListReviewStatuses()
            : {
              failedSessionIds: [],
              priorityBySessionId: new Map(),
              reviewerBySessionId: new Map(),
              reviewStatusBySessionId: new Map()
            };
          const matches = filterCatalogSessions({
            activeTags: catalogInputs.activeTags,
            bookmarkedOnly: catalogInputs.bookmarkedOnly,
            countryByUsername: catalogInputs.countryByUsername,
            filterValues: catalogInputs.filterValues,
            metadataBySessionId: reviewResult.values,
            priorityBySessionId: reviewRecordResult.priorityBySessionId,
            reviewerBySessionId: reviewRecordResult.reviewerBySessionId,
            reviewStatusBySessionId: reviewRecordResult.reviewStatusBySessionId,
            search: catalogInputs.search,
            sessions: catalog,
            sortBy: catalogInputs.sortBy
          });

          return {
            dashboardMatches: matches,
            failedSessionIds: reviewResult.failedSessionIds,
            matches,
            reviewStatusFailed: reviewRecordResult.failedSessionIds.length > 0,
            total: matches.length
          };
        }

        return {
          dashboardMatches: catalog,
          failedSessionIds: [],
          matches: catalog,
          reviewStatusFailed: false,
          total: catalog.length
        };
      });

      request.then(({
        dashboardMatches,
        failedSessionIds,
        matches,
        reviewStatusFailed,
        total
      }) => {
        if (cancelled) {
          return;
        }
        markSessionResultsSettled();
        setDashboardSessions(dashboardMatches);
        setDashboardError(false);
        loadingQueryKeyRef.current = loadingQueryKey;
        setCatalogFailedSessionIds(failedSessionIds);
        setCatalogReviewStatusFailed(Boolean(reviewStatusFailed));
        catalogMatchesRef.current = matches;
        setSessions(sliceSessionPage(matches, pageRef.current, pageSizeRef.current));
        setTotalSessions(total);
      }).catch(() => {
        if (!cancelled && !silent) {
          catalogMatchesRef.current = null;
          markSessionResultsFailed();
          setCatalogFailedSessionIds([]);
          setCatalogReviewStatusFailed(false);
          setSessions([]);
          setDashboardSessions([]);
          setTotalSessions(0);
          setDashboardError(true);
          setListError(true);
        }
      }).finally(() => {
        if (!cancelled) {
          setLoading(false);
          setDashboardLoading(false);
        }
      });
    }, FILTER_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    activeFiltersKey,
    listQueryKey,
    loadingQueryKey,
    markSessionResultsFailed,
    markSessionResultsSettled,
    refreshTick
  ]);

  useEffect(() => {
    if (!catalogMatchesRef.current) {
      return;
    }
    setSessions(sliceSessionPage(catalogMatchesRef.current, page, pageSize));
  }, [page, pageSize]);

  const pageCount = Math.max(1, Math.ceil(totalSessions / pageSize));

  // A page beyond the last one can only come from a stale URL or a filter that
  // shrank the result set, so it falls back to the last page that exists.
  useEffect(() => {
    if (!loading && !listError && page > pageCount) {
      goToPage(pageCount);
    }
  }, [goToPage, listError, loading, page, pageCount]);

  useEffect(() => {
    setPageDraft(null);
  }, [page]);

  const commitPageNumber = useCallback(event => {
    const draft = event?.target?.value;
    setPageDraft(null);
    if (draft === undefined || String(draft).trim() === '') {
      return;
    }
    const parsed = Number(draft);
    if (!Number.isInteger(parsed)) {
      return;
    }
    goToPage(Math.min(pageCount, Math.max(1, parsed)));
  }, [goToPage, pageCount]);

  const selectPageNumberValue = input => {
    if (typeof input?.select === 'function') {
      input.select();
    }
  };

  const handlePageNumberFocus = useCallback(event => {
    selectPageNumberValue(event.currentTarget);
  }, []);

  const handlePageNumberMouseDown = useCallback(event => {
    const input = event.currentTarget;
    if (document.activeElement === input) {
      event.preventDefault();
    }
    selectPageNumberValue(input);
  }, []);

  const handlePageNumberMouseUp = useCallback(event => {
    event.preventDefault();
    selectPageNumberValue(event.currentTarget);
  }, []);

  const handlePageNumberClick = useCallback(event => {
    selectPageNumberValue(event.currentTarget);
  }, []);

  const handlePageSizeChange = useCallback(value => {
    setPageSize(value);
    if (page !== 1) {
      goToPage(1);
    }
  }, [goToPage, page, setPageSize]);

  const activeFilterCount = countActiveFilters(filterValues);
  // Same write path as the Filters popup's Apply: the remaining values are
  // written (empty keys deleted) and savedFilterId/page drop with them, so the
  // badge, "N sessions" and the playlist all follow the URL like any filter
  // change.
  const removeAppliedFilter = useCallback(key => {
    if (!(key in filterValues)) {
      return;
    }
    if (filterChipKey === key) {
      setFilterChipKey(null);
      setFilterFocusKey(null);
    }
    applyFilterValues(Object.fromEntries(
      Object.entries(filterValues).filter(([filterKey]) => filterKey !== key)
    ));
  }, [applyFilterValues, filterChipKey, filterValues]);
  const consumeFilterFocus = useCallback(() => setFilterFocusKey(null), []);
  const closeFilters = useCallback(() => {
    setOpenPopover('');
    setFilterFocusKey(null);
    setFilterChipKey(null);
  }, []);
  const skipChipToggleRef = useRef(false);
  const openAppliedFilter = useCallback(key => {
    if (skipChipToggleRef.current) {
      skipChipToggleRef.current = false;
      return;
    }
    if (openPopover === 'filters' && filterChipKey === key) {
      closeFilters();
      return;
    }
    setFilterChipKey(key);
    setFilterFocusKey(key);
    setOpenPopover('filters');
  }, [closeFilters, filterChipKey, openPopover]);
  // Magnet's value dropdown dismisses on capture pointerdown. Close the whole
  // Filters card in the same capture turn so the menu does not collapse first.
  useLayoutEffect(() => {
    if (openPopover !== 'filters' || !filterChipKey) {
      return undefined;
    }
    const handlePointerDown = event => {
      const target = event.target instanceof Element
        ? event.target
        : event.target?.parentElement;
      const edit = target?.closest?.('[data-behaviorlens-filter-chip-edit]');
      if (edit?.getAttribute('data-behaviorlens-filter-chip-key') !== filterChipKey) {
        return;
      }
      // Window capture runs before Magnet's document dismiss, so the value
      // menu never gets its own close frame.
      event.stopImmediatePropagation();
      event.stopPropagation();
      skipChipToggleRef.current = true;
      closeFilters();
      window.setTimeout(() => {
        skipChipToggleRef.current = false;
      }, 0);
    };
    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => window.removeEventListener('pointerdown', handlePointerDown, true);
  }, [closeFilters, filterChipKey, openPopover]);
  const hiddenOnPage = needsCatalog ? 0 : sessions.length - visibleSessions.length;
  const sortOption = getSortOption(sortBy);
  const sortsWithinPage = !needsCatalog && sortOption.scope !== 'server' && pageCount > 1;
  const sessionMatchCounts = useMemo(() => buildSessionMatchCounts(sessions), [sessions]);
  const visitorCategories = useMemo(
    () => buildVisitorCategories(buildVisitorProfiles(sessions)),
    [sessions]
  );
  const showSessionListEmptyState = (
    !loading && !listError && !lazyDataPending && visibleSessions.length === 0
  );
  return (
    <SessionListLayout $empty={showSessionListEmptyState}>
      <PageIntro>
        <PageIntroSubtitle>
          {selectedSavedFilter
            ? 'Showing only filtered data.'
            : "See what's happening on your site."}
        </PageIntroSubtitle>
      </PageIntro>

      <SavedFilterToolbar data-behaviorlens-session-toolbar="">
        <SearchWrap>
          <IconMagnifyingGlass aria-hidden="true" />
          <SearchInput
            type="search"
            value={search}
            aria-label="Search session details"
            placeholder="Search session details"
            onChange={event => updateFilter('q', event.target.value)}
          />
        </SearchWrap>

        <SessionFiltersPopover
          activeFilterCount={activeFilterCount}
          focusFieldKey={filterFocusKey}
          open={openPopover === 'filters'}
          saveDisabled={savedFiltersLoading || Boolean(savedFiltersError)}
          values={filterValues}
          onApply={applyFilterValues}
          onClose={closeFilters}
          onFocusFieldConsumed={consumeFilterFocus}
          onOpen={() => {
            setFilterFocusKey(null);
            setFilterChipKey(null);
            setOpenPopover('filters');
          }}
          onSaveFilter={handleSaveFilter}
        />

        <SessionSortPopover
          open={openPopover === 'sort'}
          value={sortBy}
          onChange={value => updateFilter('sort', value, 'latest')}
          onClose={() => setOpenPopover('')}
          onOpen={() => setOpenPopover('sort')}
        />
      </SavedFilterToolbar>

      {appliedFilterChips.length > 0 && (
        <AppliedFilterRow aria-label="Applied filters" role="list">
          <AppliedFilterLabel role="presentation">Active Filters</AppliedFilterLabel>
          {appliedFilterChips.map(chip => (
            <AppliedFilterChip
              key={chip.key}
              role="listitem"
              data-behaviorlens-applied-filter-chip=""
            >
              <Tag closable={false} size="small" colorStyle="gray">
                <AppliedFilterChipEdit
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={openPopover === 'filters' && filterChipKey === chip.key}
                  aria-label={`Edit ${chip.label} filter`}
                  data-behaviorlens-filter-chip-edit=""
                  data-behaviorlens-filter-chip-key={chip.key}
                  onClick={() => openAppliedFilter(chip.key)}
                >
                  {`${chip.label}: ${chip.displayValue}`}
                </AppliedFilterChipEdit>
                <AppliedFilterChipRemove
                  type="button"
                  aria-label={`Remove ${chip.label} filter`}
                  onClick={() => removeAppliedFilter(chip.key)}
                >
                  <IconXmark aria-hidden="true" />
                </AppliedFilterChipRemove>
              </Tag>
            </AppliedFilterChip>
          ))}
        </AppliedFilterRow>
      )}

      <NotificationContainer containerId={REVIEW_METADATA_NOTIFICATION_ID} />
      {showSessionListEmptyState ? (
        <SessionListEmptyState role="status">
          <SessionListEmptyIllustration aria-hidden="true">
            <img src={SessionEmptyIllustration} alt="" />
          </SessionListEmptyIllustration>
          <SessionListEmptyCopy>
            <SessionListEmptyTitle>No session data yet.</SessionListEmptyTitle>
            <SessionListEmptyDescription>
              No sessions match your current filters. Adjust your filters and try again.
            </SessionListEmptyDescription>
          </SessionListEmptyCopy>
        </SessionListEmptyState>
      ) : (
        <DashboardPage
          error={dashboardError}
          loading={dashboardLoading}
          savedFilterMode={Boolean(selectedSavedFilter)}
          sessions={dashboardSessions}
          playlist={(
            <SavedFilterPlaylistCard $savedFilterMode={Boolean(selectedSavedFilter)}>
              <PlaylistHeader>
                <SavedFilterPlaylistTitle>
                  Session Playlist
                </SavedFilterPlaylistTitle>
                <SavedFilterBookmarkedToggleLabel $savedFilterMode={Boolean(selectedSavedFilter)}>
                  <VisuallyHiddenInput
                    type="checkbox"
                    checked={bookmarkedOnly}
                    onChange={event => updateBookmarkedOnly(event.target.checked, selectedSavedFilter)}
                  />
                  <BookmarkedToggleControl $checked={bookmarkedOnly} aria-hidden="true" />
                  <span>Only Bookmarked Sessions</span>
                </SavedFilterBookmarkedToggleLabel>
              </PlaylistHeader>

              <SessionListPane ref={sessionListPaneRef}>
                <SessionListScrollFrame>
                  <SessionList
                    ref={sessionListScrollRef}
                    aria-label="Sessions"
                    aria-busy={loading || lazyDataPending}
                  >
                    {loading ? (
                      Array.from({ length: pageSize || DEFAULT_SESSION_PAGE_SIZE }).map((skeletonRow, rowIndex) => (
                        <SessionListRowSkeleton
                          key={`skeleton-${rowIndex}`}
                          showTags={!selectedSavedFilter}
                        />
                      ))
                    ) : (
                      visibleSessions.map(({ session, sessionId }) => {
                        const returnTo = `${location.pathname}${location.search}`;
                        const detailParams = new URLSearchParams({ returnTo });
                        const context = getSessionContext({
                          matchCount: sessionMatchCounts.get(session.username),
                          username: session.username,
                          visitorCategories
                        });

                        return (
                          <SessionListReviewMetadataProvider
                            key={sessionId}
                            sessionId={sessionId}
                            onMetadataChange={
                        bookmarkedOnly || activeTags.length > 0
                          ? reviewMetadata.upsert
                          : undefined
                      }
                            revalidate={!bookmarkedOnly && !activeTags.length}
                          >
                            <SessionListRow
                              contextLabel={context.label}
                              contextVariant={context.variant}
                              country={visitorCountries.get(session.username) || ''}
                              detailLocation={{
                                pathname: `/app/${sessionId}`,
                                search: `?${detailParams.toString()}`,
                                state: { returnTo }
                              }}
                              entered={enteredSessionIds.has(String(sessionId))}
                              session={session}
                              sessionId={sessionId}
                              showTags={!selectedSavedFilter}
                            />
                          </SessionListReviewMetadataProvider>
                        );
                      })
                    )}
                  </SessionList>
                  <SessionListFade aria-hidden="true" $edge="top" $opacity={playlistFadeTop} />
                  <SessionListFade aria-hidden="true" $edge="bottom" $opacity={playlistFadeBottom} />
                </SessionListScrollFrame>
                {!loading && listError && (
                <SessionListOverlay>
                  <EmptyState role="alert">Sessions could not be loaded.</EmptyState>
                </SessionListOverlay>
                )}
                {!loading && !lazyDataPending && (hiddenOnPage > 0 || sortsWithinPage) && (
                <ListHint>
                  {hiddenOnPage > 0 && `${hiddenOnPage} session${hiddenOnPage === 1 ? '' : 's'} on this page ${hiddenOnPage === 1 ? 'is' : 'are'} hidden by search or custom field filters. `}
                  {sortsWithinPage && `Sessions are sorted by "${sortOption.label}" within this page.`}
                </ListHint>
                )}
              </SessionListPane>
              {(
                catalogFailedSessionIds.length > 0
          || (reviewMetadata.ready && reviewMetadata.failedSessionIds.length > 0)
              ) && (
              <EmptyState role="status">
                Bookmark and tag information could not be loaded for some sessions.
                <RetryButton
                  type="button"
                  onClick={catalogFailedSessionIds.length > 0 ? retryCatalog : reviewMetadata.retry}
                >
                  Retry
                </RetryButton>
              </EmptyState>
              )}
              {catalogReviewStatusFailed && (
              <EmptyState role="status">
                Review status information could not be loaded.
                <RetryButton type="button" onClick={retryCatalog}>Retry</RetryButton>
              </EmptyState>
              )}
              {!listError && totalSessions > 0 && (
              <Pager aria-label="Session pages">
                <PagerSizeControl>
                  <PagerSizeSelect
                    value={String(pageSize)}
                    aria-label="Sessions per page"
                    disabled={loading}
                    onChange={handlePageSizeChange}
                  >
                    {SESSION_PAGE_SIZE_OPTIONS.map(size => (
                      <DropdownOption key={size} value={String(size)}>
                        {`Show ${size}`}
                      </DropdownOption>
                    ))}
                  </PagerSizeSelect>
                </PagerSizeControl>
                <PagerCluster>
                  <PagerButton
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1 || loading}
                    onClick={() => goToPage(page - 1)}
                  >
                    <IconAngleLeft aria-hidden="true" />
                  </PagerButton>
                  <PagerPageGroup>
                    <PagerLabel>Page</PagerLabel>
                    <PagerPageField
                      id="behaviorlens-session-page"
                      type="number"
                      min={1}
                      max={pageCount}
                      value={pageDraft ?? String(page)}
                      aria-label="Page number"
                      disabled={loading}
                      onChange={event => setPageDraft(event.target.value)}
                      onFocus={handlePageNumberFocus}
                      onMouseDown={handlePageNumberMouseDown}
                      onMouseUp={handlePageNumberMouseUp}
                      onClick={handlePageNumberClick}
                      onBlur={commitPageNumber}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          commitPageNumber(event);
                          event.currentTarget.blur();
                        }
                      }}
                    />
                    <PagerLabel>{`of ${pageCount.toLocaleString()}`}</PagerLabel>
                  </PagerPageGroup>
                  <PagerButton
                    type="button"
                    aria-label="Next page"
                    disabled={page >= pageCount || loading}
                    onClick={() => goToPage(page + 1)}
                  >
                    <IconAngleRight aria-hidden="true" />
                  </PagerButton>
                </PagerCluster>
                <PagerSpacer />
              </Pager>
              )}
            </SavedFilterPlaylistCard>
          )}
        />
      )}
    </SessionListLayout>
  );
};

export default SessionListPage;
