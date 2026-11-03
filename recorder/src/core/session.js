// Session identity for one browser tab. Kept in sessionStorage so a visit that
// spans several page loads stays one session; 10 minutes without activity
// starts a new one.

export const SESSION_STORAGE_KEY = 'bl:session';
// Keep in step with session_idle_seconds in the API (backend/app/config.py).
export const SESSION_IDLE_MS = 10 * 60 * 1000;

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value))
  };
};

export const safeSessionStorage = () => {
  try {
    const storage = window.sessionStorage;
    storage.setItem('bl:probe', '1');
    storage.removeItem('bl:probe');
    return storage;
  } catch (error) {
    return memoryStorage();
  }
};

// 36 hex characters, the id format the dashboard expects.
export const generateSessionId = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const createSessionStore = ({
  storage = safeSessionStorage(),
  now = () => Date.now(),
  idleMs = SESSION_IDLE_MS,
  generateId = generateSessionId
} = {}) => {
  const read = () => {
    try {
      const value = JSON.parse(storage.getItem(SESSION_STORAGE_KEY) || 'null');
      return value && typeof value.id === 'string' ? value : null;
    } catch (error) {
      return null;
    }
  };
  const write = value => {
    try {
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      // Storage full or blocked: the session lives in memory only.
    }
    return value;
  };
  let state = read();
  const fresh = () => write({ id: generateId(), seq: 0, lastActivity: now() });

  return {
    current() {
      if (!state || now() - state.lastActivity > idleMs) {
        state = fresh();
      }
      return state;
    },
    // True when the gap since the last event means a new session is due.
    isIdle() {
      return Boolean(state) && now() - state.lastActivity > idleMs;
    },
    rotate() {
      state = fresh();
      return state;
    },
    touch() {
      const current = this.current();
      const time = now();
      // Persist at most every 5 s; mouse moves arrive many times a second.
      state = time - current.lastActivity < 5000
        ? { ...current, lastActivity: time }
        : write({ ...current, lastActivity: time });
    },
    nextSeq() {
      const current = this.current();
      state = write({ ...current, seq: current.seq + 1 });
      return current.seq;
    }
  };
};
