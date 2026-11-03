import { buildSemanticTimeline } from './behaviorLensSemanticEvents';
import { sanitizeProductArea, sanitizeRecordingStatus } from '../shared/behaviorLensSemanticSafety';

export const SEMANTIC_CONTEXT_VERSION = 'ai-session-context-v1';

export const buildBehaviorLensSemanticContext = replay => {
  const events = Array.isArray(replay?.events) ? replay.events : [];
  const timestamps = events.map(event => Number(event?.timestamp)).filter(Number.isFinite);
  const durationMs = timestamps.length > 1
    ? Math.max(0, Math.max(...timestamps) - timestamps[0])
    : 0;
  const session = {
    durationMs,
    recordingStatus: sanitizeRecordingStatus(replay?.meta?.status)
  };
  const productArea = sanitizeProductArea(replay?.meta?.browser_info?.source);
  if (productArea) session.productArea = productArea;

  return {
    contextVersion: SEMANTIC_CONTEXT_VERSION,
    session,
    timeline: buildSemanticTimeline(events)
  };
};

export const serializeBehaviorLensSemanticContext = replay => (
  JSON.stringify(buildBehaviorLensSemanticContext(replay))
);
