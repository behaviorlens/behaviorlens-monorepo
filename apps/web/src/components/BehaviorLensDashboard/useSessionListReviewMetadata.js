import {
  useCallback, useEffect, useRef, useState
} from 'react';
import { Notification } from '../../ui';
import {
  getSessionMetadata,
  getSessionReview,
  listReviewUsers,
  normalizeSessionTags,
  setSessionBookmark
} from '../../services/BehaviorLensService';
import {
  REVIEW_METADATA_NOTIFICATION_ID,
  getSessionReviewErrorMessage
} from './useSessionReviewMetadata';

const MAX_CONCURRENT_METADATA_REQUESTS = 4;
const MAX_CONCURRENT_REVIEW_REQUESTS = 4;
const metadataCache = new Map();
const reviewCache = new Map();
const metadataRequestQueue = [];
const reviewRequestQueue = [];
const metadataRequests = new Map();
const reviewRequests = new Map();
const metadataRowListeners = new Map();
const metadataUpdateGenerations = new Map();
let activeMetadataRequestCount = 0;
let activeReviewRequestCount = 0;
let metadataRowObserver = null;
let reviewUsersPromise = null;

const getMetadataGeneration = sessionId => metadataUpdateGenerations.get(sessionId) || 0;

const bumpMetadataGeneration = sessionId => {
  const next = getMetadataGeneration(sessionId) + 1;
  metadataUpdateGenerations.set(sessionId, next);
  return next;
};

const normalizeMetadata = response => ({
  bookmarked: response?.bookmarked === true,
  tags: normalizeSessionTags(response?.tags)
});

const getReviewErrorStatus = error => Number(
  error?.response?.data?.responseCode || error?.response?.status || error?.status || 0
);

const loadReviewUsers = () => {
  if (!reviewUsersPromise) {
    reviewUsersPromise = listReviewUsers().catch(() => []);
  }
  return reviewUsersPromise;
};

const normalizeReview = async response => {
  const users = await loadReviewUsers();
  const reviewer = response?.reviewer || null;
  const selectedUser = users.find(user => user.username === reviewer);
  return {
    review_status: response?.review_status || 'unreviewed',
    reviewer,
    reviewer_avatar: selectedUser?.avatar || null,
    reviewer_name: selectedUser?.name || reviewer
  };
};

const runNextMetadataRequest = () => {
  if (activeMetadataRequestCount >= MAX_CONCURRENT_METADATA_REQUESTS) {
    return;
  }

  const task = metadataRequestQueue.shift();
  if (!task) {
    return;
  }
  activeMetadataRequestCount += 1;
  getSessionMetadata(task.sessionId)
    .then(normalizeMetadata)
    .then(metadata => {
      if (getMetadataGeneration(task.sessionId) !== task.generation) {
        task.resolve(metadataCache.get(task.sessionId) || metadata);
        return;
      }
      metadataCache.set(task.sessionId, metadata);
      task.resolve(metadata);
    }, task.reject)
    .finally(() => {
      metadataRequests.delete(task.sessionId);
      activeMetadataRequestCount -= 1;
      runNextMetadataRequest();
    });

  runNextMetadataRequest();
};

const enqueueMetadataRequest = sessionId => {
  const activeRequest = metadataRequests.get(sessionId);
  if (activeRequest) {
    return activeRequest;
  }

  const task = {
    generation: getMetadataGeneration(sessionId),
    reject: null,
    resolve: null,
    sessionId
  };
  const promise = new Promise((resolve, reject) => {
    task.resolve = resolve;
    task.reject = reject;
  });

  metadataRequestQueue.push(task);
  metadataRequests.set(sessionId, promise);
  runNextMetadataRequest();
  return promise;
};

const runNextReviewRequest = () => {
  if (activeReviewRequestCount >= MAX_CONCURRENT_REVIEW_REQUESTS) {
    return;
  }
  const task = reviewRequestQueue.shift();
  if (!task) {
    return;
  }
  activeReviewRequestCount += 1;
  getSessionReview(task.sessionId)
    .then(normalizeReview)
    .catch(error => {
      if (getReviewErrorStatus(error) === 404) {
        return {
          review_status: 'unreviewed', reviewer: null, reviewer_avatar: null, reviewer_name: null
        };
      }
      throw error;
    })
    .then(review => {
      reviewCache.set(task.sessionId, review);
      task.resolve(review);
    }, task.reject)
    .finally(() => {
      reviewRequests.delete(task.sessionId);
      activeReviewRequestCount -= 1;
      runNextReviewRequest();
    });
  runNextReviewRequest();
};

