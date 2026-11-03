export const SHARE_MOMENT_QUERY_KEY = 't';

const SHARE_LINK_ONLY_REMOVED_QUERY_KEYS = [
  'embed',
  'insightsMode',
  'returnTo',
  'workspace'
];

export const readShareMomentOffsetMs = search => {
  const rawSeconds = new URLSearchParams(search).get(SHARE_MOMENT_QUERY_KEY);
  if (rawSeconds === null || rawSeconds.trim() === '') {
    return null;
  }
  const seconds = Number(rawSeconds);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null;
  }
  return Math.round(seconds * 1000);
};

export const buildShareMomentUrl = (href, offsetMs) => {
  const url = new URL(href);
  const safeOffsetMs = Math.max(0, Number(offsetMs) || 0);
  SHARE_LINK_ONLY_REMOVED_QUERY_KEYS.forEach(key => url.searchParams.delete(key));
  url.searchParams.set(SHARE_MOMENT_QUERY_KEY, String(Math.floor(safeOffsetMs / 1000)));
  url.hash = '';
  return url.toString();
};
