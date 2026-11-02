import { useEffect, useRef } from 'react';
import { getSessionReview, updateSessionReview } from '../../services/BehaviorLensService';

const normalizeReviewerUsername = value => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
);

export const completeAssignedSessionReview = async ({ currentReviewerUsername, sessionId }) => {
  const reviewerUsername = normalizeReviewerUsername(currentReviewerUsername);
  if (!reviewerUsername || !sessionId) {
    return false;
  }

  try {
    const record = await getSessionReview(sessionId);
    if (
      record?.review_status !== 'in_review'
      || normalizeReviewerUsername(record?.reviewer) !== reviewerUsername
    ) {
      return false;
    }

    await updateSessionReview(sessionId, { review_status: 'resolved' });
    return true;
  } catch (error) {
    // Leaving the replay must not block navigation when Intern is unavailable.
    return false;
  }
};

const useAssignedReviewerReviewCompletion = ({
  currentReviewerUsername, enabled, sessionId
}) => {
  const pendingCompletionRef = useRef(null);

  useEffect(() => {
    const previousPending = pendingCompletionRef.current;
    if (previousPending?.sessionId === sessionId) {
      previousPending.cancelled = true;
    }

    if (!enabled || !normalizeReviewerUsername(currentReviewerUsername) || !sessionId) {
      return undefined;
    }

    return () => {
      const pendingCompletion = { cancelled: false, sessionId };
      pendingCompletionRef.current = pendingCompletion;

      Promise.resolve().then(() => {
        if (!pendingCompletion.cancelled) {
          completeAssignedSessionReview({ currentReviewerUsername, sessionId });
        }
      });
    };
  }, [currentReviewerUsername, enabled, sessionId]);
};

export default useAssignedReviewerReviewCompletion;