const enqueueReviewRequest = (sessionId, revalidate = false) => {
  if (!revalidate && reviewCache.has(sessionId)) {
    return Promise.resolve(reviewCache.get(sessionId));
  }
  const activeRequest = reviewRequests.get(sessionId);
  if (activeRequest) {
    return activeRequest;
  }
  const task = { reject: null, resolve: null, sessionId };
  const promise = new Promise((resolve, reject) => {
    task.resolve = resolve;
    task.reject = reject;
  });
  reviewRequestQueue.push(task);
  reviewRequests.set(sessionId, promise);
  runNextReviewRequest();
  return promise;
};

export const loadSessionListReviewMetadata = (sessionIds, { revalidate = false } = {}) => {
  const uniqueSessionIds = [...new Set(sessionIds.filter(Boolean))];
  const metadataBySessionId = new Map();
  const failedSessionIds = [];

  return new Promise(resolve => {
    if (!uniqueSessionIds.length) {
      resolve({ failedSessionIds, metadataBySessionId });
      return;
    }

    let settledCount = 0;
    const settle = () => {
      settledCount += 1;
      if (settledCount === uniqueSessionIds.length) {
        resolve({ failedSessionIds, metadataBySessionId });
      }
    };

    uniqueSessionIds.forEach(sessionId => {
      const cachedMetadata = revalidate ? null : metadataCache.get(sessionId);
      if (cachedMetadata) {
        metadataBySessionId.set(sessionId, cachedMetadata);
        settle();
        return;
      }

      enqueueMetadataRequest(sessionId).then(metadata => {
        metadataBySessionId.set(sessionId, metadata);
      }).catch(() => {
        failedSessionIds.push(sessionId);
      }).finally(settle);
    });
  });
};

const observeMetadataRow = (node, onVisibilityChange) => {
  if (typeof IntersectionObserver === 'undefined') {
    onVisibilityChange(true);
    return () => {};
  }

  if (!metadataRowObserver) {
    metadataRowObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        metadataRowListeners.get(entry.target)?.(entry.isIntersecting === true);
      });
    }, { rootMargin: '120px 0px' });
  }

  metadataRowListeners.set(node, onVisibilityChange);
  metadataRowObserver.observe(node);
  return () => {
    metadataRowObserver?.unobserve(node);
    metadataRowListeners.delete(node);
    if (metadataRowListeners.size === 0) {
      metadataRowObserver?.disconnect();
      metadataRowObserver = null;
    }
  };
};

const getInitialState = sessionId => {
  const metadata = metadataCache.get(sessionId) || null;
  return {
    metadata,
    review: null,
    reviewStatus: 'idle',
    status: metadata ? 'ready' : 'idle'
  };
};

export const clearSessionListReviewMetadataCache = () => {
  metadataCache.clear();
  reviewCache.clear();
  metadataUpdateGenerations.clear();
  reviewUsersPromise = null;
};

const showBookmarkError = message => Notification.show({
  description: message,
  colorStyle: 'error',
  containerId: REVIEW_METADATA_NOTIFICATION_ID
});

