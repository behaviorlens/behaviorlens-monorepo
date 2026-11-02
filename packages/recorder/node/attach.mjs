// Records agent (persona) sessions from a Playwright browser context:
// init-script loader + bridge transport. Batches arrive here in Node and are
// forwarded to the same ingest endpoint human sessions use.
//
//   const recording = await attachRecorder(context, { apiUrl, projectKey, runId, taskId });
//   ... drive the page ...
//   await recording.stop(page);   // flushes, ends the session, waits for uploads
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_BUNDLE = fileURLToPath(new URL('../dist/bl-agent.js', import.meta.url));

const postJson = async (url, body, attempts = 4) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response.status;
      }
    } catch (error) {
      if (attempt >= attempts) throw error;
    }
    if (attempt >= attempts) return 0;
    await new Promise(resolve => { setTimeout(resolve, 250 * 2 ** attempt); });
  }
};

export const attachRecorder = async (context, {
  apiUrl,
  projectKey,
  runId,
  taskId,
  studyId,
  label,
  bundlePath = DEFAULT_BUNDLE
}) => {
  const base = String(apiUrl).replace(/\/$/, '');
  const bundle = await readFile(bundlePath, 'utf8');
  const sessionIds = new Set();
  // Event uploads and end calls are tracked apart: an end call waits for the
  // uploads, and stop() waits for both.
  const uploads = new Set();
  const endings = new Set();
  const track = (set, promise) => {
    set.add(promise);
    promise.finally(() => set.delete(promise)).catch(() => {});
    return promise;
  };
  const settle = async set => {
    while (set.size) {
      await Promise.allSettled([...set]);
    }
  };
  const drain = async () => {
    await settle(uploads);
    await settle(endings);
  };

  await context.exposeFunction('__blBridge', (kind, sessionId, batch) => {
    if (kind === 'events') {
      sessionIds.add(sessionId);
      return track(uploads, postJson(`${base}/ingest/v1/sessions/${sessionId}/events`, { ...batch, key: projectKey }));
    }
    if (kind === 'end') {
      return track(endings, settle(uploads).then(() => postJson(`${base}/ingest/v1/sessions/${sessionId}/end`, { key: projectKey })));
    }
    return undefined;
  });
  await context.addInitScript({
    content: `window.__BL_AGENT__ = ${JSON.stringify({ runId, taskId, studyId, label })};`
  });
  await context.addInitScript({ content: bundle });

  return {
    sessionIds: () => [...sessionIds],
    drain,
    // Sends what is buffered in the page without ending the session.
    async flush(page) {
      await page.evaluate(() => window.BehaviorLens?.flush?.()).catch(() => {});
      await drain();
    },
    // Ends the session: final flush, end call, and every upload finished.
    async stop(page) {
      await page.evaluate(() => window.BehaviorLens?.stop?.()).catch(() => {});
      await drain();
    }
  };
};
