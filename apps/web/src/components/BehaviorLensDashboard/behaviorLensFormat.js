// One locale for the whole review UI.
//
// Every number and date here used to reach `toLocaleString()` without a locale,
// so a reviewer on a Turkish machine read "1.679 avg. events" (a thousands
// separator) directly above "71.7" (a decimal point) — the same dot meaning two
// different things one line apart — and "28 Ağu 6:17" beside an English
// "Desktop macOS". The UI is authored in English; its numbers and dates are
// formatted in English too. Never call a `toLocale*` helper here without
// passing BEHAVIORLENS_LOCALE.
export const BEHAVIORLENS_LOCALE = 'en-US';

const integerFormatter = new Intl.NumberFormat(BEHAVIORLENS_LOCALE, { maximumFractionDigits: 0 });

export const formatCount = value => integerFormatter.format(Number(value) || 0);

export const formatPercentage = value => `${integerFormatter.format(Number(value) || 0)}%`;

// "28 Aug 6:17" — the playlist meta line. Day and month stay abbreviated so the
// row keeps the event count and device on the same line.
export const formatDateTime = value => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString(BEHAVIORLENS_LOCALE, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short'
  });
};

export const formatDate = value => {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString(BEHAVIORLENS_LOCALE);
};

export const formatTime = value => {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleTimeString(BEHAVIORLENS_LOCALE);
};

// "2026-08-25" → "Aug 25". Chart axes carry the day key, not the storage key;
// the ISO string is a database format and reads as one beside "28 Aug" rows.
export const formatDayKeyLabel = day => {
  const match = String(day || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return String(day || '');
  }

  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(parsed.getTime())) {
    return String(day);
  }

  return parsed.toLocaleDateString(BEHAVIORLENS_LOCALE, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  });
};
