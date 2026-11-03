import { listSessions } from '../../services/BehaviorLensService';
import {
  hasClientSessionFilters,
  matchesClientFilters,
  matchesPriorityFilter,
  matchesReviewerFilter,
  matchesReviewStatusFilter,
  matchesSearchTerm
} from './behaviorLensSessionFilters';
import { getSortOption, sortSessionsClientSide } from './behaviorLensSessionSort';
import { matchesTagFilters } from '../review/behaviorLensSessionTags';

export const SESSION_LIST_CATALOG_CHUNK = 100;

export const getSessionListItemId = item => item.id;

export const parseSessionListResponse = listResponse => {
  const sessions = Array.isArray(listResponse) ? listResponse : (listResponse?.sessions || []);
  const total = Array.isArray(listResponse) ? sessions.length : Number(listResponse?.total || 0);
  return { sessions, total };
};

export const sliceSessionPage = (sessions, page, pageSize) => {
  const size = Math.max(1, Number(pageSize) || 1);
  const currentPage = Math.max(1, Number(page) || 1);
  const start = (currentPage - 1) * size;
  return sessions.slice(start, start + size);
};

export const filterSessionsByReviewMetadata = ({
  activeTags,
  bookmarkedOnly,
  metadataBySessionId,
  sessions
}) => sessions.filter(session => {
  const sessionId = getSessionListItemId(session);
  const metadata = metadataBySessionId.get(sessionId);
  if (activeTags.length > 0 && !matchesTagFilters(metadata?.tags || [], activeTags)) {
    return false;
  }
  if (bookmarkedOnly && metadata?.bookmarked !== true) {
    return false;
  }
  return true;
});

export const requiresSessionListCatalog = ({
  activeTags = [],
  bookmarkedOnly = false,
  filterValues = {},
  search = '',
  sortBy
} = {}) => (
  activeTags.length > 0
  || Boolean(bookmarkedOnly)
  || hasClientSessionFilters(filterValues, search)
  || getSortOption(sortBy).scope !== 'server'
);

// Search, Filters popup conditions, tags, bookmarks and client-side sorts all
// walk the current server result set, then that matching playlist is paged.
export const filterCatalogSessions = ({
  activeTags = [],
  bookmarkedOnly = false,
  countryByUsername = new Map(),
  filterValues = {},
  metadataBySessionId = new Map(),
  priorityBySessionId = new Map(),
  reviewerBySessionId = new Map(),
  reviewStatusBySessionId = new Map(),
  search = '',
  sessions = [],
  sortBy
} = {}) => {
  const term = String(search).trim().toLowerCase();
  const applyPriorityFilter = Boolean(filterValues.priority);
  const applyReviewerFilter = Boolean(filterValues.reviewer);
  const applyReviewStatusFilter = Boolean(filterValues.reviewStatus);
  const entries = filterSessionsByReviewMetadata({
    activeTags,
    bookmarkedOnly,
    metadataBySessionId,
    sessions
  })
    .map(session => {
      const sessionId = getSessionListItemId(session);
      return {
        priority: priorityBySessionId.get(sessionId),
        reviewer: reviewerBySessionId.get(sessionId),
        reviewStatus: reviewStatusBySessionId.get(sessionId),
        session,
        sessionId
      };
    })
    .filter(entry => matchesSearchTerm(entry.session, entry.sessionId, term))
    .filter(entry => matchesClientFilters(entry.session, filterValues, countryByUsername))
    .filter(entry => (
      applyReviewStatusFilter
        ? matchesReviewStatusFilter(entry.reviewStatus, filterValues.reviewStatus)
        : true
    ))
    .filter(entry => (
      applyReviewerFilter
        ? matchesReviewerFilter(entry.reviewer, filterValues.reviewer)
        : true
    ))
    .filter(entry => (
      applyPriorityFilter
        ? matchesPriorityFilter(entry.priority, filterValues.priority)
        : true
    ));

  return sortSessionsClientSide(entries, sortBy).map(entry => entry.session);
};

// A matching playlist has to walk every session for the current server
// filters and then page locally.
export const listAllSessions = async (filters, listSessionsFn = listSessions) => {
  const collected = [];
  const seenIds = new Set();
  let offset = 0;
  let total = null;

  while (total === null || offset < total) {
    const limit = total === null
      ? SESSION_LIST_CATALOG_CHUNK
      : Math.min(SESSION_LIST_CATALOG_CHUNK, Math.max(0, total - offset));
    if (limit < 1) {
      break;
    }

    // Each next offset and every early-stop decision depend on the preceding page.
    const { sessions, total: reportedTotal } = parseSessionListResponse(
      // eslint-disable-next-line no-await-in-loop
      await listSessionsFn(limit, offset, filters)
    );
    if (total === null) {
      total = Number.isFinite(reportedTotal) ? reportedTotal : offset + sessions.length;
    }

    let addedCount = 0;
    sessions.forEach(session => {
      const sessionId = getSessionListItemId(session);
      if (sessionId && seenIds.has(sessionId)) {
        return;
      }
      if (sessionId) {
        seenIds.add(sessionId);
      }
      collected.push(session);
      addedCount += 1;
    });

    if (sessions.length === 0 || addedCount === 0) {
      break;
    }

    offset += sessions.length;
    if (sessions.length < limit) {
      break;
    }
  }

  return collected.slice(0, Number.isFinite(total) ? total : collected.length);
};
