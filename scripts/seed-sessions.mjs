// Records the scripted journeys against the running stack (docker compose up),
// through the real recorder and ingest API: every journey once as a human
// visitor, and the first three again as agent (persona) runs.
//
// Usage: npm run seed:sessions
// Env:   BL_SITE_URL, BL_API_URL, BL_PROJECT_KEY (defaults: local compose stack)
import { chromium } from 'playwright';
import { JOURNEYS } from './journeys.mjs';
import {
  DEFAULTS, recordAgentVisit, recordHumanVisit, waitForSession
} from './run-journey.mjs';

const check = async (url, what) => {
  try {
    const response = await fetch(url);
    if (response.ok) return;
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(`${what} is not reachable at ${url} (${error.message}). Start the stack with: docker compose up`);
  }
};

const main = async () => {
  await check(`${DEFAULTS.api}/health`, 'The API');
  await check(`${DEFAULTS.api}/recorder/bl.js`, 'The recorder bundle');
  await check(DEFAULTS.site, 'The demo shop');

  const browser = await chromium.launch();
  const recorded = [];
  try {
    for (const [index, journey] of JOURNEYS.entries()) {
      const result = await recordHumanVisit(browser, journey);
      recorded.push(result);
      console.log(`human  ${String(index + 1).padStart(2)}  ${result.sessionId}  ${journey.path}`);
    }
    for (const [index, journey] of JOURNEYS.slice(0, 3).entries()) {
      const result = await recordAgentVisit(browser, journey, {
        runId: `seed-run-${index + 1}`,
        label: `Persona run ${index + 1}`
      });
      recorded.push(result);
      console.log(`agent  ${String(index + 1).padStart(2)}  ${result.sessionId}  ${journey.path}`);
    }
  } finally {
    await browser.close();
  }

  for (const { sessionId } of recorded) {
    await waitForSession(sessionId);
  }
  console.log(`Recorded ${recorded.length} sessions; all processed. Open http://localhost:5173/app`);
};

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
