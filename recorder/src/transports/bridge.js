// Bridge transport for agent sessions: batches go to the Playwright process
// through a function it exposed with page.exposeFunction('__blBridge', ...).
// The page makes no network calls, so CORS and security headers never interfere.

export const BRIDGE_FUNCTION = '__blBridge';

export const createBridgeTransport = ({ win = window } = {}) => {
  const bridge = (...args) => {
    const fn = win[BRIDGE_FUNCTION];
    if (typeof fn !== 'function') return Promise.resolve();
    return Promise.resolve(fn(...args)).catch(() => {});
  };
  return {
    send(sessionId, batch) {
      return bridge('events', sessionId, batch);
    },
    end(sessionId) {
      return bridge('end', sessionId, null);
    }
  };
};
