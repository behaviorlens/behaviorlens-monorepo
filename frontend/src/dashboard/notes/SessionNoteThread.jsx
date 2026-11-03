import React, {
  useCallback, useEffect, useLayoutEffect, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import { Avatar, Button, ConfirmationDialog } from '../../ui';
import {
  IconAngleDown,
  IconTurnArrowLeftFilled
} from '../../ui/icons';
import { createNoteReply, deleteNoteReply, listNoteReplies, replaceNoteReply } from '../../services/BehaviorLensService';
import {
  formatSessionNoteDate
} from '../review/useSessionReviewMetadata';
import { formatRelativeTime } from '../shared/behaviorLensNoteTimestamps';
import { renderReviewerMentions } from './behaviorLensNoteMentions';
import {
  EditNoteForm,
  EditNoteTextarea,
  MentionEmpty,
  MentionList,
  MentionOption,
  MentionOptionName,
  NoteComposer,
  NoteComposerActions
} from './ScBehaviorLensSessionNotesComposer';
import {
  CollapsibleSessionText,
  NoteActions,
  NoteHighlightSurface,
  OverflowMenuPosition,
  ReplyActions,
  ReplyAvatar,
  ReplyBody,
  ReplyComposer,
  ReplyComposerTextarea,
  ReplyDate,
  ReplyHeader,
  ReplyMeta,
  ReplyPrimaryContent,
  ReplyRow,
  RepliesConnector,
  RepliesToggle,
  RepliesToggleRow,
  ReplyThread,
  ReplyThreadFade,
  ReplyThreadFrame,
  ReviewActionError,
  ReviewLoading
} from './ScBehaviorLensSessionNotesThread';
import {
  editReplyComposerId,
  focusTextareaAtEnd,
  getActivityReplies,
  getThreadComposerId,
  noteReplyComposerId,
  replyActionsMenuId,
  replyToReplyComposerId,
  sortRepliesForDisplay,
  stripAutomaticReplyMention,
  addAutomaticReplyMention
} from './sessionNoteThreadHelpers';
import CommentActionsMenu from './CommentActionsMenu';
import {
  findMentionUser,
  getMentionInitials,
  getVisibleAuthor,
  useReviewerMentionAutocomplete
} from './SessionNoteComposer';
import useScrollEdgeFades from '../shared/useScrollEdgeFades';
import { EMPTY_ARRAY, NOOP } from '../../lib/propDefaults';

const useSessionNoteThreadState = () => {
  const replyTextareaRef = useRef(null);
  const editReplyTextareaRef = useRef(null);
  const replyThreadRef = useRef(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmingReplyId, setConfirmingReplyId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [repliesExpanded, setRepliesExpanded] = useState(false);

  return {
    actionError,
    composing,
    confirmingReplyId,
    draft,
    editingId,
    editDraft,
    editReplyTextareaRef,
    loading,
    pending,
    replies,
    repliesExpanded,
    replyingTo,
    replyTextareaRef,
    replyThreadRef,
    setActionError,
    setComposing,
    setConfirmingReplyId,
    setDraft,
    setEditingId,
    setEditDraft,
    setLoading,
    setPending,
    setReplies,
    setRepliesExpanded,
    setReplyingTo
  };
};

const SessionNoteThread = ({
  activeComposerId = null,
  activeMenuId = null,
  activityOnly = false,
  children,
  currentUsername = '',
  enabled = true,
  highlighted = false,
  highlightedReplyId = null,
  originInboxItemId = null,
  mentionUsers = EMPTY_ARRAY,
  mentionUsersLoading = false,
  noteAuthor,
  noteId,
  onActiveMenuChange = NOOP,
  onActionsRowEnter = NOOP,
  onClaimComposer = NOOP,
  onReplyCreate = NOOP,
  onReplyCountChange = NOOP,
  onReplyComposerOpen = NOOP,
  onTargetReplyDelete = NOOP,
  onTargetReplyUpdate = NOOP,
  expandReplies = false,
  scrollReplies = false,
  targetReplyId = null,
  variant = 'default'
}) => {
  const {
    actionError,
    composing,
    confirmingReplyId,
    draft,
    editingId,
    editDraft,
    editReplyTextareaRef,
    loading,
    pending,
    replies,
    repliesExpanded,
    replyingTo,
    replyTextareaRef,
    replyThreadRef,
    setActionError,
    setComposing,
    setConfirmingReplyId,
    setDraft,
    setEditingId,
    setEditDraft,
    setLoading,
    setPending,
    setReplies,
    setRepliesExpanded,
    setReplyingTo
  } = useSessionNoteThreadState();
  const isRail = variant === 'rail';
  const displayedReplies = activityOnly
    ? getActivityReplies(replies, targetReplyId, originInboxItemId)
    : replies;
  const hasActivityReplies = activityOnly && displayedReplies.some(reply => (
    targetReplyId == null || String(reply.id) !== String(targetReplyId)
  ));
  const replyMentionUsername = replyingTo?.created_by || noteAuthor;
  const replyMentionPrefix = replyMentionUsername ? `@${replyMentionUsername} ` : '';
  const replyValue = `${replyMentionPrefix}${draft}`;
  const replyMentionAutocomplete = useReviewerMentionAutocomplete({
    mentionUsers,
    onError: setActionError,
    onValueChange: value => setDraft(value.slice(replyMentionPrefix.length)),
    textareaRef: replyTextareaRef,
    value: replyValue
  });
  const editMentionAutocomplete = useReviewerMentionAutocomplete({
    mentionUsers,
    onError: setActionError,
    onValueChange: setEditDraft,
    textareaRef: editReplyTextareaRef,
    value: editDraft
  });
  const {
    fadeBottom: replyFadeBottom,
    fadeTop: replyFadeTop,
    scrollRef: replyScrollRef
  } = useScrollEdgeFades(`${noteId}:${loading}:${replies.length}:${repliesExpanded}`);
  const setReplyThreadRef = useCallback(node => {
    replyThreadRef.current = node;
    if (scrollReplies) replyScrollRef(node);
  }, [replyScrollRef, scrollReplies]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setLoading(true);
    setActionError('');
    listNoteReplies(noteId).then(content => {
      if (active) {
        setReplies(sortRepliesForDisplay(Array.isArray(content?.items) ? content.items : []));
      }
    }).catch(error => {
      if (active) {
        setActionError(error?.message || 'Replies could not be loaded.');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [enabled, noteId]);

  useLayoutEffect(() => {
    if (activityOnly || expandReplies || scrollReplies) {
      setRepliesExpanded(true);
    }
  }, [activityOnly, expandReplies, scrollReplies]);

  useEffect(() => {
    if (loading || activityOnly) return;
    onReplyCountChange(noteId, replies.length);
  }, [activityOnly, loading, noteId, onReplyCountChange, replies.length]);

  useEffect(() => {
    if (loading || targetReplyId == null) return;
    if (replies.some(reply => String(reply.id) === String(targetReplyId))) {
      setRepliesExpanded(true);
    }
  }, [loading, replies, targetReplyId]);

  useLayoutEffect(() => {
    if (!repliesExpanded || targetReplyId == null) return undefined;
    const frame = requestAnimationFrame(() => {
      const target = Array.from(
        replyThreadRef.current?.querySelectorAll('[data-session-reply-id]') || []
      ).find(node => (
        String(node.getAttribute('data-session-reply-id')) === String(targetReplyId)
      ));
      target?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [replies, repliesExpanded, targetReplyId]);

  useLayoutEffect(() => {
    if (editingId == null) return;
    return focusTextareaAtEnd(editReplyTextareaRef.current);
  }, [editingId]);

  useEffect(() => {
    const currentId = getThreadComposerId(noteId, { composing, editingId, replyingTo });
    if (activeComposerId == null || currentId == null || currentId === activeComposerId) return;
    setComposing(false);
    setReplyingTo(null);
    setDraft('');
    setEditingId(null);
    setEditDraft('');
  }, [activeComposerId, composing, editingId, noteId, replyingTo]);

  const displayName = username => getVisibleAuthor(mentionUsers, username);

  const closeReplyComposer = () => {
    replyMentionAutocomplete.close();
    setComposing(false);
    setReplyingTo(null);
    setDraft('');
  };

  const closeReplyEditor = () => {
    editMentionAutocomplete.close();
    setEditingId(null);
    setEditDraft('');
  };

  const openComposer = (target = null) => {
    const mentionPrefix = `@${target?.created_by || noteAuthor} `;
    onClaimComposer(target
      ? replyToReplyComposerId(noteId, target.id)
      : noteReplyComposerId(noteId));
    closeReplyEditor();
    setReplyingTo(target);
    setDraft('');
    setComposing(true);
    if (replies.length > 0) setRepliesExpanded(true);
    requestAnimationFrame(() => {
      const textarea = replyTextareaRef.current;
      textarea?.focus();
      textarea?.setSelectionRange(mentionPrefix.length, mentionPrefix.length);
    });
  };

  const beginEditReply = reply => {
    onClaimComposer(editReplyComposerId(noteId, reply.id));
    closeReplyComposer();
    setEditingId(reply.id);
    setEditDraft(stripAutomaticReplyMention(
      reply.text,
      reply.reply_to?.created_by || noteAuthor
    ));
  };

  const keepCaretAfterReplyMention = textarea => {
    if (!textarea || textarea.selectionStart >= replyMentionPrefix.length) return;
    textarea.setSelectionRange(
      replyMentionPrefix.length,
      Math.max(replyMentionPrefix.length, textarea.selectionEnd)
    );
  };

  const submitReply = async event => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setPending(true);
    setActionError('');
    try {
      const storedText = addAutomaticReplyMention(
        text,
        replyingTo?.created_by || noteAuthor
      );
      const createdReply = await createNoteReply(
        noteId,
        storedText,
        replyingTo?.id || null,
        originInboxItemId
      );
      const reply = replyingTo && !createdReply.reply_to
        ? {
          ...createdReply,
          reply_to: replyingTo,
          reply_to_id: replyingTo.id
        }
        : createdReply;
      setReplies(current => sortRepliesForDisplay([reply, ...current]));
      onReplyCreate(reply, replyingTo?.created_by || noteAuthor);
      setDraft('');
      setReplyingTo(null);
      setComposing(false);
      setRepliesExpanded(true);
    } catch (error) {
      setActionError(error?.message || 'The reply could not be added.');
    } finally {
      setPending(false);
    }
  };

  const saveReply = async replyId => {
    const text = editDraft.trim();
    if (!text || pending) return;
    const existingReply = replies.find(item => item.id === replyId);
    setPending(true);
    setActionError('');
    try {
      const storedText = addAutomaticReplyMention(
        text,
        existingReply?.reply_to?.created_by || noteAuthor
      );
      const updatedReply = await replaceNoteReply(noteId, replyId, storedText);
      const reply = existingReply?.reply_to && !updatedReply.reply_to
        ? {
          ...updatedReply,
          reply_to: existingReply.reply_to,
          reply_to_id: existingReply.reply_to_id || existingReply.reply_to.id
        }
        : updatedReply;
      setReplies(current => current.map(item => {
        if (item.id === replyId) return reply;
        if (item.reply_to?.id === replyId) {
          return { ...item, reply_to: { ...item.reply_to, text: reply.text } };
        }
        return item;
      }));
      onTargetReplyUpdate(reply);
      setEditingId(null);
      setEditDraft('');
    } catch (error) {
      setActionError(error?.message || 'The reply could not be updated.');
    } finally {
      setPending(false);
    }
  };

  const removeReply = async reply => {
    if (pending) return;
    setPending(true);
    setActionError('');
    try {
      await deleteNoteReply(noteId, reply.id);
      setReplies(current => current
        .filter(item => item.id !== reply.id)
        .map(item => (item.reply_to_id === reply.id
          ? { ...item, reply_to: null }
          : item)));
      setConfirmingReplyId(null);
      if (activityOnly) onTargetReplyDelete(reply.id);
    } catch (error) {
      setActionError(error?.message || 'The reply could not be deleted.');
    } finally {
      setPending(false);
    }
  };

  const renderReplyComposer = nested => (
    <ReplyComposer $nested={nested} $rail={isRail} onSubmit={submitReply}>
      <NoteComposer $elevated={Boolean(replyMentionAutocomplete.mention)}>
        <ReplyComposerTextarea
          ref={replyTextareaRef}
          $rail={isRail}
          autoFocus
          rows={2}
          resize={isRail ? 'none' : 'vertical'}
          value={replyValue}
          aria-label="Reply to note"
          aria-autocomplete="list"
          aria-controls={replyMentionAutocomplete.mention
            ? `behaviorlens-reply-mention-list-${noteId}`
            : undefined}
          aria-expanded={Boolean(replyMentionAutocomplete.mention)}
          disabled={pending}
          onChange={event => {
            if (!event.target.value.startsWith(replyMentionPrefix)) {
              requestAnimationFrame(() => keepCaretAfterReplyMention(replyTextareaRef.current));
              return;
            }
            setDraft(event.target.value.slice(replyMentionPrefix.length));
            replyMentionAutocomplete.update(
              event.target.value,
              event.target.selectionStart
            );
          }}
          onClick={event => {
            keepCaretAfterReplyMention(event.currentTarget);
            replyMentionAutocomplete.update(
              event.currentTarget.value,
              event.currentTarget.selectionStart
            );
          }}
          onFocus={event => keepCaretAfterReplyMention(event.currentTarget)}
          onSelect={event => keepCaretAfterReplyMention(event.currentTarget)}
          onKeyDown={replyMentionAutocomplete.onKeyDown}
        />
        {replyMentionAutocomplete.mention && (
          <MentionList
            contentKey={[
              replyMentionAutocomplete.mention.query,
              mentionUsersLoading,
              replyMentionAutocomplete.filteredUsers.length
            ].join(':')}
            id={`behaviorlens-reply-mention-list-${noteId}`}
            role="listbox"
          >
            {mentionUsersLoading && <MentionEmpty>Loading reviewers...</MentionEmpty>}
            {!mentionUsersLoading && replyMentionAutocomplete.filteredUsers.length === 0 && (
              <MentionEmpty>No reviewers found</MentionEmpty>
            )}
            {!mentionUsersLoading && replyMentionAutocomplete.filteredUsers.map((user, index) => (
              <MentionOption
                key={user.email || user.username}
                type="button"
                role="option"
                aria-selected={index === replyMentionAutocomplete.activeMentionIndex}
                $active={index === replyMentionAutocomplete.activeMentionIndex}
                onMouseDown={event => event.preventDefault()}
                onClick={() => replyMentionAutocomplete.select(user)}
              >
                <Avatar
                  aria-hidden="true"
                  img={user.avatar || undefined}
                  initials={getMentionInitials(user.name) || undefined}
                  size="2x-small"
                  variant="subtle"
                />
                <MentionOptionName>{user.name}</MentionOptionName>
              </MentionOption>
            ))}
          </MentionList>
        )}
      </NoteComposer>
      <ReplyActions $composer $rail={isRail}>
        <Button
          type="button"
          size="small"
          colorStyle="secondary"
          variant="ghost"
          disabled={pending}
          onClick={closeReplyComposer}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="small"
          colorStyle="primary"
          variant={isRail ? 'filled' : 'outline'}
          loader={pending}
          disabled={!draft.trim()}
        >
          {isRail ? 'Reply' : 'Send reply'}
        </Button>
      </ReplyActions>
    </ReplyComposer>
  );

  const noteHighlightSurface = (
    <NoteHighlightSurface
      $highlighted={highlighted}
      data-session-note-primary-id={noteId}
      data-session-note-highlighted={highlighted ? 'true' : undefined}
    >
      {children}
      {(!activityOnly || targetReplyId == null)
        && (!composing || Boolean(replyingTo)) && (
        <NoteActions $rail={isRail}>
          <Button
            type="button"
            size="small"
            colorStyle="secondary"
            variant="ghost"
            startIcon={isRail ? IconTurnArrowLeftFilled : undefined}
            data-testid="behaviorlens-note-reply"
            onClick={() => openComposer()}
          >
            Reply
          </Button>
        </NoteActions>
      )}
    </NoteHighlightSurface>
  );

  if (!enabled) return noteHighlightSurface;

  return (
    <>
      {noteHighlightSurface}
      {composing && !replyingTo && renderReplyComposer(false)}
      {loading && (!activityOnly || targetReplyId != null) && (
        <ReviewLoading>Loading replies...</ReviewLoading>
      )}
      {!loading && isRail && (
        (!activityOnly && replies.length > 0)
        || hasActivityReplies
        || (activityOnly && Boolean(replyingTo))
      ) && (
        <RepliesConnector
          $activityRoot={activityOnly && targetReplyId != null}
          aria-hidden="true"
        />
      )}
      {!loading && !activityOnly && replies.length > 0 && !repliesExpanded && (
        <RepliesToggleRow $rail={isRail}>
          <RepliesToggle
            $rail={isRail}
            type="button"
            aria-expanded={false}
            aria-controls={`behaviorlens-note-thread-${noteId}`}
            data-testid={`behaviorlens-note-replies-toggle-${noteId}`}
            onClick={() => setRepliesExpanded(true)}
          >
            {`${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            <IconAngleDown aria-hidden="true" />
          </RepliesToggle>
        </RepliesToggleRow>
      )}
      <ReplyThreadFrame $scrollReplies={scrollReplies}>
        <ReplyThread
          ref={setReplyThreadRef}
          $activityOnly={activityOnly && targetReplyId != null}
          $rail={isRail}
          $scrollReplies={scrollReplies}
          $visible={(loading && (!activityOnly || targetReplyId != null))
            || (repliesExpanded && displayedReplies.length > 0)
            || (composing && Boolean(replyingTo))
            || Boolean(actionError)}
          id={`behaviorlens-note-thread-${noteId}`}
          data-testid={`behaviorlens-note-thread-${noteId}`}
        >
          {!loading && repliesExpanded && displayedReplies.map((reply, replyIndex) => {
            const isTargetReply = highlightedReplyId != null
              && String(reply.id) === String(highlightedReplyId);
            const isActivityRoot = activityOnly
              && targetReplyId != null
              && String(reply.id) === String(targetReplyId);
            const isLastActivityChild = activityOnly
              && !isActivityRoot
              && replyIndex === displayedReplies.length - 1;
            const owner = reply.created_by === currentUsername;
            const editing = editingId === reply.id;
            const replyAuthor = owner ? 'You' : displayName(reply.created_by);
            const replyText = addAutomaticReplyMention(
              reply.text,
              reply.reply_to?.created_by || noteAuthor
            );
            const isReplyTarget = composing
            && String(replyingTo?.id) === String(reply.id);
            return (
              <React.Fragment key={reply.id}>
                <ReplyRow
                  $activityOnly={isActivityRoot}
                  $activityChild={activityOnly && targetReplyId != null && !isActivityRoot}
                  $editing={editing}
                  $highlighted={isTargetReply}
                  $lastActivityChild={isLastActivityChild}
                  $rail={isRail}
                  data-session-reply-id={reply.id}
                  data-session-reply-highlighted={isTargetReply ? 'true' : undefined}
                  onPointerEnter={() => onActionsRowEnter(replyActionsMenuId(noteId, reply.id))}
                >
                  <ReplyAvatar
                    $rail={isRail}
                    aria-hidden="true"
                    img={findMentionUser(mentionUsers, reply.created_by)?.avatar || undefined}
                    initials={getMentionInitials(replyAuthor) || 'JS'}
                    size={activityOnly ? 'x-small' : 'small'}
                    variant="filled"
                  />
                  <ReplyBody
                    $hasMenu={owner && !editing && confirmingReplyId !== reply.id}
                  >
                    {owner && !editing && confirmingReplyId !== reply.id && (
                    <OverflowMenuPosition $rail={isRail}>
                      <CommentActionsMenu
                        activeMenuId={activeMenuId}
                        rail={isRail}
                        label="More reply actions"
                        menuId={replyActionsMenuId(noteId, reply.id)}
                        editLabel={isRail ? 'Edit' : 'Edit reply'}
                        onActiveMenuChange={onActiveMenuChange}
                        onEdit={() => beginEditReply(reply)}
                        onDelete={() => {
                          onReplyComposerOpen();
                          setConfirmingReplyId(reply.id);
                        }}
                      />
                    </OverflowMenuPosition>
                    )}
                    <ReplyPrimaryContent>
                      <ReplyHeader $activityOnly={activityOnly} $rail={isRail}>
                        <ReplyMeta $rail={isRail}>{replyAuthor}</ReplyMeta>
                        <ReplyDate
                          $rail={isRail}
                          dateTime={reply.created_at}
                          title={formatSessionNoteDate(reply.created_at)}
                        >
                          {formatRelativeTime(reply.created_at)}
                          {reply.updated_at !== reply.created_at ? ' · Edited' : ''}
                        </ReplyDate>
                      </ReplyHeader>
                      {editing ? (
                        <EditNoteForm
                          $rail={isRail}
                          onSubmit={event => {
                            event.preventDefault();
                            saveReply(reply.id);
                          }}
                        >
                          <NoteComposer $elevated={Boolean(editMentionAutocomplete.mention)}>
                            <EditNoteTextarea
                              ref={editReplyTextareaRef}
                              $rail={isRail}
                              value={editDraft}
                              rows={3}
                              resize={isRail ? 'none' : 'vertical'}
                              aria-label="Edit reply"
                              aria-autocomplete="list"
                              aria-controls={editMentionAutocomplete.mention
                                ? `behaviorlens-edit-reply-mention-list-${reply.id}`
                                : undefined}
                              aria-expanded={Boolean(editMentionAutocomplete.mention)}
                              disabled={pending}
                              onChange={event => {
                                setEditDraft(event.target.value);
                                editMentionAutocomplete.update(
                                  event.target.value,
                                  event.target.selectionStart
                                );
                              }}
                              onClick={event => editMentionAutocomplete.update(
                                event.currentTarget.value,
                                event.currentTarget.selectionStart
                              )}
                              onKeyDown={editMentionAutocomplete.onKeyDown}
                            />
                            {editMentionAutocomplete.mention && (
                            <MentionList
                              contentKey={[
                                editMentionAutocomplete.mention.query,
                                mentionUsersLoading,
                                editMentionAutocomplete.filteredUsers.length
                              ].join(':')}
                              id={`behaviorlens-edit-reply-mention-list-${reply.id}`}
                              role="listbox"
                            >
                              {mentionUsersLoading && (
                                <MentionEmpty>Loading reviewers...</MentionEmpty>
                              )}
                              {!mentionUsersLoading
                                && editMentionAutocomplete.filteredUsers.length === 0 && (
                                <MentionEmpty>No reviewers found</MentionEmpty>
                              )}
                              {!mentionUsersLoading
                                && editMentionAutocomplete.filteredUsers.map((user, index) => (
                                  <MentionOption
                                    key={user.email || user.username}
                                    type="button"
                                    role="option"
                                    aria-selected={index
                                    === editMentionAutocomplete.activeMentionIndex}
                                    $active={index
                                    === editMentionAutocomplete.activeMentionIndex}
                                    onMouseDown={event => event.preventDefault()}
                                    onClick={() => editMentionAutocomplete.select(user)}
                                  >
                                    <Avatar
                                      aria-hidden="true"
                                      img={user.avatar || undefined}
                                      initials={getMentionInitials(user.name) || undefined}
                                      size="2x-small"
                                      variant="subtle"
                                    />
                                    <MentionOptionName>{user.name}</MentionOptionName>
                                  </MentionOption>
                                ))}
                            </MentionList>
                            )}
                          </NoteComposer>
                          <NoteComposerActions $rail={isRail}>
                            <Button
                              type="button"
                              size="small"
                              colorStyle="secondary"
                              variant={isRail ? 'ghost' : 'outline'}
                              disabled={pending}
                              onClick={closeReplyEditor}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              size="small"
                              colorStyle="primary"
                              variant="filled"
                              loader={pending}
                            >
                              Save
                            </Button>
                          </NoteComposerActions>
                        </EditNoteForm>
                      ) : (
                        <CollapsibleSessionText
                          clamp={!activityOnly}
                          contentKey={`${reply.updated_at || reply.created_at}-${replyText}`}
                          rail={isRail}
                          reply
                        >
                          {renderReviewerMentions(replyText, mentionUsers, `reply-${reply.id}`)}
                        </CollapsibleSessionText>
                      )}
                    </ReplyPrimaryContent>
                    {!editing && !isReplyTarget && (
                    <ReplyActions $comment $rail={isRail}>
                      <Button
                        type="button"
                        size="small"
                        colorStyle="secondary"
                        variant="ghost"
                        startIcon={isRail ? IconTurnArrowLeftFilled : undefined}
                        data-testid={`behaviorlens-note-reply-to-${reply.id}`}
                        disabled={pending}
                        onClick={() => openComposer(reply)}
                      >
                        Reply
                      </Button>
                      {!isRail && confirmingReplyId === reply.id && (
                      <>
                        <Button
                          data-destructive="true"
                          type="button"
                          size="small"
                          colorStyle="error"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => {
                            onReplyComposerOpen();
                            removeReply(reply);
                          }}
                        >
                          Delete reply
                        </Button>
                        <Button
                          type="button"
                          size="small"
                          colorStyle="secondary"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => setConfirmingReplyId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                      )}
                    </ReplyActions>
                    )}
                  </ReplyBody>
                </ReplyRow>
                {isReplyTarget && renderReplyComposer(true)}
              </React.Fragment>
            );
          })}
          {actionError && <ReviewActionError role="alert">{actionError}</ReviewActionError>}
          {!loading && !activityOnly && replies.length > 0 && repliesExpanded && (
          <RepliesToggleRow $rail={isRail} $threadEnd>
            <RepliesToggle
              $rail={isRail}
              type="button"
              aria-expanded={true}
              aria-controls={`behaviorlens-note-thread-${noteId}`}
              data-testid={`behaviorlens-note-replies-toggle-${noteId}`}
              onClick={() => setRepliesExpanded(false)}
            >
              Hide replies
              <IconAngleDown aria-hidden="true" />
            </RepliesToggle>
          </RepliesToggleRow>
          )}
        </ReplyThread>
        {scrollReplies && (
          <>
            <ReplyThreadFade aria-hidden="true" $edge="top" $opacity={replyFadeTop} />
            <ReplyThreadFade aria-hidden="true" $edge="bottom" $opacity={replyFadeBottom} />
          </>
        )}
      </ReplyThreadFrame>
      {isRail && (
        <ConfirmationDialog
          isOpen={Boolean(confirmingReplyId)}
          isConfirming={pending && confirmingReplyId !== null}
          showCloseButton={false}
          title="Delete reply?"
          description="This reply will be removed from the note for every reviewer."
          confirmText="Delete Reply"
          confirmLoadingText="Deleting..."
          confirmButtonProps={{ colorStyle: 'error' }}
          onCancel={() => setConfirmingReplyId(null)}
          onConfirm={() => {
            const reply = replies.find(item => item.id === confirmingReplyId);
            if (reply) removeReply(reply);
          }}
        />
      )}
    </>
  );
};

SessionNoteThread.propTypes = {
  activeComposerId: PropTypes.string,
  activeMenuId: PropTypes.string,
  activityOnly: PropTypes.bool,
  children: PropTypes.node.isRequired,
  currentUsername: PropTypes.string,
  enabled: PropTypes.bool,
  highlighted: PropTypes.bool,
  highlightedReplyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mentionUsers: PropTypes.array,
  mentionUsersLoading: PropTypes.bool,
  noteAuthor: PropTypes.string.isRequired,
  noteId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  originInboxItemId: PropTypes.string,
  onActiveMenuChange: PropTypes.func,
  onActionsRowEnter: PropTypes.func,
  onClaimComposer: PropTypes.func,
  onReplyCreate: PropTypes.func,
  onReplyCountChange: PropTypes.func,
  onReplyComposerOpen: PropTypes.func,
  onTargetReplyDelete: PropTypes.func,
  onTargetReplyUpdate: PropTypes.func,
  expandReplies: PropTypes.bool,
  scrollReplies: PropTypes.bool,
  targetReplyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  variant: PropTypes.oneOf(['default', 'rail'])
};

export default SessionNoteThread;

// The existing notes (view, seek-to-timestamp, owner edit/delete) shared by
// the rail panel and the Note & Share popover. One implementation, one
// delete-confirmation flow.
