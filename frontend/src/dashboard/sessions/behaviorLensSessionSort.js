import { getSessionIdentity } from './behaviorLensSessionRows';

export const DEFAULT_SORT = 'latest';

// `server` values are the four sorts the session list endpoint accepts and the
// only ones a Saved Filter can store. Everything else re-orders the cataloged
// matching playlist before it is paged.
export const SORT_GROUPS = [
  {
    label: 'Recency',
    options: [
      {
        value: 'latest', label: 'Most Recent', icon: 'clock', scope: 'server'
      },
      {
        value: 'oldest', label: 'Oldest', icon: 'clock', scope: 'server'
      }
    ]
  },
  {
    label: 'Duration',
    options: [
      {
        value: 'duration_desc', label: 'Longest Duration', icon: 'hourglass', scope: 'client'
      },
      {
        value: 'duration_asc', label: 'Shortest Duration', icon: 'hourglass', scope: 'client'
      }
    ]
  },
  {
    label: 'Events',
    options: [
      {
        value: 'events_desc', label: 'Most Events', icon: 'click', scope: 'server'
      },
      {
        value: 'events_asc', label: 'Fewest Events', icon: 'click', scope: 'server'
      }
    ]
  },
  {
    label: 'Username',
    options: [
      {
        value: 'username_asc', label: 'A to Z (username)', icon: 'alpha', scope: 'client'
      },
      {
        value: 'username_desc', label: 'Z to A (username)', icon: 'alpha', scope: 'client'
      }
    ]
  }
];

export const SORT_OPTIONS = SORT_GROUPS.flatMap(group => group.options);
export const SORT_OPTION_BY_VALUE = new Map(SORT_OPTIONS.map(option => [option.value, option]));
export const SORT_VALUES = SORT_OPTIONS.map(option => option.value);

export const normalizeSortValue = value => (
  SORT_OPTION_BY_VALUE.has(value) ? value : DEFAULT_SORT
);

export const getSortOption = value => SORT_OPTION_BY_VALUE.get(normalizeSortValue(value));

// The endpoint only understands the four server sorts, so a client sort keeps
// requesting the default order and re-sorts what came back.
export const getServerSortValue = value => {
  const option = getSortOption(value);
  return option.scope === 'server' ? option.value : DEFAULT_SORT;
};

const compareNumbers = (first, second) => first - second;

const compareText = (first, second) => String(first).localeCompare(String(second), undefined, {
  numeric: true,
  sensitivity: 'base'
});

const CLIENT_COMPARATORS = {
  duration_asc: (first, second) => compareNumbers(
    Number(first.session.duration_s || 0),
    Number(second.session.duration_s || 0)
  ),
  duration_desc: (first, second) => compareNumbers(
    Number(second.session.duration_s || 0),
    Number(first.session.duration_s || 0)
  ),
  username_asc: (first, second) => compareText(
    getSessionIdentity(first.session, first.sessionId),
    getSessionIdentity(second.session, second.sessionId)
  ),
  username_desc: (first, second) => compareText(
    getSessionIdentity(second.session, second.sessionId),
    getSessionIdentity(first.session, first.sessionId)
  )
};

// Sorting is stable so sessions that tie keep the order the endpoint returned.
export const sortSessionsClientSide = (entries, value) => {
  const comparator = CLIENT_COMPARATORS[normalizeSortValue(value)];
  if (!comparator) {
    return entries;
  }

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((first, second) => comparator(first.entry, second.entry) || (first.index - second.index))
    .map(item => item.entry);
};
