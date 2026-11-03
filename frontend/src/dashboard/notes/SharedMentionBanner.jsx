import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconPaperPlaneFilled, IconPlayFilled } from '../../ui/icons';
import {
  MentionBanner,
  MentionBannerActions,
  MentionBannerAge,
  MentionBannerAuthor,
  MentionBannerAvatar,
  MentionBannerBody,
  MentionBannerComposer,
  MentionBannerLead,
  MentionBannerMessage,
  MentionBannerMoment,
  MentionBannerReply,
  MentionBannerReplyAction,
  MentionBannerReplyActions,
  MentionBannerReplyAvatar,
  MentionBannerReplyBody,
  MentionBannerReplyContext,
  MentionBannerReplyEdited,
  MentionBannerReplyHeader,
  MentionBannerReplyMeta,
  MentionBannerReplyRow,
  MentionBannerReplyText,
  MentionBannerSurface,
  MentionBannerThread,
  MentionBannerUndo,
  MentionBannerUndoAction,
  MentionComposerActions,
  MentionComposerHint,
  MentionComposerTextarea,
  MentionSendButton
} from './ScBehaviorLensMentionBanner';
import {
  PaneGhost,
  PaneMentionChip
} from './ScBehaviorLensSharedWithMe';
import { getMentionableNames, isInboxMention, splitMessageMentions } from './behaviorLensSharedWithMe';
import { formatDateTime } from './behaviorLensFormat';
import { formatRelativeTime, formatReplayTimestamp } from '../shared/behaviorLensNoteTimestamps';
import { EMPTY_ARRAY } from '../../lib/propDefaults';

