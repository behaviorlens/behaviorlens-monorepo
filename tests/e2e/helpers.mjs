import { DEFAULTS } from '../../scripts/run-journey.mjs';

export const fetchReplay = async sessionId => {
  const response = await fetch(`${DEFAULTS.api}/api/v1/projects/demo-shop/sessions/${sessionId}/replay`);
  if (!response.ok) throw new Error(`Replay ${sessionId}: HTTP ${response.status}`);
  return response.text();
};

// What a recording is made of, independent of timing and node ids: event kinds,
// incremental sources, the pages visited and the interactions in order.
export const recordingShape = events => {
  const kinds = new Set();
  const sources = new Set();
  const pages = [];
  const interactions = [];
  events.forEach(event => {
    // DomContentLoaded/Load (0/1) only appear when recording starts before the
    // page finishes loading, which depends on when the loader runs, not on the format.
    if (event.type !== 0 && event.type !== 1) kinds.add(event.type);
    if (event.type === 3) sources.add(event.data.source);
    if (event.type === 4) pages.push(new URL(event.data.href).pathname);
    if (event.type === 5 && event.data.tag === 'bl.interaction') {
      interactions.push(`${event.data.payload.type} ${event.data.payload.selector}`);
    }
  });
  return {
    kinds: [...kinds].sort(), sources: [...sources].sort(), pages, interactions
  };
};

// Console errors worth failing on: not the dashboard's known review-API 404s
// (Phase 2 builds those endpoints) or React's defaultProps deprecation notice.
export const watchConsoleErrors = page => {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    const text = message.text();
    if (message.type() !== 'error') return;
    if (text.includes('defaultProps') || text.includes('Failed to load resource')) return;
    errors.push(text.slice(0, 300));
  });
  return errors;
};
