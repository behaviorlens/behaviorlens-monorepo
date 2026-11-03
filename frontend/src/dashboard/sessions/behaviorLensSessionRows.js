import { getUserVisitorCategories } from './behaviorLensVisitors';

// Playlist context: visitor type first, then traffic source. Type and source
// both fit because a user can carry one of each.
const VISITOR_ROW_LABELS = {
  first_visits: 'New visitor',
  returnings: 'Returning visitor',
  organic: 'Organic',
  referrals: 'Referral'
};
const VISITOR_ROW_LABEL_ORDER = ['first_visits', 'returnings', 'organic', 'referrals'];

export const formatVisitorRowLabel = categories => (
  VISITOR_ROW_LABEL_ORDER
    .filter(category => categories.includes(category))
    .map(category => VISITOR_ROW_LABELS[category])
    .join(' · ')
);

export const formatSessionDuration = seconds => {
  if (seconds === null || seconds === undefined) {
    return '-';
  }

  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

// The play pill is only 88px wide, so it shows a single-unit duration while the
// row's accessible name keeps the precise m:ss value.
export const formatSessionDurationCompact = seconds => {
  if (seconds === null || seconds === undefined) {
    return '-';
  }

  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (total < 60) {
    return `${total}s`;
  }
  if (total < 3600) {
    return `${Math.floor(total / 60)}m`;
  }
  return `${Math.floor(total / 3600)}h`;
};

export const formatSessionStartedAt = value => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short'
  });
};

export const formatSessionEventCount = count => {
  const parsed = Number(count || 0);
  const total = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  return `${total} ${total === 1 ? 'event' : 'events'}`;
};

export const getSessionIdentity = (session, sessionId) => (
  String(session?.username || '').trim()
  || String(sessionId || '').trim()
  || 'Unknown visitor'
);

// First host label only: "user@gmail.com" → "gmail". Skip empty or host-less values.
export const getMailProviderLabel = email => {
  const value = String(email || '').trim();
  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) {
    return '';
  }

  return value.slice(at + 1).trim().split('.')[0].trim().toLowerCase();
};

const getBrowserName = ua => {
  if (/edg\//i.test(ua)) {
    return 'Edge';
  }
  if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) {
    return 'Chrome';
  }
  if (/firefox\//i.test(ua)) {
    return 'Firefox';
  }
  if (/safari\//i.test(ua) && !/chrome/i.test(ua)) {
    return 'Safari';
  }
  return '';
};

const getOperatingSystem = ua => {
  if (/windows/i.test(ua)) {
    return 'Windows';
  }
  if (/android/i.test(ua)) {
    return 'Android';
  }
  if (/iphone|ipad|ipod/i.test(ua)) {
    return 'iOS';
  }
  if (/mac os x|macintosh/i.test(ua)) {
    return 'macOS';
  }
  if (/linux/i.test(ua)) {
    return 'Linux';
  }
  return '';
};

const getDeviceCategory = ua => {
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return 'Tablet';
  }
  if (/mobi|iphone|ipod|android.+mobile/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
};

// Lightweight UA sniff for the device block - not exhaustive, just enough to
// give a reviewer a quick sense of the device at a glance. Every part is
// optional so a partially recognized agent never renders placeholder noise.
export const describeSessionDevice = userAgent => {
  const ua = String(userAgent || '');
  if (!ua.trim()) {
    return {
      browser: '', category: '', detail: '', operatingSystem: ''
    };
  }

  const browser = getBrowserName(ua);
  const operatingSystem = getOperatingSystem(ua);
  return {
    browser,
    category: getDeviceCategory(ua),
    detail: [browser, operatingSystem].filter(Boolean).join(' · '),
    operatingSystem
  };
};

// "Mobile iOS" / "Desktop macOS": the device summary shown in the row meta line.
export const getSessionDeviceLabel = userAgent => {
  const { category, operatingSystem } = describeSessionDevice(userAgent);
  return [category, operatingSystem].filter(Boolean).join(' ');
};

export const buildSessionMatchCounts = sessions => {
  const counts = new Map();
  (Array.isArray(sessions) ? sessions : []).forEach(session => {
    const username = String(session?.username || '').trim();
    if (username) {
      counts.set(username, (counts.get(username) || 0) + 1);
    }
  });
  return counts;
};

export const buildVisitorCountries = (users = []) => {
  const countryByUsername = new Map();
  (Array.isArray(users) ? users : []).forEach(user => {
    const name = String(user?.name || '').trim();
    const country = String(user?.country || '').trim();
    if (name && country && !countryByUsername.has(name)) {
      countryByUsername.set(name, country);
    }
  });
  return countryByUsername;
};

export const buildVisitorMailProviders = (users = []) => {
  const providerByUsername = new Map();
  (Array.isArray(users) ? users : []).forEach(user => {
    const name = String(user?.name || '').trim();
    const provider = getMailProviderLabel(user?.email);
    if (name && provider && !providerByUsername.has(name)) {
      providerByUsername.set(name, provider);
    }
  });
  return providerByUsername;
};

// Every part is optional so a session without a country or a recognizable user
// agent renders a shorter line instead of placeholder text.
export const buildSessionMetaLine = ({ country, session }) => [
  formatSessionStartedAt(session?.started_at),
  formatSessionEventCount(session?.event_count),
  country,
  getSessionDeviceLabel(session?.user_agent)
].filter(Boolean).join(' · ');

export const buildVisitorCategories = (users = []) => {
  const labelByUsername = new Map();
  (Array.isArray(users) ? users : []).forEach(user => {
    const name = String(user?.name || '').trim();
    const label = formatVisitorRowLabel(getUserVisitorCategories(user));
    if (name && label && !labelByUsername.has(name)) {
      labelByUsername.set(name, label);
    }
  });
  return labelByUsername;
};

// Sessions from the same visitor are surfaced first because they are the more
// actionable context; otherwise the row falls back to the visitor category.
export const getSessionContext = ({ matchCount, username, visitorCategories }) => {
  if (Number(matchCount) > 1) {
    return { label: `${matchCount} matching sessions`, variant: 'matches' };
  }

  return {
    label: visitorCategories?.get(String(username || '').trim()) || '',
    variant: 'visitor'
  };
};
