import {
  useCallback, useEffect, useRef, useState
} from 'react';
import {
  createSessionAiSummary,
  getSessionAiSummary,
  regenerateSessionAiSummary
} from '../../services/BehaviorLensService';
import { buildBehaviorLensSemanticContext } from './behaviorLensSemanticContext';

export const AI_SUMMARY_ERROR_MESSAGE = 'AI summary could not be generated. Try again.';
export const AI_SUMMARY_TOO_LARGE_MESSAGE = 'This session contains too many interactions to summarize.';
export const AI_SUMMARY_AUTH_MESSAGE = 'Your session expired. Refresh the page and try again.';
export const AI_SUMMARY_PROVIDER_MESSAGE = 'The AI service is temporarily unavailable. Try again.';

const internPayload = error => error?.response?.data || error?.data || error;

const hasStatus = (error, status) => {
  const payload = internPayload(error);
  return payload?.responseCode === status
    || error?.response?.status === status
    || error?.status === status;
};

const isNotFound = error => hasStatus(error, 404);
const isAlreadyExists = error => hasStatus(error, 409);

// The AI Summary rail is conditionally mounted. Keep an active generation job
// outside that disposable view so switching tabs does not lose its progress or
// briefly offer a second Generate action for the same session.
const generationJobs = new Map();

export const getAiSummaryErrorMessage = error => {
  const payload = internPayload(error);
  const detail = payload?.content?.error || payload?.message || '';
  if (hasStatus(error, 400)
    && /must not exceed|timeline has an invalid item count/iu.test(detail)) {
    return AI_SUMMARY_TOO_LARGE_MESSAGE;
  }
  if (hasStatus(error, 401)) return AI_SUMMARY_AUTH_MESSAGE;
  if (hasStatus(error, 502)) return AI_SUMMARY_PROVIDER_MESSAGE;
  return AI_SUMMARY_ERROR_MESSAGE;
};

const useSessionAiSummary = ({ enabled = true, payload, sessionId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setSummary(null);
    setError(null);
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    const activeJob = generationJobs.get(sessionId);
    if (activeJob) {
      setSummary(activeJob.previousSummary);
      setLoading(false);
      setGenerating(!activeJob.replace);
      setRegenerating(activeJob.replace);
      activeJob.promise.then(value => {
        if (requestId === requestIdRef.current) setSummary(value);
      }).catch(generationError => {
        if (requestId === requestIdRef.current) {
          setError(getAiSummaryErrorMessage(generationError));
        }
      }).finally(() => {
        if (requestId === requestIdRef.current) {
          setGenerating(false);
          setRegenerating(false);
          if (generationJobs.get(sessionId) === activeJob) {
            generationJobs.delete(sessionId);
          }
        }
      });
      return () => { requestIdRef.current += 1; };
    }

    setGenerating(false);
    setRegenerating(false);
    setLoading(true);
    getSessionAiSummary(sessionId).then(value => {
      if (requestId === requestIdRef.current) setSummary(value);
    }).catch(fetchError => {
      if (requestId === requestIdRef.current && !isNotFound(fetchError)) {
        setError(AI_SUMMARY_ERROR_MESSAGE);
      }
    }).finally(() => {
      if (requestId === requestIdRef.current) setLoading(false);
    });
    return () => { requestIdRef.current += 1; };
  }, [enabled, sessionId]);

  const runGeneration = useCallback(async replace => {
    if (!payload || generating || regenerating) return null;
    const activeJob = generationJobs.get(sessionId);
    if (activeJob) return activeJob.promise.catch(() => null);
    const requestId = ++requestIdRef.current;
    setError(null);
    (replace ? setRegenerating : setGenerating)(true);
    const generationPromise = (async () => {
      const context = buildBehaviorLensSemanticContext(payload);
      try {
        return await (replace
          ? regenerateSessionAiSummary(sessionId, context)
          : createSessionAiSummary(sessionId, context));
      } catch (generationError) {
        if (isAlreadyExists(generationError)) {
          // The row was stored meanwhile; serve it instead of paying for another generation.
          const stored = await getSessionAiSummary(sessionId).catch(() => null);
          if (stored) return stored;
        }
        throw generationError;
      }
    })();
    const job = {
      previousSummary: summary,
      promise: generationPromise,
      replace
    };
    generationJobs.set(sessionId, job);
    try {
      const value = await generationPromise;
      if (requestId === requestIdRef.current) setSummary(value);
      return value;
    } catch (generationError) {
      if (requestId === requestIdRef.current) setError(getAiSummaryErrorMessage(generationError));
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setGenerating(false);
        setRegenerating(false);
        if (generationJobs.get(sessionId) === job) {
          generationJobs.delete(sessionId);
        }
      }
    }
  }, [generating, payload, regenerating, sessionId, summary]);

  return {
    error,
    generate: useCallback(() => runGeneration(false), [runGeneration]),
    generating,
    loading,
    regenerate: useCallback(() => runGeneration(true), [runGeneration]),
    regenerating,
    summary
  };
};

export default useSessionAiSummary;
