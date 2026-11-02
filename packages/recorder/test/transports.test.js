import { describe, expect, it, vi } from 'vitest';
import { createBridgeTransport } from '../src/transports/bridge';
import { createHttpTransport } from '../src/transports/http';

const response = status => ({ status });
const noWait = () => Promise.resolve();
const plain = () => Promise.resolve(null); // no compression in tests

describe('createHttpTransport', () => {
  it('posts batches in order with the project key', async () => {
    const fetch = vi.fn().mockResolvedValue(response(202));
    const transport = createHttpTransport({ api: 'http://api.test/', key: 'pk_1', fetch, compress: plain, wait: noWait });
    transport.send('s1', { seq: 0, events: [1] });
    transport.send('s1', { seq: 1, events: [2] });
    await transport.idle();
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'http://api.test/ingest/v1/sessions/s1/events',
      'http://api.test/ingest/v1/sessions/s1/events'
    ]);
    expect(fetch.mock.calls.map(([, init]) => JSON.parse(init.body).seq)).toEqual([0, 1]);
    expect(fetch.mock.calls[0][1].headers['X-BL-Project-Key']).toBe('pk_1');
  });

  it('retries network failures and 5xx with backoff, then succeeds', async () => {
    const fetch = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(202));
    const wait = vi.fn(noWait);
    const transport = createHttpTransport({ api: 'http://api.test', key: 'k', fetch, compress: plain, wait });
    await transport.send('s1', { seq: 0, events: [] });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls.map(([ms]) => ms)).toEqual([1000, 2000]);
  });

  it('drops batches the server rejects as invalid', async () => {
    const fetch = vi.fn().mockResolvedValue(response(401));
    const transport = createHttpTransport({ api: 'http://api.test', key: 'k', fetch, compress: plain, wait: noWait });
    await transport.send('s1', { seq: 0, events: [] });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('stops sending a session that reached its storage limit', async () => {
    const fetch = vi.fn().mockResolvedValue(response(413));
    const onLimitReached = vi.fn();
    const transport = createHttpTransport({ api: 'http://api.test', key: 'k', fetch, compress: plain, wait: noWait, onLimitReached });
    await transport.send('s1', { seq: 0, events: [] });
    await transport.send('s1', { seq: 1, events: [] });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onLimitReached).toHaveBeenCalledWith('s1');
  });

  it('gzips normal batches and sends the final one plain with keepalive', async () => {
    const fetch = vi.fn().mockResolvedValue(response(202));
    const compress = vi.fn(async text => new Blob([`gz:${text}`]));
    const transport = createHttpTransport({ api: 'http://api.test', key: 'k', fetch, compress, wait: noWait });
    await transport.send('s1', { seq: 0, events: [] });
    transport.send('s1', { seq: 1, events: [] }, { final: true });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls[0][1].headers['Content-Encoding']).toBe('gzip');
    expect(fetch.mock.calls[1][1]).toMatchObject({ keepalive: true, body: '{"seq":1,"events":[]}' });
  });
});

describe('createBridgeTransport', () => {
  it('hands batches and the end call to the exposed bridge function', async () => {
    const bridge = vi.fn().mockResolvedValue(undefined);
    const transport = createBridgeTransport({ win: { __blBridge: bridge } });
    await transport.send('s1', { seq: 0, events: [] });
    await transport.end('s1');
    expect(bridge.mock.calls).toEqual([['events', 's1', { seq: 0, events: [] }], ['end', 's1', null]]);
  });
});
