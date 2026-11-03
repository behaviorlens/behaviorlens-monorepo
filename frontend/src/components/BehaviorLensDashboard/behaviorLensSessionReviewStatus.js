import { listSessionReviews } from '../../services/BehaviorLensService';

export const REVIEW_STATUS_LIST_PAGE_SIZE = 100;

// Review records live on Intern, not on the playlist payload. Sessions without
// a record are treated as Unreviewed by the Filters popup.
export const loadSessionListReviewStatuses = async (
  listSessionReviewsFn = listSessionReviews
) => {
  const reviewStatusBySessionId = new Map();
  const reviewerBySessionId = new Map();
  const priorityBySessionId = new Map();
  const failedSessionIds = [];
  let offset = 0;
  let total = null;

  try {
    while (total === null || offset < total) {
      // Keep pages sequential so a later failure retains only earlier page side effects.
      // eslint-disable-next-line no-await-in-loop
      const page = await listSessionReviewsFn({
        limit: REVIEW_STATUS_LIST_PAGE_SIZE,
        offset
      });
      const items = Array.isArray(page?.items) ? page.items : [];
      const reportedTotal = Number(page?.total);
      if (total === null) {
        total = Number.isFinite(reportedTotal) ? reportedTotal : offset + items.length;
      }

      items.forEach(item => {
        if (item?.session_id) {
          reviewStatusBySessionId.set(item.session_id, item.review_status || 'unreviewed');
          if (item.reviewer) {
            reviewerBySessionId.set(item.session_id, item.reviewer);
          }
          if (item.priority) {
            priorityBySessionId.set(item.session_id, item.priority);
          }
        }
      });

      if (items.length === 0) {
        break;
      }

      offset += items.length;
      if (items.length < REVIEW_STATUS_LIST_PAGE_SIZE) {
        break;
      }
    }
  } catch {
    failedSessionIds.push('review-status');
  }

  return {
    failedSessionIds,
    priorityBySessionId,
    reviewerBySessionId,
    reviewStatusBySessionId
  };
};
