// HTTP transport for human sessions: batches go to the ingest API, gzip
// compressed when the browser supports it, in order, with retries.

const RETRYABLE = status => status === 0 || status === 408 || status === 429 || status >= 500;
const KEEPALIVE_LIMIT = 60_000; // browsers cap keepalive bodies at 64 KB in total

export const gzipBody = async text => {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).blob();
};

export const createHttpTransport = ({
  api,
  key,
  fetch: send = (...args) => globalThis.fetch(...args),
  compress = gzipBody,
  maxAttempts = 5,
  baseDelayMs = 1000,
  wait = ms => new Promise(resolve => { setTimeout(resolve, ms); }),
  onLimitReached = () => {}
}) => {
  const base = String(api).replace(/\/$/, '');
  let queue = Promise.resolve();
  const blocked = new Set();

  const post = async (sessionId, batch, final) => {
    const text = JSON.stringify(batch);
    const headers = { 'Content-Type': 'application/json', 'X-BL-Project-Key': key };
    // The final flush happens while the page unloads: no time to compress.
    let body = text;
    if (!final) {
      const compressed = await compress(text);
      if (compressed) {
        body = compressed;
        headers['Content-Encoding'] = 'gzip';
      }
    }
    const response = await send(`${base}/ingest/v1/sessions/${sessionId}/events`, {
      method: 'POST',
      headers,
      body,
      credentials: 'omit',
      keepalive: final && text.length < KEEPALIVE_LIMIT
    });
    return response.status;
  };

  const deliver = async (sessionId, batch, final) => {
    if (blocked.has(sessionId)) return;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let status;
      try {
        status = await post(sessionId, batch, final);
      } catch (error) {
        status = 0; // network failure
      }
      if (status >= 200 && status < 300) return;
      if (status === 413) {
        // This session hit its storage limit; stop sending it.
        blocked.add(sessionId);
        onLimitReached(sessionId);
        return;
      }
      if (!RETRYABLE(status) || attempt === maxAttempts || final) return;
      await wait(baseDelayMs * 2 ** (attempt - 1));
    }
  };

  return {
    send(sessionId, batch, { final = false } = {}) {
      if (final) {
        // Fire immediately: the page may be gone before the queue drains.
        deliver(sessionId, batch, true);
        return queue;
      }
      queue = queue.then(() => deliver(sessionId, batch, false));
      return queue;
    },
    end(sessionId) {
      try {
        send(`${base}/ingest/v1/sessions/${sessionId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
          credentials: 'omit',
          keepalive: true
        }).catch(() => {});
      } catch (error) { /* page unloading */ }
    },
    // For tests: resolves once queued batches are delivered.
    idle: () => queue
  };
};
