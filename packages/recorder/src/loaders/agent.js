// Init-script loader for agent (persona) sessions. The runner registers two
// Playwright init scripts: first `window.__BL_AGENT__ = { ... }`, then this
// bundle. Events travel over the bridge transport to the runner process.
import { record } from 'rrweb';
import { createRecorder } from '../core/recorder';
import { createBridgeTransport } from '../transports/bridge';

(() => {
  if (window.top !== window || window.location.protocol === 'about:' || window.BehaviorLens?.version) {
    return;
  }
  const config = window.__BL_AGENT__ || {};
  const recorder = createRecorder({
    record,
    transport: createBridgeTransport(),
    meta: {
      source: 'persona',
      personaRunId: config.runId || undefined,
      taskId: config.taskId || undefined,
      studyId: config.studyId || undefined,
      username: config.label || undefined
    }
  });
  window.BehaviorLens = {
    version: '0.1.0',
    flush: () => recorder.flush(),
    stop: () => recorder.stop(),
    getSessionId: () => recorder.getSessionId()
  };
  recorder.start();
})();
