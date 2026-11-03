// Snippet loader for human visitors:
//
//   <script async src="https://<api>/recorder/bl.js"
//     data-project-key="pk_..." data-api="https://<api>"></script>
//
// Starts recording as soon as it loads. Exposes window.BehaviorLens:
// identify(name), setTask(id), tag(name), stop(), getSessionId().
import { record } from 'rrweb';
import { createRecorder } from '../core/recorder';
import { createHttpTransport } from '../transports/http';

(() => {
  if (window.top !== window || window.location.protocol === 'about:' || window.BehaviorLens?.version) {
    return;
  }
  const script = document.currentScript;
  const data = script?.dataset || {};
  const key = data.projectKey;
  if (!key) {
    console.warn('[BehaviorLens] data-project-key is missing; not recording.');
    return;
  }
  const api = data.api || new URL(script.src).origin;
  const recorder = createRecorder({
    record,
    transport: createHttpTransport({
      api,
      key,
      onLimitReached: () => console.warn('[BehaviorLens] session storage limit reached; recording paused.')
    }),
    meta: { source: 'human' }
  });

  window.BehaviorLens = {
    version: '0.1.0',
    identify: username => recorder.identify(username),
    setTask: taskId => recorder.setTask(taskId),
    tag: name => recorder.tag(name),
    stop: () => recorder.stop(),
    getSessionId: () => recorder.getSessionId() || null
  };

  recorder.start();
  window.dispatchEvent(new CustomEvent('behaviorlens:ready'));
})();
