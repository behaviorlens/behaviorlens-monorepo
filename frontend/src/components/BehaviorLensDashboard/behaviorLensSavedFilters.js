import { PRIORITY_FILTER_OPTIONS, REVIEW_STATUS_FILTER_OPTIONS } from './behaviorLensSessionFilters';
import { TAGS_PARAM, normalizeTagFilterValue } from './behaviorLensSessionTags';

export const SAVED_FILTER_ID_PARAM = 'savedFilterId';
export const PAGE_PARAM = 'page';
export const BOOKMARKED_OVERRIDE_PARAM = 'bookmarkedOverride';
const SAVED_FILTER_ID_PATTERN = /^[0-9a-f]{36}$/;

export const SAVED_FILTER_FILTER_KEYS = [
  'q',
  'status',
  'range',
  'sort',
  'username',
  'sitePath',
  'minEvents',
  'duration',
  'reviewStatus',
  TAGS_PARAM,
  'reviewer',
  'priority',
  'device',
  'country',
  'os',
  'ip',
  'bookmarked'
];

const STATUS_VALUES = ['all', 'active', 'completed', 'limit_reached'];
const RANGE_VALUES = ['all', 'today', '7d', '30d'];
const SORT_VALUES = ['latest', 'oldest', 'events_desc', 'events_asc'];
const RETIRED_SAVED_FILTER_FILTER_KEYS = ['rageClicks'];
const REVIEW_STATUS_VALUES = REVIEW_STATUS_FILTER_OPTIONS.map(option => option.value);
const PRIORITY_VALUES = PRIORITY_FILTER_OPTIONS.map(option => option.value);

const normalizeOptionalString = value => (typeof value === 'string' ? value.trim() : '');

const normalizeEnum = (value, allowedValues, defaultValue) => (
  allowedValues.includes(value) && value !== defaultValue ? value : undefined
);

