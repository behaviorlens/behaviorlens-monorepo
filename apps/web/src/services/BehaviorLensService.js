import { createAxiosInstance } from './basicLayer';

// One client for the BehaviorLens API.
const api = createAxiosInstance('/api/v1');

// The project the dashboard shows. Until Phase 2 adds accounts and project
// switching, this is the seeded demo project.
export const PROJECT_REF = import.meta.env.VITE_PROJECT || 'demo-shop';
const projectPath = path => `projects/${encodeURIComponent(PROJECT_REF)}${path}`;

export const REPLAY_TOO_LARGE_CODE = 'BEHAVIORLENS_REPLAY_TOO_LARGE';

// The replay-size guard can surface either as an HTTP 413, a responseCode
// of 413, or an explicit error code in the body. Detect all agreed shapes so the
// UI can show a clear "too large" state.
export const isReplayTooLargeError = error => {
  const response = error?.response || error || {};
  if (response.status === 413 || error?.status === 413) {
    return true;
  }

  const body = response.data ?? error?.data ?? {};
  if (Number(body.responseCode) === 413) {
    return true;
  }

  const code = body.errorCode || body.error_code || body.code || body.error;
  return typeof code === 'string' && code.toUpperCase() === REPLAY_TOO_LARGE_CODE;
};

// Sorts the API applies; other sort options are applied client-side.
const SERVER_SORTS = new Set(['newest', 'oldest', 'events_desc', 'events_asc']);

const sessionFilterParams = ({
  q, status, sitePath, username, minEvents, dateFrom, dateTo, source, sort
} = {}) => {
  const params = {};
  if (q && String(q).trim()) params.q = String(q).trim();
  if (status && status !== 'all') params.status = status;
  if (sitePath) params.site_path = sitePath;
  if (username) params.username = username;
  if (Number(minEvents) > 0) params.min_events = Number(minEvents);
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (source) params.source = source;
  if (SERVER_SORTS.has(sort)) params.sort = sort;
  return params;
};

// { total, sessions: [row] } for one page of the filtered session list.
export const listSessions = (limit = 50, offset = 0, filters = {}) => api.get(projectPath('/sessions'), {
  params: { limit, offset, ...sessionFilterParams(filters) }
});

// { totals, timeseries, topPages } for the filtered sessions.
export const getSessionStats = (filters = {}) => api.get(projectPath('/sessions/stats'), {
  params: sessionFilterParams(filters)
});

// { session_id, event_count, meta, events } for one session.
export const getReplay = sessionId => api.get(
  projectPath(`/sessions/${encodeURIComponent(sessionId)}/replay`)
);

// Review features: saved views, metadata, insights, AI summary, notes,
// mentions, reviews and users.

export const BEHAVIORLENS_SESSION_TAGS = [
  'bug',
  'ux-issue',
  'rage-click',
  'follow-up',
  'important',
  'false-positive'
];

export const BEHAVIORLENS_REVIEW_STATUSES = [
  'in_review',
  'resolved'
];

export const BEHAVIORLENS_REVIEW_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const savedViewBody = ({ name, filters }) => ({ name, filters });
const noteBody = text => ({ text });
const SESSION_ID_PATTERN = /^[0-9a-f]{36}$/;
const metadataPath = sessionId => `sessions/${sessionId}/metadata`;
const notesPath = sessionId => `sessions/${sessionId}/notes`;
const inboxPath = 'mentions-and-notes';
const repliesPath = noteId => `notes/${noteId}/replies`;
const reviewPath = sessionId => `reviews/${sessionId}`;
const aiSummaryPath = sessionId => `sessions/${sessionId}/ai-summary`;
const enteredPath = sessionId => `sessions/${sessionId}/entered`;

const requireSessionId = sessionId => {
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    return Promise.reject(new Error('AI Summary requires a valid session ID.'));
  }
  return null;
};

const mutableReviewBody = definition => {
  const body = {};
  ['review_status', 'priority', 'reviewer'].forEach(field => {
    if (Object.prototype.hasOwnProperty.call(definition || {}, field)) {
      body[field] = definition[field];
    }
  });
  return body;
};

const normalizeReviewStatuses = statuses => {
  const values = Array.isArray(statuses)
    ? statuses
    : String(statuses || '').split(',');
  const selected = new Set(values);
  return BEHAVIORLENS_REVIEW_STATUSES.filter(status => selected.has(status));
};