const useSessionListReviewMetadata = (sessionId, revalidate = true, onMetadataChange) => {
  const [observedNode, setObservedNode] = useState(null);
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState(() => getInitialState(sessionId));
  const [bookmarkPending, setBookmarkPending] = useState(false);
  const requestedSessionRef = useRef('');
  const requestedReviewSessionRef = useRef('');
  const bookmarkRequestRef = useRef(0);
  const bookmarkPendingRef = useRef(false);
  const metadataRef = useRef(null);
  const observeRef = useCallback(node => setObservedNode(node), []);
  metadataRef.current = result.metadata;

  useEffect(() => {
    requestedSessionRef.current = '';
    requestedReviewSessionRef.current = '';
    bookmarkRequestRef.current += 1;
    bookmarkPendingRef.current = false;
    setBookmarkPending(false);
    setResult(getInitialState(sessionId));
  }, [sessionId]);

  useEffect(() => {
    if (!observedNode) {
      return undefined;
    }
    return observeMetadataRow(observedNode, setVisible);
  }, [observedNode]);

  useEffect(() => {
    if (!visible || requestedSessionRef.current === sessionId || (!revalidate && result.metadata)) {
      return undefined;
    }

    requestedSessionRef.current = sessionId;
    const request = enqueueMetadataRequest(sessionId);
    let current = true;
    setResult(previous => ({
      metadata: previous.metadata,
      review: previous.review,
      reviewStatus: previous.reviewStatus,
      status: previous.metadata ? 'ready' : 'loading'
    }));

    request.then(metadata => {
      if (current && metadata) {
        setResult(previous => ({ ...previous, metadata, status: 'ready' }));
      }
    }).catch(() => {
      if (current) {
        setResult(previous => ({
          metadata: previous.metadata,
          review: previous.review,
          reviewStatus: previous.reviewStatus,
          status: 'unavailable'
        }));
      }
    });

    return () => {
      current = false;
    };
  }, [revalidate, result.metadata, sessionId, visible]);

  useEffect(() => {
    if (result.status === 'ready' && result.metadata) {
      onMetadataChange?.(sessionId, result.metadata);
    }
  }, [onMetadataChange, result.metadata, result.status, sessionId]);

  useEffect(() => {
    if (!visible || requestedReviewSessionRef.current === sessionId) {
      return undefined;
    }
    requestedReviewSessionRef.current = sessionId;
    let current = true;
    setResult(previous => ({ ...previous, reviewStatus: 'loading' }));
    enqueueReviewRequest(sessionId, true).then(review => {
      if (current) {
        setResult(previous => ({ ...previous, review, reviewStatus: 'ready' }));
      }
    }).catch(() => {
      if (current) {
        setResult(previous => ({ ...previous, reviewStatus: 'unavailable' }));
      }
    });
    return () => {
      current = false;
    };
  }, [sessionId, visible]);

  const toggleBookmark = useCallback(async () => {
    const metadata = metadataRef.current;
    if (bookmarkPendingRef.current || !metadata) {
      return;
    }

    const requestId = bookmarkRequestRef.current + 1;
    bookmarkRequestRef.current = requestId;
    bookmarkPendingRef.current = true;
    const previousBookmarked = metadata.bookmarked === true;
    const desiredBookmarked = !previousBookmarked;
    const optimisticMetadata = { ...metadata, bookmarked: desiredBookmarked };
    bumpMetadataGeneration(sessionId);
    metadataCache.set(sessionId, optimisticMetadata);
    setResult(previous => ({ ...previous, metadata: optimisticMetadata }));
    setBookmarkPending(true);

    try {
      const response = await setSessionBookmark(sessionId, desiredBookmarked);
      if (bookmarkRequestRef.current !== requestId) {
        return;
      }

      const confirmedMetadata = {
        ...optimisticMetadata,
        bookmarked: response?.bookmarked === true
      };
      metadataCache.set(sessionId, confirmedMetadata);
      setResult(previous => ({ ...previous, metadata: confirmedMetadata }));
    } catch (error) {
      if (bookmarkRequestRef.current !== requestId) {
        return;
      }

      const revertedMetadata = { ...metadata, bookmarked: previousBookmarked };
      bumpMetadataGeneration(sessionId);
      metadataCache.set(sessionId, revertedMetadata);
      setResult(previous => ({ ...previous, metadata: revertedMetadata }));
      showBookmarkError(getSessionReviewErrorMessage(error, 'The bookmark could not be updated.'));
    } finally {
      if (bookmarkRequestRef.current === requestId) {
        bookmarkPendingRef.current = false;
        setBookmarkPending(false);
      }
    }
  }, [sessionId]);

  return {
    ...result, bookmarkPending, observeRef, toggleBookmark
  };
};

export default useSessionListReviewMetadata;
