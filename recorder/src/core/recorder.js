// The shared recorder core. Both loaders (snippet for humans, init script for
// agents) build on this, so every session has the same events whatever the
// transport: rrweb's stream plus one `bl.interaction` custom event per click,
// change and submit.
import { createBatcher } from './batcher';
import { describeElement } from './describe';
import { createSessionStore } from './session';

export const INTERACTION_TAG = 'bl.interaction';

// Recording defaults. Inputs are masked for humans and agents alike so the two
// kinds of session stay comparable; elements marked bl-block are not recorded.
export const RRWEB_OPTIONS = {
  maskAllInputs: true,
  maskInputOptions: { password: true },
  blockClass: 'bl-block',
  maskTextClass: 'bl-mask',
  recordCanvas: false,
  collectFonts: false,
  inlineStylesheet: true
};

const pageMeta = win => ({
  url: win.location.href,
  referrer: win.document.referrer || null,
  title: win.document.title || null,
  userAgent: win.navigator.userAgent,
  language: win.navigator.language,
  platform: win.navigator.platform,
  timezone: (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      return null;
    }
  })(),
  viewport: { width: win.innerWidth, height: win.innerHeight },
  screen: { width: win.screen?.width, height: win.screen?.height }
});

/**
 * @param {object} options
 * @param {Function} options.record   rrweb's record function (injected for tests)
 * @param {object} options.transport  { send(sessionId, batch, { final }), end(sessionId) }
 * @param {object} [options.meta]     session metadata: source, taskId, studyId, personaRunId, username
 */
export const createRecorder = ({
  record,
  transport,
  meta = {},
  win = window,
  sessionStore = createSessionStore(),
  batchOptions = {},
  rrwebOptions = {}
}) => {
  const extraMeta = { source: 'human', ...meta };
  let metaPending = true;
  // Page details as of the visit's start (landing page), sent with its first batch.
  let landingMeta = null;
  let stopRecording = null;
  let stopped = false;
  const cleanups = [];

  const onBatch = (events, { final }) => {
    const sessionId = sessionStore.current().id;
    const batch = { seq: sessionStore.nextSeq(), events };
    if (metaPending) {
      batch.meta = { ...(landingMeta || pageMeta(win)), ...extraMeta };
      landingMeta = null;
      metaPending = false;
    }
    transport.send(sessionId, batch, { final });
  };
  const batcher = createBatcher({ onBatch, ...batchOptions });

  const emit = event => {
    if (stopped) return;
    if (sessionStore.isIdle()) {
      // A long pause ended the old session: send what belongs to it, then
      // start the new one with a fresh snapshot.
      batcher.flush();
      sessionStore.rotate();
      landingMeta = pageMeta(win);
      metaPending = true;
      setTimeout(() => {
        try {
          record.takeFullSnapshot(true);
        } catch (error) { /* recording stopped */ }
      }, 0);
    }
    batcher.add(event);
    sessionStore.touch();
  };

  const recordInteraction = type => event => {
    const description = describeElement(event.target);
    if (!description) return;
    try {
      record.addCustomEvent(INTERACTION_TAG, { type, url: win.location.href, ...description });
    } catch (error) { /* recording not started yet */ }
  };

  const listen = (target, name, handler, options) => {
    target.addEventListener(name, handler, options);
    cleanups.push(() => target.removeEventListener(name, handler, options));
  };

  // Single-page apps change the URL without a page load, which rrweb does not
  // treat as a new page. A fresh snapshot per route makes each route its own
  // page view for Page Insights.
  const watchRoutes = () => {
    let lastHref = win.location.href;
    const onRouteChange = () => setTimeout(() => {
      if (stopped || win.location.href === lastHref) return;
      lastHref = win.location.href;
      try {
        record.takeFullSnapshot(true);
      } catch (error) { /* recording stopped */ }
    }, 50);
    ['pushState', 'replaceState'].forEach(method => {
      const original = win.history[method];
      win.history[method] = function patchedHistory(...args) {
        const result = original.apply(this, args);
        onRouteChange();
        return result;
      };
      cleanups.push(() => { win.history[method] = original; });
    });
    listen(win, 'popstate', onRouteChange);
  };

  return {
    start() {
      if (stopRecording || stopped) return;
      sessionStore.current();
      landingMeta = pageMeta(win);
      stopRecording = record({ ...RRWEB_OPTIONS, ...rrwebOptions, emit });
      listen(win.document, 'click', recordInteraction('click'), true);
      listen(win.document, 'change', recordInteraction('change'), true);
      listen(win.document, 'submit', recordInteraction('submit'), true);
      listen(win, 'pagehide', () => batcher.flush({ final: true }));
      listen(win.document, 'visibilitychange', () => {
        if (win.document.visibilityState === 'hidden') batcher.flush({ final: true });
      });
      watchRoutes();
      batcher.start();
    },
    identify(username) {
      extraMeta.username = username ? String(username).slice(0, 200) : undefined;
      metaPending = true;
    },
    setTask(taskId) {
      extraMeta.taskId = taskId ? String(taskId).slice(0, 64) : undefined;
      metaPending = true;
    },
    tag(name) {
      try {
        record.addCustomEvent('bl.tag', { name: String(name).slice(0, 100) });
      } catch (error) { /* recording not started yet */ }
    },
    flush() {
      batcher.flush();
    },
    stop() {
      if (stopped) return;
      batcher.flush({ final: true });
      stopped = true;
      batcher.stop();
      stopRecording?.();
      cleanups.splice(0).forEach(cleanup => cleanup());
      transport.end?.(sessionStore.current().id);
    },
    getSessionId: () => sessionStore.current().id
  };
};
