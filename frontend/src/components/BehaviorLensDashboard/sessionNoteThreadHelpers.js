export const sortRepliesNewestFirst = replies => [...replies].sort((left, right) => {
  const leftCreatedAt = Date.parse(left?.created_at);
  const rightCreatedAt = Date.parse(right?.created_at);
  if (!Number.isFinite(leftCreatedAt)) return Number.isFinite(rightCreatedAt) ? 1 : 0;
  if (!Number.isFinite(rightCreatedAt)) return -1;
  return rightCreatedAt - leftCreatedAt;
});

export const sortRepliesForDisplay = replies => {
  const sortedReplies = sortRepliesNewestFirst(replies);
  const repliesById = new Map(sortedReplies.map(reply => [String(reply.id), reply]));
  const childrenByReplyId = new Map();
  const rootReplies = [];

  sortedReplies.forEach(reply => {
    const parentId = reply.reply_to?.id ?? reply.reply_to_id;
    const parentKey = parentId == null ? '' : String(parentId);
    if (!parentKey || !repliesById.has(parentKey)) {
      rootReplies.push(reply);
      return;
    }
    const children = childrenByReplyId.get(parentKey) || [];
    children.push(reply);
    childrenByReplyId.set(parentKey, children);
  });

  const orderedReplies = [];
  const visitedReplyIds = new Set();
  const appendReply = reply => {
    const replyKey = String(reply.id);
    if (visitedReplyIds.has(replyKey)) return;
    visitedReplyIds.add(replyKey);
    orderedReplies.push(reply);
    (childrenByReplyId.get(replyKey) || []).forEach(appendReply);
  };

  rootReplies.forEach(appendReply);
  sortedReplies.forEach(appendReply);
  return orderedReplies;
};

export const getActivityReplies = (replies, targetReplyId, originInboxItemId) => {
  const hasMatchingOrigin = reply => originInboxItemId != null
    && String(reply.origin_inbox_item_id) === String(originInboxItemId);
  if (targetReplyId == null) return replies.filter(hasMatchingOrigin);
  const visibleReplyIds = new Set([String(targetReplyId)]);

  return replies.filter(reply => {
    const replyId = String(reply.id);
    const parentId = reply.reply_to_id == null ? null : String(reply.reply_to_id);
    if (replyId === String(targetReplyId)) return true;
    if (!hasMatchingOrigin(reply) || !parentId || !visibleReplyIds.has(parentId)) return false;
    visibleReplyIds.add(replyId);
    return true;
  });
};

export const stripAutomaticReplyMention = (text, username) => {
  const value = String(text || '');
  if (!username) return value;
  const prefix = `@${username}`;
  const startsWithPrefix = value.slice(0, prefix.length).toLocaleLowerCase()
    === prefix.toLocaleLowerCase();
  const prefixBoundary = value.length === prefix.length || /\s/u.test(value[prefix.length]);
  return startsWithPrefix && prefixBoundary ? value.slice(prefix.length).trimStart() : value;
};

export const addAutomaticReplyMention = (text, username) => {
  const value = stripAutomaticReplyMention(text, username).trim();
  return username ? `@${username}${value ? ` ${value}` : ''}` : value;
};

export const noteEditComposerId = noteId => `edit-note:${noteId}`;
export const noteReplyComposerId = noteId => `reply-note:${noteId}`;
export const replyToReplyComposerId = (noteId, replyId) => `reply-reply:${noteId}:${replyId}`;
export const editReplyComposerId = (noteId, replyId) => `edit-reply:${noteId}:${replyId}`;
export const noteActionsMenuId = noteId => `note:${noteId}`;
export const replyActionsMenuId = (noteId, replyId) => `reply:${noteId}:${replyId}`;
export const actionsMenuBelongsToNote = (menuId, noteId) => (
  menuId === noteActionsMenuId(noteId)
  || menuId?.startsWith(`reply:${noteId}:`)
);

export const focusTextareaAtEnd = textarea => {
  if (!textarea) return undefined;
  const end = textarea.value.length;
  textarea.focus();
  textarea.setSelectionRange(end, end);
  textarea.scrollTop = textarea.scrollHeight;
  const frame = requestAnimationFrame(() => {
    textarea.scrollTop = textarea.scrollHeight;
  });
  return () => cancelAnimationFrame(frame);
};

export const getThreadComposerId = (noteId, { composing, editingId, replyingTo }) => {
  if (editingId != null) return editReplyComposerId(noteId, editingId);
  if (composing && replyingTo) return replyToReplyComposerId(noteId, replyingTo.id);
  if (composing) return noteReplyComposerId(noteId);
  return null;
};
