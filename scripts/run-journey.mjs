// Runs one scripted journey on the demo shop and records it, either the human
// way (snippet loader + HTTP transport) or the agent
// way (init-script loader + bridge transport via attachRecorder).
import { attachRecorder } from '@behaviorlens/recorder/node';
import { VISITORS } from './journeys.mjs';

export const DEFAULTS = {
  site: process.env.BL_SITE_URL || 'http://localhost:5174',
  api: process.env.BL_API_URL || 'http://localhost:8000',
  key: process.env.BL_PROJECT_KEY || 'pk_demo_shop_local'
};

const VIEWPORT = { width: 1280, height: 800 };

const settle = ms => new Promise(resolve => { setTimeout(resolve, ms); });

export const recordHumanVisit = async (browser, journey, { site = DEFAULTS.site, visitor } = {}) => {
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
  const page = await context.newPage();
  try {
    await page.goto(`${site}${journey.path}`, { referer: journey.referrer || undefined });
    // The snippet loads asynchronously and starts recording as soon as it runs.
    await page.waitForFunction(() => window.BehaviorLens?.getSessionId(), null, { timeout: 15000 });
    const name = visitor ?? VISITORS[journey.user];
    if (name) {
      await page.evaluate(value => window.BehaviorLens.identify(value), name);
    }
    await settle(800);
    await journey.run(page);
    await settle(500);
    const sessionId = await page.evaluate(() => window.BehaviorLens.getSessionId());
    // Final flush + end call (keepalive requests), then let them leave.
    await page.evaluate(() => window.BehaviorLens.stop());
    await page.waitForLoadState('networkidle').catch(() => {});
    await settle(1000);
    return { sessionId, source: 'human' };
  } finally {
    await context.close();
  }
};

export const recordAgentVisit = async (browser, journey, {
  site = DEFAULTS.site, api = DEFAULTS.api, key = DEFAULTS.key, runId, taskId, label
} = {}) => {
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
  const recording = await attachRecorder(context, {
    apiUrl: api, projectKey: key, runId, taskId, label
  });
  const page = await context.newPage();
  try {
    await page.goto(`${site}${journey.path}`, { referer: journey.referrer || undefined });
    await settle(800);
    await journey.run(page);
    await settle(500);
    await recording.stop(page);
    const [sessionId] = recording.sessionIds();
    return { sessionId, source: 'persona' };
  } finally {
    await context.close();
  }
};

// Waits until the API lists the session (optionally in a given processing state).
export const waitForSession = async (sessionId, {
  api = DEFAULTS.api, project = 'demo-shop', state = 'ready', timeoutMs = 60000
} = {}) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${api}/api/v1/projects/${project}/sessions?q=${sessionId}&limit=1`);
    if (response.ok) {
      const { sessions } = await response.json();
      const row = sessions.find(item => item.id === sessionId);
      if (row && (!state || row.processing_state === state)) {
        return row;
      }
    }
    await settle(500);
  }
  throw new Error(`Session ${sessionId} did not reach "${state}" within ${timeoutMs} ms`);
};