const reviewListParams = filters => {
  const params = {};
  const statuses = normalizeReviewStatuses(filters?.review_status);
  if (statuses.length > 0) {
    params.review_status = statuses.join(',');
  }
  if (typeof filters?.assigned_to_me === 'boolean') {
    params.assigned_to_me = String(filters.assigned_to_me);
  } else if (filters?.assigned_to_me === 'true' || filters?.assigned_to_me === 'false') {
    params.assigned_to_me = filters.assigned_to_me;
  }
  if (filters?.limit !== undefined) {
    params.limit = filters.limit;
  }
  if (filters?.offset !== undefined) {
    params.offset = filters.offset;
  }
  return params;
};

export const normalizeSessionTags = tags => {
  const selectedTags = new Set(Array.isArray(tags) ? tags : []);
  return BEHAVIORLENS_SESSION_TAGS.filter(tag => selectedTags.has(tag));
};

const momentBody = ({ offsetMs, tags, text }) => ({
  text: typeof text === 'string' ? text : '',
  tags: normalizeSessionTags(tags),
  replay_time_ms: Math.max(0, Math.floor(Number(offsetMs)))
});

const normalizeResponse = response => {
  if (typeof response?.responseCode !== 'number') {
    return response;
  }
  if (response.responseCode < 200 || response.responseCode > 299) {
    const error = new Error(response.message || 'The BehaviorLens Intern request failed.');
    error.response = { data: response };
    throw error;
  }
  return response.content;
};

const request = response => Promise.resolve(response).then(normalizeResponse);

const mentionsAndNotesParams = filters => {
  const params = {};
  ['view', 'q', 'limit', 'offset'].forEach(field => {
    if (filters?.[field] !== undefined && filters[field] !== '') {
      params[field] = filters[field];
    }
  });
  if (filters?.flagged === true) {
    params.flagged = 'true';
  }
  return params;
};

const normalizeReviewUser = user => ({
  name: String(
    user?.name || user?.displayName || user?.display_name || user?.username || ''
  ).trim(),
  username: String(user?.username || '').trim(),
  email: String(user?.email || '').trim(),
  avatar: user?.avatar ?? null
});

export const listReviewUsers = () => request(api.get('users')).then(content => {
  const items = Array.isArray(content?.items)
    ? content.items
    : (Array.isArray(content) ? content : []);
  return items.map(normalizeReviewUser).filter(user => user.username);
});

export const listSavedViews = () => request(api.get('saved-views'));

export const getSavedView = id => request(api.get(`saved-views/${id}`));

export const createSavedView = definition => (
  request(api.post('saved-views', savedViewBody(definition)))
);

export const replaceSavedView = (id, definition) => (
  request(api.put(`saved-views/${id}`, savedViewBody(definition)))
);

export const deleteSavedView = id => request(api.delete(`saved-views/${id}`));

export const getSessionMetadata = sessionId => request(api.get(metadataPath(sessionId)));

export const listEnteredSessions = () => request(api.get('entered-sessions'));

export const setSessionEntered = sessionId => request(api.put(
  enteredPath(sessionId),
  { entered: true }
));

export const getSessionInsights = sessionId => {
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    return Promise.reject(new Error('Session Insights require a valid session ID.'));
  }
  return request(api.get(`sessions/${sessionId}/insights`));
};

const finiteOrNull = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const countOrZero = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
};

export const normalizeSessionInsightSummary = content => ({
  analyzedSessionCount: countOrZero(content?.analyzed_session_count),
  averageQualityScore: finiteOrNull(content?.average_quality_score),
  qualityAffectedPercentage: finiteOrNull(content?.quality_affected_percentage),
  qualityAffectedSessions: countOrZero(content?.quality_affected_sessions),
  qualityAnalyzedSessionCount: countOrZero(content?.quality_analyzed_session_count),
  qualityDayOverDayPercentage: finiteOrNull(content?.quality_day_over_day_percentage),
  qualityTodaySessionCount: countOrZero(content?.quality_today_session_count),
  qualityUnavailableSessionCount: countOrZero(content?.quality_unavailable_session_count),
  qualityYesterdaySessionCount: countOrZero(content?.quality_yesterday_session_count),
  rageAffectedPercentage: finiteOrNull(content?.rage_affected_percentage),
  rageAffectedSessions: countOrZero(content?.rage_affected_sessions),
  rageDayOverDayPercentage: finiteOrNull(content?.rage_day_over_day_percentage),
  rageTodaySessionCount: countOrZero(content?.rage_today_session_count),
  rageYesterdaySessionCount: countOrZero(content?.rage_yesterday_session_count),
  totalRageClicks: countOrZero(content?.total_rage_clicks)
});

