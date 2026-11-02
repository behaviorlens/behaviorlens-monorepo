import { describeSessionDevice } from './behaviorLensSessionRows';
import { PRIORITY_LABELS, REVIEW_STATUS_LABELS } from './behaviorLensReviewQueue';
import { getReviewerFilterLabel } from './behaviorLensSessionReviewers';
import {
  SESSION_TAG_FILTERS,
  TAGS_PARAM,
  normalizeTagFilterValue
} from './behaviorLensSessionTags';

export { TAGS_PARAM } from './behaviorLensSessionTags';

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'limit_reached', label: 'Limit reached' }
];

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' }
];

const DURATION_THRESHOLD_OPTIONS = [
  { value: '30', label: '30 seconds or more' },
  { value: '60', label: '1 minute or more' },
  { value: '300', label: '5 minutes or more' },
  { value: '600', label: '10 minutes or more' },
  { value: '1800', label: '30 minutes or more' }
];

export const REVIEW_STATUS_FILTER_OPTIONS = [
  { value: 'unreviewed', label: REVIEW_STATUS_LABELS.unreviewed },
  { value: 'in_review', label: REVIEW_STATUS_LABELS.in_review },
  { value: 'resolved', label: REVIEW_STATUS_LABELS.resolved }
];

export const PRIORITY_FILTER_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  label,
  value
}));

// `scope` decides how a condition reaches the results:
// - `server` values are forwarded to listSessions();
// - `client` and `insight` values scan the playlist, then that matching set
//   is paged locally. Insight values also need the Intern insight payload.
export const FILTER_FIELDS = [
  {
    key: 'username',
    label: 'Username',
    section: 'session',
    scope: 'server',
    control: 'text',
    operator: 'contains',
    placeholder: 'Enter username'
  },
  {
    key: 'sitePath',
    label: 'Site Path',
    section: 'session',
    scope: 'server',
    control: 'text',
    operator: 'contains',
    placeholder: 'Enter path'
  },
  {
    key: 'status',
    label: 'Status',
    section: 'session',
    scope: 'server',
    control: 'select',
    operator: 'is',
    options: STATUS_OPTIONS,
    emptyValue: 'all',
    placeholder: 'Select Status'
  },
  {
    key: 'range',
    label: 'Date Range',
    section: 'session',
    scope: 'server',
    control: 'select',
    operator: 'is',
    options: DATE_RANGE_OPTIONS,
    emptyValue: 'all',
    placeholder: 'Select Date Range'
  },
  {
    key: 'minEvents',
    label: 'Events',
    section: 'session',
    scope: 'client',
    control: 'number',
    operator: 'are at least',
    placeholder: 'Enter number of events'
  },
  {
    key: 'duration',
    label: 'Duration',
    section: 'session',
    scope: 'client',
    control: 'select',
    operator: 'is',
    options: DURATION_THRESHOLD_OPTIONS,
    placeholder: 'Select Duration'
  },
  {
    // One condition, many tags: the URL keeps the comma list and a session
    // must carry every selected tag (see matchesTagFilters).
    key: TAGS_PARAM,
    label: 'Tags',
    section: 'session',
    scope: 'insight',
    control: 'multiselect',
    operator: 'are',
    options: SESSION_TAG_FILTERS,
    placeholder: 'Select Tags'
  },
  {
    key: 'reviewStatus',
    label: 'Review Status',
    section: 'review',
    scope: 'insight',
    control: 'select',
    operator: 'is',
    options: REVIEW_STATUS_FILTER_OPTIONS,
    placeholder: 'Select Review Status'
  },
  {
    key: 'reviewer',
    label: 'Reviewer',
    section: 'review',
    scope: 'insight',
    control: 'reviewer',
    operator: 'is',
    placeholder: 'Select Reviewer'
  },
  {
    key: 'priority',
    label: 'Priority',
    section: 'review',
    scope: 'insight',
    control: 'select',
    operator: 'is',
    options: PRIORITY_FILTER_OPTIONS,
    placeholder: 'Select Priority'
  },
  {
    key: 'device',
    label: 'Device',
    section: 'custom',
    scope: 'client',
    control: 'text',
    operator: 'contains',
    placeholder: 'Enter device'
  },
  {
    key: 'country',
    label: 'Country',
    section: 'custom',
    scope: 'client',
    control: 'text',
    operator: 'contains',
    placeholder: 'Enter country'
  },
  {
    key: 'os',
    label: 'OS',
    section: 'custom',
    scope: 'client',
    control: 'text',
    operator: 'contains',
    placeholder: 'Enter OS'
  },
  {
    key: 'ip',
    label: 'IP',
    section: 'custom',
    scope: 'client',
    control: 'text',
    operator: 'is',
    placeholder: 'Enter IP'
  }
];

export const FILTER_FIELD_BY_KEY = new Map(FILTER_FIELDS.map(field => [field.key, field]));
export const FILTER_FIELD_KEYS = FILTER_FIELDS.map(field => field.key);
export const CLIENT_CATALOG_FILTER_KEYS = FILTER_FIELDS
  .filter(field => field.scope === 'client' || field.scope === 'insight')
  .map(field => field.key);

export const hasClientSessionFilters = (values = {}, search = '') => (
  Boolean(String(search).trim())
  || CLIENT_CATALOG_FILTER_KEYS.some(key => Boolean(values[key]))
);

const LEGACY_FILTER_PARAMS = ['browser', 'rageClicks'];

export const SESSION_FIELD_KEYS = FILTER_FIELDS
  .filter(field => field.section === 'session').map(field => field.key);
export const REVIEW_FIELD_KEYS = FILTER_FIELDS
  .filter(field => field.section === 'review').map(field => field.key);
