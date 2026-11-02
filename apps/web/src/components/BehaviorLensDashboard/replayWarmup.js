// Runs `cb` once the browser is idle after a replay is built (or after a short
// delay where requestIdleCallback is missing). Returns a cancel function.
export const whenWarm = (cb, timeoutMs = 15000) => {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(cb, { timeout: timeoutMs });
    return () => { try { window.cancelIdleCallback(id); } catch (e) { /* noop */ } };
  }
  const id = window.setTimeout(cb, 1500);
  return () => window.clearTimeout(id);
};
