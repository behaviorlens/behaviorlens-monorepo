import { getLocalStorage } from '../../lib/storage';

export const SESSION_DETAIL_SECTIONS_STORAGE_KEY = 'behaviorlens:session-detail-sections:v1';
export const SESSION_DETAIL_TAB_STORAGE_KEY = 'behaviorlens:session-detail-tab:v1';
export const SESSION_LIST_DETAILS_STORAGE_KEY = 'behaviorlens:session-list-details:v1';
export const SESSION_LIST_PAGE_SIZE_STORAGE_KEY = 'behaviorlens:session-list-page-size:v1';
export const SAVED_FILTERS_EXPANDED_STORAGE_KEY = 'behaviorlens:saved-filters-expanded:v1';
export const SESSION_REPLAY_PLAYBACK_STORAGE_KEY = 'behaviorlens:session-replay-playback:v1';
export const DEFAULT_SAVED_FILTERS_EXPANDED = true;
export const SESSION_REPLAY_PLAYBACK_KEYS = ['autoplay', 'skipInactive'];
export const DEFAULT_SESSION_REPLAY_PLAYBACK = {
  autoplay: false,
  skipInactive: false
};

export const SESSION_DETAIL_SECTION_KEYS = [
  'sessionSummary',
  'review',
  'sessionLabels',
  'timeline'
];
export const SESSION_DETAIL_TAB_KEYS = [
  'sessionSummary',
  'review',
  'sessionLabels',
  'notes',
  'timeline'
];
export const DEFAULT_SESSION_DETAIL_TAB = 'sessionSummary';

// Workspace Session Replay rail (same storage key as embedded tabs). Session
// Summary is merged into Activity Log in the workspace, so that legacy/shared
// value resolves to Activity Log without rewriting the storage key. Embedded
// tabs still treat sessionSummary as their own valid value.
export const SESSION_REPLAY_RAIL_VIEW_KEYS = Object.freeze({
  activityLog: 'activityLog',
  sessionSummary: 'sessionSummary',
  aiSummary: 'aiSummary'
});
export const SESSION_REPLAY_RAIL_VIEWS = Object.freeze(
  Object.values(SESSION_REPLAY_RAIL_VIEW_KEYS)
);
export const DEFAULT_SESSION_REPLAY_RAIL_VIEW = SESSION_REPLAY_RAIL_VIEW_KEYS.activityLog;

export const SESSION_LIST_DETAIL_KEYS = [
  'device',
  'tags',
  'bookmark'
];

const isPlainObject = value => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype
);

export const readLayoutPreference = (storageKey, defaults, knownKeys) => {
  const storage = getLocalStorage();
  if (!storage) {
    return { ...defaults };
  }

  try {
    const rawValue = storage.getItem(storageKey);
    if (rawValue === null) {
      return { ...defaults };
    }
    const parsed = JSON.parse(rawValue);
    if (!isPlainObject(parsed)) {
      return { ...defaults };
    }

    return knownKeys.reduce((preference, key) => (
      typeof parsed[key] === 'boolean'
        ? { ...preference, [key]: parsed[key] }
        : preference
    ), { ...defaults });
  } catch (error) {
    return { ...defaults };
  }
};

export const isSessionDetailTab = value => SESSION_DETAIL_TAB_KEYS.includes(value);

export const isSessionReplayRailView = value => SESSION_REPLAY_RAIL_VIEWS.includes(value);

export const readSessionReplayRailView = () => {
  const storage = getLocalStorage();
  if (!storage) {
    return DEFAULT_SESSION_REPLAY_RAIL_VIEW;
  }

  try {
    const storedView = storage.getItem(SESSION_DETAIL_TAB_STORAGE_KEY);
    if (storedView === SESSION_REPLAY_RAIL_VIEW_KEYS.sessionSummary) {
      return SESSION_REPLAY_RAIL_VIEW_KEYS.activityLog;
    }
    return isSessionReplayRailView(storedView)
      ? storedView
      : DEFAULT_SESSION_REPLAY_RAIL_VIEW;
  } catch (error) {
    return DEFAULT_SESSION_REPLAY_RAIL_VIEW;
  }
};

export const writeSessionReplayRailView = view => {
  const storage = getLocalStorage();
  if (!storage || !isSessionReplayRailView(view)) {
    return;
  }

  try {
    storage.setItem(SESSION_DETAIL_TAB_STORAGE_KEY, view);
  } catch (error) {
    // Preference storage is optional; keep the current in-memory view usable.
  }
};

