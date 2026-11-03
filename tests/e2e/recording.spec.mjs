import { chromium, expect, test } from '@playwright/test';
import { fillCheckout, JOURNEYS } from '../../scripts/journeys.mjs';
import { recordAgentVisit, recordHumanVisit, waitForSession } from '../../scripts/run-journey.mjs';
import {
  fetchReplay, recordedText, recordingShape, watchConsoleErrors
} from './helpers.mjs';

let browser;

test.beforeAll(async () => {
  browser = await chromium.launch();
});

test.afterAll(async () => {
  await browser.close();
});

test('a human visit is recorded, listed and replayed in the dashboard', async ({ page }) => {
  const { sessionId } = await recordHumanVisit(browser, JOURNEYS[0]);
  const row = await waitForSession(sessionId);
  expect(row.source).toBe('human');
  expect(row.url).toBe('http://localhost:5174/');
  expect(row.status).toBe('completed');

  const errors = watchConsoleErrors(page);
  await page.goto('/app');
  await expect(page.locator(`a[href^="/app/${sessionId}"]`).first()).toBeVisible({ timeout: 15000 });

  await page.goto(`/app/${sessionId}`);
  const frame = page.frameLocator('.behaviorlens-workspace-stage iframe').first();
  await expect(frame.locator('body')).toContainText('Harbor & Pine', { timeout: 15000 });
  // The Activity Log lists the recorded clicks by element ("Clicked “add-to-cart”").
  await expect(page.getByText(/Clicked .add-to-cart./).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('an agent run arrives through the bridge as a persona session', async () => {
  const { sessionId } = await recordAgentVisit(browser, JOURNEYS[7], { runId: 'e2e-run', label: 'E2E persona' });
  const row = await waitForSession(sessionId);
  expect(row.source).toBe('persona');
  expect(row.persona_run_id).toBe('e2e-run');
  expect(row.username).toBe('E2E persona');
  const replay = JSON.parse(await fetchReplay(sessionId));
  expect(replay.events.some(event => event.type === 2)).toBe(true);
});

test('human and agent recordings of the same journey have the same shape', async () => {
  const journey = JOURNEYS[2];
  const human = await recordHumanVisit(browser, journey);
  const agent = await recordAgentVisit(browser, journey, { runId: 'e2e-parity' });
  await waitForSession(human.sessionId);
  await waitForSession(agent.sessionId);
  const humanShape = recordingShape(JSON.parse(await fetchReplay(human.sessionId)).events);
  const agentShape = recordingShape(JSON.parse(await fetchReplay(agent.sessionId)).events);
  expect(agentShape.kinds).toEqual(humanShape.kinds);
  expect(agentShape.sources).toEqual(humanShape.sources);
  expect(agentShape.pages).toEqual(humanShape.pages);
  expect(agentShape.interactions).toEqual(humanShape.interactions);
  expect(humanShape.interactions.length).toBeGreaterThan(5);
});

test('text typed into checkout fields never reaches storage', async () => {
  const secretEmail = 'privacy-probe-7731@example.com';
  const secretCard = '4000 1234 5678 9010';
  const journey = {
    path: '/products/p1',
    referrer: '',
    run: async page => {
      await page.getByTestId('add-to-cart').click();
      await page.getByTestId('go-to-cart').click();
      await page.getByTestId('checkout-button').click();
      await fillCheckout(page, { email: secretEmail, cardNumber: secretCard });
      await page.getByTestId('place-order').click();
    }
  };
  for (const record of [recordHumanVisit, recordAgentVisit]) {
    const { sessionId } = await record(browser, journey, { visitor: 'Privacy Probe' });
    await waitForSession(sessionId);
    const replay = JSON.parse(await fetchReplay(sessionId));
    const stored = recordedText(replay);
    expect(stored).not.toContain(secretEmail);
    expect(stored).not.toContain('privacy-probe');
    expect(stored).not.toContain(secretCard);
    expect(stored).not.toContain('5678');
    // The fields were typed into and recorded, as masked characters only.
    const inputs = replay.events.filter(event => event.type === 3 && event.data.source === 5);
    expect(inputs.some(event => event.data.text.length >= secretCard.length)).toBe(true);
    expect(inputs.every(event => /^\**$/.test(event.data.text))).toBe(true);
  }
});