const normalizePositiveInteger = value => {
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeCoreFilters = source => {
  const normalized = {};

  const query = normalizeOptionalString(source.q);
  if (query) {
    normalized.q = query;
  }

  const status = normalizeEnum(source.status, STATUS_VALUES, 'all');
  if (status) {
    normalized.status = status;
  }

  const range = normalizeEnum(source.range, RANGE_VALUES, 'all');
  if (range) {
    normalized.range = range;
  }

  const sort = normalizeEnum(source.sort, SORT_VALUES, 'latest');
  if (sort) {
    normalized.sort = sort;
  }

  return normalized;
};

export const normalizeSavedFilterId = id => {
  const value = typeof id === 'string' ? id : '';
  return SAVED_FILTER_ID_PATTERN.test(value) ? value : null;
};

export const normalizeSavedFilterFilters = filters => {
  const source = filters && typeof filters === 'object' && !Array.isArray(filters) ? filters : {};
  const normalized = normalizeCoreFilters(source);

  const username = normalizeOptionalString(source.username);
  if (username) {
    normalized.username = username;
  }

  const sitePath = normalizeOptionalString(source.sitePath);
  if (sitePath) {
    normalized.sitePath = sitePath;
  }

  const minEvents = normalizePositiveInteger(source.minEvents);
  if (minEvents) {
    normalized.minEvents = minEvents;
  }

  const duration = normalizePositiveInteger(source.duration);
  if (duration) {
    normalized.duration = duration;
  }

  const reviewStatus = normalizeEnum(source.reviewStatus, REVIEW_STATUS_VALUES, '');
  if (reviewStatus) {
    normalized.reviewStatus = reviewStatus;
  }

  const tags = normalizeTagFilterValue(source.tags);
  if (tags) {
    normalized.tags = tags;
  }

  const reviewer = normalizeOptionalString(source.reviewer);
  if (reviewer) {
    normalized.reviewer = reviewer;
  }

  const priority = normalizeEnum(source.priority, PRIORITY_VALUES, '');
  if (priority) {
    normalized.priority = priority;
  }

  ['device', 'country', 'os', 'ip'].forEach(key => {
    const value = normalizeOptionalString(source[key]);
    if (value) {
      normalized[key] = value;
    }
  });

  if (source.bookmarked === true || source.bookmarked === 'true') {
    normalized.bookmarked = true;
  }

  return normalized;
};

export const buildSavedFilterFilters = search => {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  return normalizeSavedFilterFilters(Object.fromEntries(
    SAVED_FILTER_FILTER_KEYS.map(key => [key, params.get(key)])
  ));
};

export const getSavedFilterId = search => {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  return normalizeSavedFilterId(params.get(SAVED_FILTER_ID_PARAM));
};

export const savedFilterIdsMatch = (first, second) => {
  const firstId = normalizeSavedFilterId(first);
  return firstId !== null && firstId === normalizeSavedFilterId(second);
};

export const getSavedFilterNameError = name => {
  if (typeof name !== 'string' || !name.trim()) {
    return 'Enter a name for this Saved Filter.';
  }
  if (Array.from(name.trim()).length > 100) {
    return 'Saved Filter names can contain at most 100 characters.';
  }
  return '';
};

export const getSavedFilterErrorMessage = (error, fallback) => {
  const response = error?.response || error;
  return response?.data?.content?.error
    || response?.data?.message
    || error?.message
    || fallback;
};

export const areSavedFilterFiltersApplied = (search, filters) => (
  JSON.stringify(buildSavedFilterFilters(search)) === JSON.stringify(normalizeSavedFilterFilters(filters))
);

export const applySavedFilterToSearch = (search, savedFilter) => {
  const params = new URLSearchParams(search);
  [...SAVED_FILTER_FILTER_KEYS, ...RETIRED_SAVED_FILTER_FILTER_KEYS]
    .forEach(key => params.delete(key));
  params.delete(PAGE_PARAM);
  params.delete(BOOKMARKED_OVERRIDE_PARAM);

  const filters = normalizeSavedFilterFilters(savedFilter?.filters);
  Object.entries(filters).forEach(([key, value]) => params.set(key, String(value)));

  const savedFilterId = normalizeSavedFilterId(savedFilter?.id);
  if (savedFilterId !== null) {
    params.set(SAVED_FILTER_ID_PARAM, savedFilterId);
  } else {
    params.delete(SAVED_FILTER_ID_PARAM);
  }

  return params;
};

export const updateDashboardFilterSearch = (search, name, value, defaultValue = '') => {
  const params = new URLSearchParams(search);
  params.delete(SAVED_FILTER_ID_PARAM);
  params.delete(PAGE_PARAM);
  params.delete(BOOKMARKED_OVERRIDE_PARAM);
  if (value === defaultValue || value === '') {
    params.delete(name);
  } else {
    params.set(name, value);
  }
  return params;
};

export const clearSavedFilterIdFromSearch = search => {
  const params = new URLSearchParams(search);
  params.delete(SAVED_FILTER_ID_PARAM);
  params.delete(BOOKMARKED_OVERRIDE_PARAM);
  return params;
};

export const clearSavedFilterFiltersFromSearch = search => {
  const params = new URLSearchParams(search);
  params.delete(SAVED_FILTER_ID_PARAM);
  params.delete(PAGE_PARAM);
  params.delete(BOOKMARKED_OVERRIDE_PARAM);
  [...SAVED_FILTER_FILTER_KEYS, ...RETIRED_SAVED_FILTER_FILTER_KEYS]
    .forEach(key => params.delete(key));
  return params;
};

export const readBookmarkedOnly = search => {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const override = params.get(BOOKMARKED_OVERRIDE_PARAM);
  if (override === 'true') return true;
  if (override === 'false') return false;
  return params.get('bookmarked') === 'true';
};

export const updateSavedFilterBookmarkedOverrideSearch = (
  search,
  bookmarked,
  savedFilterBookmarked = false
) => {
  const params = new URLSearchParams(search);
  const savedValue = savedFilterBookmarked === true || savedFilterBookmarked === 'true';
  params.delete(PAGE_PARAM);
  if (Boolean(bookmarked) === savedValue) {
    params.delete(BOOKMARKED_OVERRIDE_PARAM);
  } else {
    params.set(BOOKMARKED_OVERRIDE_PARAM, bookmarked ? 'true' : 'false');
  }
  return params;
};

export const readPageNumber = search => {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const page = Number(params.get(PAGE_PARAM));
  return Number.isInteger(page) && page > 1 ? page : 1;
};

export const writePageNumber = (search, page) => {
  const params = new URLSearchParams(search);
  if (Number(page) > 1) {
    params.set(PAGE_PARAM, String(Math.trunc(page)));
  } else {
    params.delete(PAGE_PARAM);
  }
  return params;
};