export const readSessionDetailTab = () => {
  const storage = getLocalStorage();
  if (!storage) {
    return DEFAULT_SESSION_DETAIL_TAB;
  }

  try {
    const storedTab = storage.getItem(SESSION_DETAIL_TAB_STORAGE_KEY);
    if (isSessionDetailTab(storedTab)) {
      return storedTab;
    }

    const previousSections = readLayoutPreference(
      SESSION_DETAIL_SECTIONS_STORAGE_KEY,
      {
        review: false,
        sessionLabels: false,
        sessionSummary: false,
        timeline: false
      },
      SESSION_DETAIL_SECTION_KEYS
    );
    return SESSION_DETAIL_TAB_KEYS.find(key => previousSections[key] === true)
      || DEFAULT_SESSION_DETAIL_TAB;
  } catch (error) {
    return DEFAULT_SESSION_DETAIL_TAB;
  }
};

export const writeSessionDetailTab = tab => {
  const storage = getLocalStorage();
  if (!storage || !isSessionDetailTab(tab)) {
    return;
  }

  try {
    storage.setItem(SESSION_DETAIL_TAB_STORAGE_KEY, tab);
  } catch (error) {
    // Preference storage is optional; keep the current in-memory tab usable.
  }
};

export const writeLayoutPreference = (storageKey, preference, knownKeys) => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    const storedPreference = knownKeys.reduce((result, key) => {
      if (typeof preference[key] === 'boolean') {
        result[key] = preference[key];
      }
      return result;
    }, {});
    storage.setItem(storageKey, JSON.stringify(storedPreference));
  } catch (error) {
    // Preference storage is optional; keep the current in-memory layout usable.
  }
};

export const readSavedFiltersExpanded = () => {
  const storage = getLocalStorage();
  if (!storage) {
    return DEFAULT_SAVED_FILTERS_EXPANDED;
  }

  try {
    const stored = storage.getItem(SAVED_FILTERS_EXPANDED_STORAGE_KEY);
    if (stored === 'true') {
      return true;
    }
    if (stored === 'false') {
      return false;
    }
    return DEFAULT_SAVED_FILTERS_EXPANDED;
  } catch (error) {
    return DEFAULT_SAVED_FILTERS_EXPANDED;
  }
};

export const writeSavedFiltersExpanded = expanded => {
  const storage = getLocalStorage();
  if (!storage || typeof expanded !== 'boolean') {
    return;
  }

  try {
    storage.setItem(SAVED_FILTERS_EXPANDED_STORAGE_KEY, String(expanded));
  } catch (error) {
    // Preference storage is optional; keep the current in-memory toggle usable.
  }
};

export const readSessionReplayPlaybackPreference = () => readLayoutPreference(
  SESSION_REPLAY_PLAYBACK_STORAGE_KEY,
  DEFAULT_SESSION_REPLAY_PLAYBACK,
  SESSION_REPLAY_PLAYBACK_KEYS
);

export const writeSessionReplayPlaybackPreference = patch => {
  if (!patch || typeof patch !== 'object') {
    return;
  }
  writeLayoutPreference(
    SESSION_REPLAY_PLAYBACK_STORAGE_KEY,
    {
      ...readSessionReplayPlaybackPreference(),
      ...patch
    },
    SESSION_REPLAY_PLAYBACK_KEYS
  );
};

// The playlist's sessions-per-page preference. Stored as a positive integer;
// the Show dropdown normalizes it to 10 / 25 / 50 / 100.
export const readSessionListCustomPageSize = () => {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const stored = storage.getItem(SESSION_LIST_PAGE_SIZE_STORAGE_KEY);
    if (stored === null || stored === '' || stored === 'auto') {
      return null;
    }
    const parsed = Number(stored);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch (error) {
    return null;
  }
};

export const writeSessionListCustomPageSize = pageSize => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    if (pageSize === null || pageSize === undefined || pageSize === 'auto') {
      storage.removeItem(SESSION_LIST_PAGE_SIZE_STORAGE_KEY);
      return;
    }
    if (Number.isInteger(pageSize) && pageSize > 0) {
      storage.setItem(SESSION_LIST_PAGE_SIZE_STORAGE_KEY, String(pageSize));
    }
  } catch (error) {
    // Preference storage is optional; keep the current in-memory size usable.
  }
};