// The question the reviewer came to answer, kept on screen while they answer
// it. Replying and resolving live here rather than back in the list: this is
// where the reviewer finds out whether the note was right, so it is where they
// should be able to say so.
const SharedMentionBanner = ({
  item, onDeleteNote, onDeleteReply, onEditNote, onEditReply, onReply, onRestoreReply, replies = EMPTY_ARRAY
}) => {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [deleted, setDeleted] = useState(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmingNote, setConfirmingNote] = useState(false);
  const inbox = isInboxMention(item);
  const ownsNote = !inbox;
  const names = Array.from(new Set([
    ...getMentionableNames([item]),
    ...replies.flatMap(reply => [reply.username, reply.replyTo?.username]).filter(Boolean)
  ]));

  const runAction = async (action, fallback) => {
    if (pending) return false;
    setPending(true);
    setActionError('');
    try {
      await action();
      return true;
    } catch (error) {
      setActionError(error?.message || fallback);
      return false;
    } finally {
      setPending(false);
    }
  };

  const openComposer = (target = null) => {
    const targetUsername = target
      ? (target.isCurrentUser ? '' : target.username)
      : (item.author?.isCurrentUser ? '' : item.author?.username);
    if (targetUsername) {
      setDraft(current => (
        !current.trim() || /^@[^\s]+\s*$/u.test(current)
          ? `@${targetUsername} `
          : current
      ));
    }
    setReplyingTo(target);
    setComposing(true);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    const succeeded = await runAction(
      () => onReply(item.id, text, replyingTo?.id || null),
      'The reply could not be added.'
    );
    if (!succeeded) return;
    setDraft('');
    setComposing(false);
    setReplyingTo(null);
    setDeleted(null);
  };

  const close = () => {
    setComposing(false);
    setDraft('');
    setReplyingTo(null);
  };

  const startEdit = reply => {
    setConfirmingId(null);
    setEditingId(reply.id);
    setEditDraft(reply.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const saveEdit = async replyId => {
    const text = editDraft.trim();
    if (!text) {
      return;
    }
    const succeeded = await runAction(
      () => onEditReply(item.id, replyId, text),
      'The reply could not be updated.'
    );
    if (!succeeded) return;
    cancelEdit();
  };

  const startNoteEdit = () => {
    setNoteDraft(item.message || '');
    setConfirmingNote(false);
    setEditingNote(true);
  };

  const saveNoteEdit = async () => {
    const text = noteDraft.trim();
    if (!text) return;
    const succeeded = await runAction(
      () => onEditNote(item.id, text),
      'The note could not be updated.'
    );
    if (succeeded) setEditingNote(false);
  };

  const removeNote = async () => {
    const succeeded = await runAction(
      () => onDeleteNote(item.id),
      'The note could not be deleted.'
    );
    if (succeeded) setConfirmingNote(false);
  };

  const removeReply = async reply => {
    const succeeded = await runAction(
      () => onDeleteReply(item.id, reply.id),
      'The reply could not be deleted.'
    );
    if (!succeeded) return;
    setDeleted({ index: replies.indexOf(reply), reply });
    setConfirmingId(null);
  };

  const undoDelete = async () => {
    const succeeded = await runAction(
      () => onRestoreReply(item.id, deleted.reply, deleted.index),
      'The reply could not be restored.'
    );
    if (succeeded) setDeleted(null);
  };

  return (
    <MentionBanner data-testid="behaviorlens-workspace-mention">
      <MentionBannerAvatar aria-hidden="true">
        {inbox ? (item.author?.initials || 'JS') : 'You'}
      </MentionBannerAvatar>

      <MentionBannerBody>
        <MentionBannerLead>
          <MentionBannerAuthor>
            {inbox ? item.author?.name : 'Your note'}
          </MentionBannerAuthor>
          {inbox ? 'mentioned you in' : 'left in'}
          <MentionBannerSurface>{item.contextLabel}</MentionBannerSurface>
          {/* The note points at a moment, and the overlay opened there. Two
              clocks meet on this screen — this one and the time the note was
              written — so the offset says it is a replay position rather than
              standing as a bare number. */}
          <MentionBannerMoment data-testid="behaviorlens-workspace-mention-moment">
            <IconPlayFilled aria-hidden="true" />
            {`at ${formatReplayTimestamp(item.offsetSeconds * 1000)}`}
          </MentionBannerMoment>
          <MentionBannerAge dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
            {formatRelativeTime(item.createdAt)}
          </MentionBannerAge>
        </MentionBannerLead>
        {editingNote ? (
          <>
            <MentionComposerTextarea
              autoFocus
              value={noteDraft}
              aria-label="Edit your note"
              data-testid="behaviorlens-workspace-note-edit-input"
              onChange={event => setNoteDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Escape') setEditingNote(false);
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) saveNoteEdit();
              }}
            />
            <MentionComposerActions>
              <MentionSendButton
                type="button"
                disabled={!noteDraft.trim() || pending}
                data-testid="behaviorlens-workspace-note-edit-save"
                onClick={saveNoteEdit}
              >
                Save
              </MentionSendButton>
              <PaneGhost type="button" onClick={() => setEditingNote(false)}>Cancel</PaneGhost>
            </MentionComposerActions>
          </>
        ) : (
          <MentionBannerMessage>
            {splitMessageMentions(item.message, names).map((token, index) => (
              token.type === 'mention'
                ? <PaneMentionChip key={index}>{`@${token.value}`}</PaneMentionChip>
                : <React.Fragment key={index}>{token.value}</React.Fragment>
            ))}
          </MentionBannerMessage>
        )}
      </MentionBannerBody>

      {!editingNote && (
      <MentionBannerActions>
        <PaneGhost
          type="button"
          aria-expanded={composing}
          data-testid="behaviorlens-workspace-mention-reply"
          onClick={() => (composing ? close() : openComposer())}
        >
          Reply
        </PaneGhost>
        {ownsNote && (confirmingNote ? (
          <>
            <PaneGhost
              type="button"
              disabled={pending}
              data-testid="behaviorlens-workspace-note-delete-confirm"
              onClick={removeNote}
            >
              Delete note
            </PaneGhost>
            <PaneGhost
              type="button"
              data-testid="behaviorlens-workspace-note-delete-cancel"
              onClick={() => setConfirmingNote(false)}
            >
              Cancel
            </PaneGhost>
          </>
        ) : (
          <>
            <PaneGhost
              type="button"
              data-testid="behaviorlens-workspace-note-edit"
              onClick={startNoteEdit}
            >
              Edit
            </PaneGhost>
            <PaneGhost
              type="button"
              data-testid="behaviorlens-workspace-note-delete"
              onClick={() => setConfirmingNote(true)}
            >
              Delete
            </PaneGhost>
          </>
        ))}
      </MentionBannerActions>
      )}

      {replies.length > 0 && (
        <MentionBannerThread data-testid="behaviorlens-workspace-mention-thread">
          {replies.map(reply => {
            const editing = editingId === reply.id;
            const confirming = confirmingId === reply.id;

            if (editing) {
              return (
                <MentionBannerReply key={reply.id}>
                  <MentionBannerReplyAvatar aria-hidden="true">
                    {reply.isCurrentUser ? 'You' : reply.author?.slice(0, 2).toUpperCase()}
                  </MentionBannerReplyAvatar>
                  <MentionBannerReplyBody>
                    <MentionComposerTextarea
                      autoFocus
                      value={editDraft}
                      aria-label="Edit your reply"
                      data-testid="behaviorlens-workspace-reply-edit-input"
                      onChange={event => setEditDraft(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Escape') cancelEdit();
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          saveEdit(reply.id);
                        }
                      }}
                    />
                    <MentionComposerActions>
                      <MentionSendButton
                        type="button"
                        disabled={!editDraft.trim() || pending}
                        data-testid="behaviorlens-workspace-reply-edit-save"
                        onClick={() => saveEdit(reply.id)}
                      >
                        Save
                      </MentionSendButton>
                      <PaneGhost type="button" onClick={cancelEdit}>Cancel</PaneGhost>
                    </MentionComposerActions>
                  </MentionBannerReplyBody>
                </MentionBannerReply>
              );
            }

            return (
              <MentionBannerReply key={reply.id}>
                <MentionBannerReplyAvatar aria-hidden="true">
                  {reply.isCurrentUser ? 'You' : reply.author?.slice(0, 2).toUpperCase()}
                </MentionBannerReplyAvatar>
                <MentionBannerReplyBody>
                  {reply.replyTo && (
                    <MentionBannerReplyContext>
                      <MentionBannerReplyMeta>
                        {`Replying to @${reply.replyTo.username}`}
                      </MentionBannerReplyMeta>
                      <div>{reply.replyTo.text}</div>
                    </MentionBannerReplyContext>
                  )}
                  <MentionBannerReplyHeader>
                    <MentionBannerReplyMeta>
                      {reply.isCurrentUser ? 'You' : reply.author}
                    </MentionBannerReplyMeta>
                    <MentionBannerAge dateTime={reply.createdAt} title={formatDateTime(reply.createdAt)}>
                      {formatRelativeTime(reply.createdAt)}
                    </MentionBannerAge>
                    {reply.editedAt && <MentionBannerReplyEdited>· edited</MentionBannerReplyEdited>}
                  </MentionBannerReplyHeader>
                  <MentionBannerReplyText>{reply.text}</MentionBannerReplyText>
                  <MentionBannerReplyRow>
                    <MentionBannerReplyActions>
                      {confirming ? (
                        <>
                          <MentionBannerReplyAction
                            type="button"
                            $danger
                            data-testid="behaviorlens-workspace-reply-delete-confirm"
                            disabled={pending}
                            onClick={() => removeReply(reply)}
                          >
                            Delete reply
                          </MentionBannerReplyAction>
                          <MentionBannerReplyAction
                            type="button"
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancel
                          </MentionBannerReplyAction>
                        </>
                      ) : (
                        <>
                          <MentionBannerReplyAction
                            type="button"
                            data-testid={`behaviorlens-workspace-reply-to-${reply.id}`}
                            onClick={() => openComposer(reply)}
                          >
                            Reply
                          </MentionBannerReplyAction>
                          {reply.isCurrentUser && (
                          <MentionBannerReplyAction
                            type="button"
                            data-testid="behaviorlens-workspace-reply-edit"
                            onClick={() => startEdit(reply)}
                          >
                            Edit
                          </MentionBannerReplyAction>
                          )}
                          {reply.isCurrentUser && (
                          <MentionBannerReplyAction
                            type="button"
                            $danger
                            data-testid="behaviorlens-workspace-reply-delete"
                            onClick={() => setConfirmingId(reply.id)}
                          >
                            Delete
                          </MentionBannerReplyAction>
                          )}
                        </>
                      )}
                    </MentionBannerReplyActions>
                  </MentionBannerReplyRow>
                </MentionBannerReplyBody>
              </MentionBannerReply>
            );
          })}
        </MentionBannerThread>
      )}

      {deleted && (
        <MentionBannerUndo role="status" data-testid="behaviorlens-workspace-reply-deleted">
          Reply deleted.
          <MentionBannerUndoAction
            type="button"
            disabled={pending}
            data-testid="behaviorlens-workspace-reply-undo"
            onClick={undoDelete}
          >
            Undo
          </MentionBannerUndoAction>
        </MentionBannerUndo>
      )}

      {composing && (
        <MentionBannerComposer>
          {replyingTo && (
            <MentionComposerHint>
              {replyingTo.isCurrentUser
                ? `Replying to your reply: ${replyingTo.text}`
                : `Replying to @${replyingTo.username}: ${replyingTo.text}`}
            </MentionComposerHint>
          )}
          <MentionComposerTextarea
            autoFocus
            value={draft}
            aria-label={`Reply to ${inbox ? item.author?.name : 'your note'}`}
            placeholder="Write a reply. It lands on the note itself too."
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                close();
              }
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                send();
              }
            }}
          />
          <MentionComposerActions>
            <MentionSendButton
              type="button"
              disabled={!draft.trim() || pending}
              data-testid="behaviorlens-workspace-mention-send"
              onClick={send}
            >
              <IconPaperPlaneFilled aria-hidden="true" />
              Send reply
            </MentionSendButton>
            <PaneGhost type="button" onClick={close}>Cancel</PaneGhost>
            <MentionComposerHint>⌘ + Enter to send</MentionComposerHint>
          </MentionComposerActions>
        </MentionBannerComposer>
      )}
      {actionError && <MentionComposerHint role="alert">{actionError}</MentionComposerHint>}
    </MentionBanner>
  );
};

SharedMentionBanner.propTypes = {
  item: PropTypes.shape({
    author: PropTypes.object,
    contextLabel: PropTypes.string,
    createdAt: PropTypes.string,
    id: PropTypes.string,
    message: PropTypes.string,
    offsetSeconds: PropTypes.number
  }).isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onDeleteReply: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
  onEditReply: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
  onRestoreReply: PropTypes.func.isRequired,
  replies: PropTypes.array
};

export default SharedMentionBanner;
