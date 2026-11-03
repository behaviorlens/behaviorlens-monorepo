import {
  afterEach, beforeEach, describe, expect, it, vi
} from 'vitest';
import { createBatcher } from '../src/core/batcher';
import { describeElement } from '../src/core/describe';
import { createRecorder, INTERACTION_TAG, RRWEB_OPTIONS } from '../src/core/recorder';
import { createSessionStore, generateSessionId, SESSION_IDLE_MS } from '../src/core/session';

const html = markup => {
  document.body.innerHTML = markup;
};

describe('describeElement', () => {
  it('prefers data-testid, even from an inner element', () => {
    html('<button data-testid="add-to-cart"><span id="inner">Add to cart</span></button>');
    expect(describeElement(document.getElementById('inner'))).toMatchObject({
      tag: 'button', testId: 'add-to-cart', role: 'button', name: 'Add to cart',
      selector: '[data-testid="add-to-cart"]'
    });
  });

  it('falls back to role and accessible name', () => {
    html('<a href="/cart">View   cart</a>');
    expect(describeElement(document.querySelector('a')).selector).toBe('role=link[name="View cart"]');
  });

  it('names fields by their label and never reads the typed value', () => {
    html('<label for="email">Email</label><input id="email" type="email" value="secret@example.com">');
    const description = describeElement(document.getElementById('email'));
    expect(description).toMatchObject({ role: 'textbox', name: 'Email' });
    expect(JSON.stringify(description)).not.toContain('secret');
  });

  it('uses a stable id, then a short CSS path', () => {
    html('<div id="hero"><p>One</p><p>Two</p></div><section><div><span>x</span><span>y</span></div></section>');
    expect(describeElement(document.getElementById('hero')).selector).toBe('#hero');
    const second = document.querySelectorAll('section span')[1];
    expect(describeElement(second).selector).toBe('section > div > span:nth-of-type(2)');
  });
});

describe('createBatcher', () => {
  it('flushes at maxEvents, on its timer, and marks the final flush', () => {
    vi.useFakeTimers();
    const batches = [];
    const batcher = createBatcher({ maxEvents: 3, intervalMs: 1000, onBatch: (events, info) => batches.push([events.length, info.final]) });
    batcher.start();
    [1, 2, 3, 4].forEach(event => batcher.add(event));
    expect(batches).toEqual([[3, false]]);
    vi.advanceTimersByTime(1000);
    expect(batches).toEqual([[3, false], [1, false]]);
    batcher.add(5);
    batcher.flush({ final: true });
    expect(batches.at(-1)).toEqual([1, true]);
    batcher.stop();
    vi.useRealTimers();
  });
});

describe('createSessionStore', () => {
  it('generates 36 hex character ids', () => {
    expect(generateSessionId()).toMatch(/^[0-9a-f]{36}$/);
  });

  it('keeps the id across loads, numbers batches, and rotates after idle', () => {
    let now = 1000;
    const values = new Map();
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    const ids = ['first', 'second'];
    const options = { storage, now: () => now, generateId: () => ids.shift() };
    const store = createSessionStore(options);
    expect(store.current().id).toBe('first');
    expect([store.nextSeq(), store.nextSeq()]).toEqual([0, 1]);

    const reloaded = createSessionStore(options);
    expect(reloaded.current()).toMatchObject({ id: 'first', seq: 2 });

    now += SESSION_IDLE_MS + 1;
    expect(reloaded.isIdle()).toBe(true);
    expect(reloaded.rotate()).toMatchObject({ id: 'second', seq: 0 });
  });
});

describe('createRecorder', () => {
  let record;
  let transport;

  const makeRecord = () => {
    const fn = vi.fn(options => {
      fn.emit = options.emit;
      options.emit({ type: 4, timestamp: Date.now(), data: { href: window.location.href } });
      options.emit({ type: 2, timestamp: Date.now(), data: {} });
      return vi.fn();
    });
    fn.addCustomEvent = vi.fn((tag, payload) => fn.emit({ type: 5, timestamp: Date.now(), data: { tag, payload } }));
    fn.takeFullSnapshot = vi.fn();
    return fn;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    record = makeRecord();
    transport = { send: vi.fn(), end: vi.fn() };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records with masking on and sends batches with metadata once', () => {
    const recorder = createRecorder({ record, transport, meta: { source: 'persona', personaRunId: 'run-1' }, batchOptions: { intervalMs: 1000 } });
    recorder.start();
    expect(record.mock.calls[0][0]).toMatchObject({ maskAllInputs: RRWEB_OPTIONS.maskAllInputs, blockClass: 'bl-block' });
    expect(RRWEB_OPTIONS.maskAllInputs).toBe(true);

    vi.advanceTimersByTime(1000);
    record.emit({ type: 3, timestamp: Date.now(), data: {} });
    vi.advanceTimersByTime(1000);

    const [first, second] = transport.send.mock.calls.map(call => call[1]);
    expect(first.seq).toBe(0);
    expect(first.meta).toMatchObject({ source: 'persona', personaRunId: 'run-1', url: window.location.href });
    expect(second.seq).toBe(1);
    expect(second.meta).toBeUndefined();
    expect(transport.send.mock.calls[0][0]).toMatch(/^[0-9a-f]{36}$/);
    recorder.stop();
  });

  it('reports the landing page, not the page at the first flush', () => {
    window.history.pushState({}, '', '/landing');
    const recorder = createRecorder({ record, transport, batchOptions: { intervalMs: 1000 } });
    recorder.start();
    window.history.pushState({}, '', '/later');
    vi.advanceTimersByTime(1000);
    expect(transport.send.mock.calls[0][1].meta.url).toMatch(/\/landing$/);
    recorder.stop();
    window.history.pushState({}, '', '/');
  });

  it('adds a bl.interaction event for clicks, with the element description', () => {
    html('<button data-testid="checkout-button">Go to checkout</button>');
    const recorder = createRecorder({ record, transport });
    recorder.start();
    document.querySelector('button').click();
    expect(record.addCustomEvent).toHaveBeenCalledWith(INTERACTION_TAG, expect.objectContaining({
      type: 'click', testId: 'checkout-button', selector: '[data-testid="checkout-button"]'
    }));
    recorder.stop();
  });

  it('takes a new full snapshot when a single-page app changes route', () => {
    const recorder = createRecorder({ record, transport });
    recorder.start();
    window.history.pushState({}, '', '/products/p1');
    vi.advanceTimersByTime(60);
    expect(record.takeFullSnapshot).toHaveBeenCalledWith(true);
    recorder.stop();
    window.history.pushState({}, '', '/');
  });

  it('flushes and ends the session on stop', () => {
    const recorder = createRecorder({ record, transport });
    recorder.start();
    recorder.stop();
    expect(transport.send).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ seq: 0 }), { final: true });
    expect(transport.end).toHaveBeenCalledWith(recorder.getSessionId());
  });
});

describe('describeElement without CSS.escape', () => {
  it('escapes ids itself', () => {
    const original = globalThis.CSS;
    globalThis.CSS = undefined;
    html('<div id="a.b">x</div>');
    expect(describeElement(document.getElementById('a.b')).selector).toBe(String.raw`#a\.b`);
    globalThis.CSS = original;
  });
});
