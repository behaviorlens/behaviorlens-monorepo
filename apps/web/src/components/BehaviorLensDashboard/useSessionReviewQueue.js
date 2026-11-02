import {
  useCallback, useEffect, useRef, useState
} from 'react';
import { Notification } from '../../ui';
import { createSessionReview, getSessionReview, updateSessionReview } from '../../services/BehaviorLensService';
import {
  getReviewQueueErrorMessage,
  getReviewQueueErrorStatus,
  REVIEW_QUEUE_NOTIFICATION_ID
} from './behaviorLensReviewQueue';

const useSessionReviewQueue = ({ currentUsername, sessionId }) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [saving, setSaving] = useState(false);
  const requestRef = useRef(0);
  const recordRef = useRef(null);
  const updateRequestRefs = useRef(new Map());
  const pendingUpdateTokens = useRef(new Set());

  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  const update = useCallback(async changes => {
    const lane = Object.keys(changes).sort().join(',') || 'update';
    const mutationId = (updateRequestRefs.current.get(lane) || 0) + 1;
    const sessionRequestId = requestRef.current;
    const token = `${lane}:${mutationId}`;
    const currentRecord = recordRef.current;
    const previousChanges = Object.fromEntries(Object.keys(changes).map(field => [
      field,
      currentRecord?.[field]
    ]));
    updateRequestRefs.current.set(lane, mutationId);
    pendingUpdateTokens.current.add(token);
    setSaving(true);
    setMutationError('');
    const optimisticRecord = currentRecord ? { ...currentRecord, ...changes } : currentRecord;
    recordRef.current = optimisticRecord;
    setRecord(optimisticRecord);
    try {
      const response = await updateSessionReview(sessionId, changes);
      if (
        requestRef.current !== sessionRequestId
        || updateRequestRefs.current.get(lane) !== mutationId
      ) {
        return null;
      }
      recordRef.current = response;
      setRecord(response);
      return response;
    } catch (requestError) {
      if (
        requestRef.current !== sessionRequestId
        || updateRequestRefs.current.get(lane) !== mutationId
      ) {
        return null;
      }
      if (getReviewQueueErrorStatus(requestError) === 404) {
        recordRef.current = null;
        setRecord(null);
      } else {
        const rolledBackRecord = recordRef.current
          ? { ...recordRef.current, ...previousChanges }
          : recordRef.current;
        recordRef.current = rolledBackRecord;
        setRecord(rolledBackRecord);
        setMutationError(getReviewQueueErrorMessage(
          requestError,
          'The review record could not be updated.'
        ));
      }
      return null;
    } finally {
      pendingUpdateTokens.current.delete(token);
      setSaving(pendingUpdateTokens.current.size > 0);
    }
  }, [sessionId]);

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError('');
    try {
      let response;
      let creating = false;
      try {
        response = await getSessionReview(sessionId);
      } catch (requestError) {
        if (getReviewQueueErrorStatus(requestError) !== 404 || !currentUsername) {
          throw requestError;
        }
        creating = true;
        try {
          response = await createSessionReview(sessionId, {
            review_status: 'in_review',
            priority: 'medium'
          });
        } catch (createError) {
          if (getReviewQueueErrorStatus(createError) !== 409) {
            throw createError;
          }
          response = await getSessionReview(sessionId);
        }
      }
      if (response?.review_status === 'unreviewed') {
        if (requestRef.current === requestId) {
          recordRef.current = response;
          setRecord(response);
        }
        const migratedResponse = await update({ review_status: 'in_review' });
        if (!migratedResponse) {
          return;
        }
        response = migratedResponse;
      }
      if (requestRef.current === requestId) {
        recordRef.current = response;
        setRecord(response);
        if (creating) {
          Notification.show({
            description: 'Session added to Review.',
            colorStyle: 'success',
            containerId: REVIEW_QUEUE_NOTIFICATION_ID
          });
        }
      }
    } catch (requestError) {
      if (requestRef.current !== requestId) {
        return;
      }
      if (getReviewQueueErrorStatus(requestError) === 404 && !currentUsername) {
        recordRef.current = null;
        setRecord(null);
      } else {
        setError(getReviewQueueErrorMessage(
          requestError,
          'This session could not be added to Review.'
        ));
      }
    } finally {
      if (requestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [currentUsername, sessionId, update]);

  useEffect(() => {
    setRecord(null);
    setMutationError('');
    setSaving(false);
    load();
    return () => {
      requestRef.current += 1;
      updateRequestRefs.current.clear();
      pendingUpdateTokens.current.clear();
    };
  }, [load]);

  return {
    error,
    load,
    loading,
    mutationError,
    record,
    saving,
    update
  };
};

export default useSessionReviewQueue;