export const getSessionInsightSummary = () => request(api.get('insights/summary'))
  .then(normalizeSessionInsightSummary);

export const getSessionAiSummary = sessionId => (
  requireSessionId(sessionId) || request(api.get(aiSummaryPath(sessionId)))
);

export const createSessionAiSummary = (sessionId, context) => (
  requireSessionId(sessionId) || request(api.post(
    aiSummaryPath(sessionId),
    { context }
  ))
);

export const regenerateSessionAiSummary = (sessionId, context) => (
  requireSessionId(sessionId) || request(api.put(
    aiSummaryPath(sessionId),
    { context }
  ))
);

export const setSessionBookmark = (sessionId, bookmarked) => request(api.put(
  metadataPath(sessionId),
  { bookmarked }
));

export const listSessionNotes = sessionId => request(api.get(notesPath(sessionId)));

export const createSessionNote = (sessionId, moment) => request(api.post(
  notesPath(sessionId),
  momentBody(moment)
));

export const replaceSessionNote = (sessionId, noteId, text) => request(api.put(
  `${notesPath(sessionId)}/${noteId}`,
  noteBody(text)
));

export const deleteSessionNote = (sessionId, noteId) => request(api.delete(
  `${notesPath(sessionId)}/${noteId}`
));

export const listMentionsAndNotes = (filters = {}) => request(api.get(inboxPath, {
  params: mentionsAndNotesParams(filters)
}));

export const setMentionsAndNotesRead = (itemId, read) => request(api.put(
  `${inboxPath}/${itemId}/read`,
  { read: Boolean(read) }
));

export const setMentionsAndNotesFlagged = (itemId, flagged) => request(api.put(
  `${inboxPath}/${itemId}/flag`,
  { flagged: Boolean(flagged) }
));

export const reconcileMentionsAndNotes = () => request(api.post(
  `${inboxPath}/reconcile`
));

export const listNoteReplies = noteId => request(api.get(repliesPath(noteId)));

export const createNoteReply = (
  noteId,
  text,
  replyToId = null,
  originInboxItemId = null
) => request(api.post(repliesPath(noteId), {
  text,
  ...(replyToId ? { reply_to_id: replyToId } : {}),
  ...(originInboxItemId ? { origin_inbox_item_id: originInboxItemId } : {})
}));

export const replaceNoteReply = (noteId, replyId, text) => request(api.put(
  `${repliesPath(noteId)}/${replyId}`,
  noteBody(text)
));

export const deleteNoteReply = (noteId, replyId) => request(api.delete(
  `${repliesPath(noteId)}/${replyId}`
));

export const restoreNoteReply = (noteId, replyId) => request(api.post(
  `${repliesPath(noteId)}/${replyId}/restore`
));

export const listSessionReviews = (filters = {}) => request(api.get('reviews', {
  params: reviewListParams(filters)
}));

export const getSessionReview = sessionId => request(api.get(reviewPath(sessionId)));

export const createSessionReview = (sessionId, definition = {}) => request(api.post(
  'reviews',
  { session_id: sessionId, ...mutableReviewBody(definition) }
));

export const updateSessionReview = (sessionId, changes) => request(api.put(
  reviewPath(sessionId),
  mutableReviewBody(changes)
));

export const bulkUpdateSessionReviews = (sessionIds, changes) => {
  const uniqueSessionIds = [...new Set(sessionIds)];
  if (uniqueSessionIds.length < 1 || uniqueSessionIds.length > 100) {
    return Promise.reject(new Error('Review bulk updates require between 1 and 100 sessions.'));
  }
  const sanitizedChanges = mutableReviewBody(changes);
  if (Object.keys(sanitizedChanges).length === 0) {
    return Promise.reject(new Error('Review bulk updates require at least one change.'));
  }
  return request(api.put('reviews/bulk', {
    session_ids: uniqueSessionIds,
    changes: sanitizedChanges
  }));
};
