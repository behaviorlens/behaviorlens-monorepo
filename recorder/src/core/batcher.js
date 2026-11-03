// Collects events and hands them on in batches: every `intervalMs`, whenever
// `maxEvents` pile up, and once more (final) when the page is being hidden.

export const createBatcher = ({
  onBatch,
  maxEvents = 500,
  intervalMs = 5000,
  setInterval: startTimer = (fn, ms) => globalThis.setInterval(fn, ms),
  clearInterval: stopTimer = id => globalThis.clearInterval(id)
}) => {
  let buffer = [];
  let timer = null;

  const flush = ({ final = false } = {}) => {
    if (!buffer.length) return;
    const events = buffer;
    buffer = [];
    onBatch(events, { final });
  };

  return {
    add(event) {
      buffer.push(event);
      if (buffer.length >= maxEvents) flush();
    },
    flush,
    start() {
      if (timer === null) timer = startTimer(() => flush(), intervalMs);
    },
    stop() {
      if (timer !== null) stopTimer(timer);
      timer = null;
    },
    size: () => buffer.length
  };
};
