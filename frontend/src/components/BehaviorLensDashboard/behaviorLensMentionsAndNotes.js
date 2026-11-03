import {
  TAB_INBOX_MENTIONS,
  TAB_MY_MENTIONS,
  TAB_MY_NOTES,
  TAB_THREAD
} from './behaviorLensSharedWithMe';
import { WORKSPACE_MODE_SESSION_REPLAY } from './WorkspaceModeTabs';

const urlPath = value => {
  try {
    return new URL(value).pathname;
  } catch (error) {
    return String(value || '');
  }
};

const initials = value => String(value || '')
  .trim()
  .split(/\s+/u)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part.charAt(0).toUpperCase())
  .join('') || 'JS';

const normalizedUsername = value => String(value || '')
  .trim()
  .replace(/^@/u, '')
  .toLocaleLowerCase();

const clientCategory = (item, currentUsername, mentions) => {
  const authoredByCurrentUser = item?.category === 'my_note'
    || (Boolean(normalizedUsername(currentUsername))
      && normalizedUsername(item?.author?.username) === normalizedUsername(currentUsername));

  if (!authoredByCurrentUser && item?.category === 'mention') return TAB_INBOX_MENTIONS;
  if (!authoredByCurrentUser && item?.category === 'thread') return TAB_THREAD;
  return mentions.length > 0
    ? TAB_MY_MENTIONS
    : TAB_MY_NOTES;
};

export const mapMentionsAndNotesItem = (item, session = null, currentUsername = '') => {
  const authorName = item?.author?.display_name || item?.author?.username || 'Unknown user';
  const sessionId = String(item?.session_id || '');
  const title = session?.page_title || urlPath(session?.url) || `Session ${sessionId.slice(0, 8)}`;
  const ownUsername = normalizedUsername(currentUsername);
  const mentions = (Array.isArray(item?.mentioned_usernames) ? item.mentioned_usernames : [])
    .filter(username => !ownUsername || normalizedUsername(username) !== ownUsername);

  return {
    id: String(item?.id || ''),
    noteId: String(item?.note_id || ''),
    replyId: item?.reply_id ? String(item.reply_id) : null,
    category: clientCategory(item, currentUsername, mentions),
    sessionId,
    title,
    path: urlPath(session?.url),
    author: {
      name: authorName,
      username: item?.author?.username || '',
      initials: initials(authorName),
      isCurrentUser: item?.category === 'my_note'
        || (Boolean(ownUsername)
          && normalizedUsername(item?.author?.username) === ownUsername)
    },
    mentions,
    message: String(item?.text || ''),
    tags: Array.isArray(item?.tags) ? item.tags : [],
    noteCreatedAt: item?.created_at || '',
    noteUpdatedAt: item?.updated_at || item?.created_at || '',
    createdAt: item?.occurred_at || item?.updated_at || item?.created_at,
    mode: session?.mode || WORKSPACE_MODE_SESSION_REPLAY,
    contextLabel: session?.contextLabel || 'Session Replay',
    offsetSeconds: Math.max(0, Number(item?.replay_time_ms) || 0) / 1000,
    durationSeconds: Math.max(0, Number(session?.duration_s) || 0),
    rageClicks: Math.max(0, Number(session?.rage_clicks || session?.rageClicks) || 0),
    status: String(session?.status || ''),
    url: String(session?.url || ''),
    visitor: String(session?.username || ''),
    startedAt: session?.started_at || '',
    userAgent: String(session?.user_agent || ''),
    read: Boolean(item?.read),
    flagged: Boolean(item?.flagged)
  };
};

export const mapNoteReply = (reply, currentUsername = '', usersByUsername = new Map()) => {
  const username = String(reply?.created_by || '');
  const user = usersByUsername.get(username);
  const createdAt = reply?.created_at || '';
  const updatedAt = reply?.updated_at || createdAt;
  const parentUsername = String(reply?.reply_to?.created_by || '');
  const parentUser = usersByUsername.get(parentUsername);

  return {
    id: String(reply?.id || ''),
    author: user?.name || username || 'Unknown user',
    username,
    isCurrentUser: Boolean(currentUsername) && username === currentUsername,
    text: String(reply?.text || ''),
    replyToId: reply?.reply_to_id ? String(reply.reply_to_id) : null,
    replyTo: reply?.reply_to ? {
      id: String(reply.reply_to.id || reply.reply_to_id || ''),
      author: parentUser?.name || parentUsername || 'Unknown user',
      username: parentUsername,
      text: reply.reply_to.deleted ? '' : String(reply.reply_to.text || ''),
      deleted: Boolean(reply.reply_to.deleted)
    } : null,
    createdAt,
    editedAt: updatedAt !== createdAt ? updatedAt : null
  };
};

export const indexSessions = sessions => new Map(
  (Array.isArray(sessions) ? sessions : []).map(session => [session.id, session])
);

export const indexUsers = users => new Map(
  (Array.isArray(users) ? users : []).map(user => [user.username, user])
);
