import { renderHook } from '@testing-library/react';
import {
  afterEach, describe, expect, it, vi
} from 'vitest';
import { getLocalStorage, getUrlParameter } from './storage';
import { useMessageBus } from './useMessageBus';

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
};

describe('storage helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns localStorage when it works', () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    expect(getLocalStorage()).toBe(storage);
  });

  it('returns null when storage access throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('blocked');
      }
    });
    expect(getLocalStorage()).toBeNull();
  });

  it('reads a query parameter', () => {
    expect(getUrlParameter('replayCanvas', '?replayCanvas=1')).toBe('1');
    expect(getUrlParameter('missing', '?a=1')).toBeNull();
  });
});

describe('useMessageBus', () => {
  it('dispatches messages from allowed origins by type and ignores others', () => {
    const onSeek = vi.fn();
    renderHook(() => useMessageBus({ allowedOrigins: ['https://allowed.test'], on: { 'bl:seek': onSeek } }));

    window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.test', data: { type: 'bl:seek', seconds: 4 } }));
    expect(onSeek).not.toHaveBeenCalled();

    window.dispatchEvent(new MessageEvent('message', { origin: 'https://allowed.test', data: { type: 'bl:seek', seconds: 4 } }));
    expect(onSeek).toHaveBeenCalledWith({ type: 'bl:seek', seconds: 4 }, expect.any(MessageEvent));
  });
});