export const CUSTOM_FIELD_KEYS = FILTER_FIELDS
  .filter(field => field.section === 'custom').map(field => field.key);

const readParam = (params, key) => (params.get(key) || '').trim();

const isSelectableValue = (field, value) => (
  field.control !== 'select' || field.options.some(option => option.value === value)
);

export const getFilterFieldValue = (params, key) => {
  const field = FILTER_FIELD_BY_KEY.get(key);
  if (!field) {
    return '';
  }

  const value = readParam(params, key);
  if (!value || value === field.emptyValue) {
    return '';
  }
  if (field.key === 'minEvents') {
    // minEvents predates the preset thresholds, so any positive integer is valid.
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : '';
  }
  if (field.control === 'multiselect') {
    return normalizeTagFilterValue(value);
  }
  return isSelectableValue(field, value) ? value : '';
};

export const readSessionFilterValues = search => {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  return FILTER_FIELD_KEYS.reduce((values, key) => {
    const value = getFilterFieldValue(params, key);
    if (value) {
      values[key] = value;
    }
    return values;
  }, {});
};

export const countActiveFilters = values => Object.keys(values).length;

// Select conditions show the option label; free-entry conditions use their
// entered value.
export const getFilterValueDisplay = (field, value) => {
  if (field.control === 'multiselect') {
    return String(value).split(',')
      .map(part => field.options.find(item => item.value === part)?.label || part)
      .join(', ');
  }
  const option = field.options?.find(item => item.value === value);
  if (option) {
    return option.label;
  }
  if (field.key === 'reviewer') {
    return getReviewerFilterLabel(value);
  }
  return String(value);
};

// One chip per applied Filters-popover condition, in FILTER_FIELDS order —
// the same order the popup lists them. Tags collapse into one chip listing
// every selected tag. Search, sort, bookmark and the saved-view id are
// represented elsewhere and never become chips.
export const buildAppliedFilterChips = (values = {}) => FILTER_FIELDS.reduce((chips, field) => {
  const value = (values[field.key] || '').trim();
  if (value) {
    chips.push({
      displayValue: getFilterValueDisplay(field, value),
      key: field.key,
      label: field.label
    });
  }
  return chips;
}, []);

export const writeSessionFilterValues = (search, values) => {
  const params = new URLSearchParams(search);
  LEGACY_FILTER_PARAMS.forEach(key => params.delete(key));
  FILTER_FIELD_KEYS.forEach(key => {
    const field = FILTER_FIELD_BY_KEY.get(key);
    const value = (values[key] || '').trim();
    if (!value || value === field.emptyValue) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  return params;
};

// UTC 'Y-m-d H:i:s', matching how started_at is stored server-side.
const formatSqlDateTime = date => {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};

export const getDateRangeBounds = range => {
  if (!range || range === 'all') {
    return { dateFrom: null, dateTo: null };
  }

  const now = new Date();
  const dateTo = formatSqlDateTime(now);
  const from = new Date(now);

  if (range === 'today') {
    from.setUTCHours(0, 0, 0, 0);
  } else if (range === '7d') {
    from.setUTCDate(from.getUTCDate() - 7);
  } else if (range === '30d') {
    from.setUTCDate(from.getUTCDate() - 30);
  }

  return { dateFrom: formatSqlDateTime(from), dateTo };
};

export const buildServerFilters = (values, sort) => {
  const { dateFrom, dateTo } = getDateRangeBounds(values.range);
  return {
    status: values.status || 'all',
    sitePath: values.sitePath || '',
    username: values.username || '',
    dateFrom,
    dateTo,
    sort
  };
};

const includesTerm = (value, term) => String(value || '').toLowerCase().includes(term);

export const matchesSearchTerm = (session, sessionId, term) => {
  if (!term) {
    return true;
  }
  return [
    sessionId,
    session.slug,
    session.url,
    session.page_title,
    session.referrer,
    session.username,
    session.ip_address,
    session.user_agent,
    session.status
  ].some(value => includesTerm(value, term));
};

export const matchesClientFilters = (session, values, countryByUsername = new Map()) => {
  const minEvents = Number(values.minEvents || 0);
  if (minEvents > 0 && Number(session.event_count || 0) < minEvents) {
    return false;
  }

  const minDuration = Number(values.duration || 0);
  if (minDuration > 0 && Number(session.duration_s || 0) < minDuration) {
    return false;
  }

  if (values.ip && String(session.ip_address || '').trim() !== values.ip) {
    return false;
  }

  if (values.country) {
    const country = countryByUsername.get(session.username) || '';
    if (!includesTerm(country, values.country.toLowerCase())) {
      return false;
    }
  }

  if (!values.device && !values.os) {
    return true;
  }

  const device = describeSessionDevice(session.user_agent);
  if (values.device && !includesTerm(device.category, values.device.toLowerCase())) {
    return false;
  }
  if (values.os && !includesTerm(device.operatingSystem, values.os.toLowerCase())) {
    return false;
  }
  return true;
};

export const matchesReviewStatusFilter = (reviewStatus, value) => {
  if (!value) {
    return true;
  }
  return (reviewStatus || 'unreviewed') === value;
};

export const requiresReviewStatusData = values => Boolean(values.reviewStatus);

export const matchesReviewerFilter = (reviewer, value) => {
  if (!value) {
    return true;
  }
  return (reviewer || '') === value;
};

export const requiresReviewerData = values => Boolean(values.reviewer);

export const matchesPriorityFilter = (priority, value) => {
  if (!value) {
    return true;
  }
  return (priority || '') === value;
};

export const requiresPriorityData = values => Boolean(values.priority);
