import { BEHAVIORLENS_REVIEW_STATUSES } from '../../services/BehaviorLensService';

export const REVIEW_STATUS_LABELS = {
  in_review: 'In review',
  resolved: 'Reviewed',
  unreviewed: 'Unreviewed'
};

export const REVIEW_QUEUE_NOTIFICATION_ID = 'behaviorlens-review-queue-notification';

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

export const isTerminalSessionReview = record => (
  record?.review_status === 'resolved'
);

export const isSupportedSessionReviewStatus = status => (
  BEHAVIORLENS_REVIEW_STATUSES.includes(status)
);

export const getSessionReviewStatusLabel = status => (
  REVIEW_STATUS_LABELS[status] || 'Unknown status'
);

export const mergeSessionReviewUpdate = (current, updated, changes) => {
  if (!current || !updated) {
    return updated || current;
  }
  const merged = { ...current };
  [...Object.keys(changes), 'updated_by', 'updated_at'].forEach(field => {
    if (Object.prototype.hasOwnProperty.call(updated, field)) {
      merged[field] = updated[field];
    }
  });
  return merged;
};

export const formatReviewQueueDate = timestamp => {
  if (typeof timestamp !== 'string') {
    return '';
  }
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('en-US');
};

export const getReviewQueueErrorStatus = error => {
  const response = error?.response || error;
  return Number(response?.data?.responseCode || response?.status || 0);
};

export const getReviewQueueErrorMessage = (error, fallback) => {
  const status = getReviewQueueErrorStatus(error);
  if (status === 401) {
    return 'Authentication is required to use Review.';
  }
  if (status === 404) {
    return 'One or more review records no longer exist.';
  }
  if (status === 400) {
    return 'The Review request contains an invalid value.';
  }
  return fallback;
};
