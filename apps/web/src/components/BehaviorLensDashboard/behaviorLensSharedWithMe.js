export const TAB_INBOX_MENTIONS = 'inbox_mentions';
export const TAB_MY_MENTIONS = 'my_mentions';
export const TAB_MY_NOTES = 'my_notes';
export const TAB_ALL = 'all';
export const TAB_UNREAD = 'unread';
export const TAB_THREAD = 'thread';

export const CONTEXT_SESSION_REPLAY = 'Session Replay';

export const isInboxMention = item => (
  item?.category === TAB_INBOX_MENTIONS || item?.category === TAB_THREAD
);

export const getMentionableNames = (items = []) => Array.from(new Set([
  ...items.flatMap(item => item.mentions || []),
  ...items.map(item => item.author?.name).filter(name => name && name !== 'You')
]));

const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

export const splitMessageMentions = (message, names = []) => {
  const text = String(message || '');
  const candidates = names.slice().sort((left, right) => right.length - left.length);
  if (!text || !candidates.length) {
    return text ? [{ type: 'text', value: text }] : [];
  }
  const pattern = new RegExp(`@(${candidates.map(escapeRegExp).join('|')})`, 'gu');
  const tokens = [];
  let cursor = 0;
  let match = pattern.exec(text);
  while (match) {
    if (match.index > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, match.index) });
    }
    tokens.push({ type: 'mention', value: match[1] });
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }
  if (cursor < text.length) {
    tokens.push({ type: 'text', value: text.slice(cursor) });
  }
  return tokens;
};

const OPAQUE_SEGMENT = /^[0-9a-f]{12,}$|^\d{8,}$/iu;

export const shortenPath = (path, maxLength = 34) => {
  const value = String(path || '');
  const segments = value.split('/').filter(Boolean);
  if (!segments.length) return value;
  const trailingSlash = value.endsWith('/');
  const collapsed = segments
    .map(segment => (OPAQUE_SEGMENT.test(segment) ? '…' : segment))
    .filter((segment, index, list) => !(segment === '…' && index === list.length - 1));
  if (!collapsed.length) return `/${segments[segments.length - 1]}`;
  const full = `/${collapsed.join('/')}${trailingSlash ? '/' : ''}`;
  if (full.length <= maxLength) return full;
  const kept = [];
  for (let index = collapsed.length - 1; index >= 0; index -= 1) {
    const candidate = `…/${[collapsed[index], ...kept].join('/')}`;
    if (candidate.length > maxLength && kept.length) break;
    kept.unshift(collapsed[index]);
  }
  return `…/${kept.join('/')}`;
};

export const MENTION_GROUP_TODAY = 'today';
export const MENTION_GROUP_YESTERDAY = 'yesterday';
export const MENTION_GROUP_EARLIER = 'earlier';

export const MENTION_GROUP_LABELS = {
  [MENTION_GROUP_TODAY]: 'Today',
  [MENTION_GROUP_YESTERDAY]: 'Yesterday',
  [MENTION_GROUP_EARLIER]: 'Earlier'
};

const startOfDay = date => new Date(
  date.getFullYear(), date.getMonth(), date.getDate()
).getTime();

export const getMentionDateGroup = (createdAt, now = Date.now()) => {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return MENTION_GROUP_EARLIER;
  const today = startOfDay(new Date(now));
  if (created.getTime() >= today) return MENTION_GROUP_TODAY;
  if (created.getTime() >= today - 86_400_000) return MENTION_GROUP_YESTERDAY;
  return MENTION_GROUP_EARLIER;
};

export const groupMentionsByDate = (items, now = Date.now()) => (
  [MENTION_GROUP_TODAY, MENTION_GROUP_YESTERDAY, MENTION_GROUP_EARLIER]
    .map(id => ({
      id,
      label: MENTION_GROUP_LABELS[id],
      items: items.filter(item => getMentionDateGroup(item.createdAt, now) === id)
    }))
    .filter(group => group.items.length > 0)
);

export const getMentionBadge = item => {
  if (item?.category === TAB_THREAD) {
    return { label: 'Thread update', variant: 'thread' };
  }
  if (isInboxMention(item)) {
    return { label: 'Mentioned you', variant: 'mentionedYou' };
  }
  if (Array.isArray(item?.mentions) && item.mentions.length > 0) {
    return { label: 'You mentioned', variant: 'youMentioned' };
  }
  return { label: 'Private note', variant: 'privateNote' };
};

export const buildSharedItemTarget = (item, returnTo = '') => {
  const params = new URLSearchParams();
  params.set('t', String(Math.max(0, Number(item?.offsetSeconds) || 0)));
  params.set('workspace', 'sessionNotes');
  if (item?.noteId) params.set('note', item.noteId);
  if (item?.replyId) params.set('reply', item.replyId);
  if (returnTo) params.set('returnTo', returnTo);
  return `/app/${item?.sessionId}?${params.toString()}`;
};
