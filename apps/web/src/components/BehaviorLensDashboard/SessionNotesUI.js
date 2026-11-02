import React, {
  useCallback, useLayoutEffect, useRef, useState
} from 'react';
import { flushSync } from 'react-dom';
import PropTypes from 'prop-types';
import {
  Alert,
  Avatar,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Loader
} from '../../ui';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import {
  formatSessionNoteDate,
  isSessionNoteOwner,
  MAX_SESSION_NOTE_LENGTH
} from './useSessionReviewMetadata';
import {
  formatRelativeTime,
  formatReplayTimestamp,
  parseBehaviorLensNoteTimestamps
} from './behaviorLensNoteTimestamps';
import { renderReviewerMentions } from './behaviorLensNoteMentions';
import { SESSION_TAG_PRESENTATION } from './behaviorLensSessionTags';
import {
  NOTE_TAG_PRESENTATION,
  SavedNoteTagPill
} from './ScBehaviorLensSessionPopovers';
import {
  EditNoteForm,
  EditNoteTextarea,
  MentionEmpty,
  MentionList,
  MentionOption,
  MentionOptionName,
  NoteComposer,
  NoteComposerActions,
  NotesList,
  SessionNotesRailListFrame
} from './ScBehaviorLensSessionNotesComposer';
import {
  CollapsibleSessionText,
  NoteAuthor,
  NoteAvatar,
  NoteBody,
  NoteDate,
  NoteEntry,
  NoteHeader,
  NoteItem,
  NotePrimaryContent,
  NoteTagList,
  NoteThreadStack,
  NoteTimestampButton,
  OverflowMenuPosition,
  ReviewActionError,
  ReviewLoading
} from './ScBehaviorLensSessionNotesThread';
import {
  actionsMenuBelongsToNote,
  CommentActionsMenu,
  focusTextareaAtEnd,
  noteActionsMenuId,
  noteEditComposerId
} from './sessionNoteThreadHelpers';
import {
  findMentionUser,
  getMentionInitials,
  getVisibleAuthor,
  useReviewerMentionAutocomplete
} from './SessionNoteComposer';
import SessionNoteThread from './SessionNoteThread';

export {
  NoteComposerActions,
  ReviewActionError,
  ReviewLoading,
  SessionNotesRailListFrame
};
export {
  getActiveNoteMention,
  SessionNoteComposer,
  useReviewMentionUsers
} from './SessionNoteComposer';

export const SessionNotesList = ({
  activityOnly,
  controller,
  currentUsername,
  highlightedNoteId,
  highlightedReplyId,
  mentionUsers,
  mentionUsersLoading,
  notes: notesOverride,
  originInboxItemId,
  onReplyCreate,
  onReplyCountChange,
  onReplyComposerOpen,
  onScrollToReplay,
  onSeekReplay,
  onTimestampNavigate,
  onTargetReplyDelete,
  onTargetReplyUpdate,
  replayDurationMs,
  replayReady,
  scrollTargetReplies,
  targetNoteId,
  targetReplyId,
  variant
}) => {
  const {
    cancelEditingNote,
    editError,
    editingNoteId,
    editText,
    notes: controllerNotes,
    openDeleteNote,
    saveEditedNote,
    setEditError,
    setEditText,
    startEditingNote,
    updatingNoteId
  } = controller;
  const notes = Array.isArray(notesOverride) ? notesOverride : controllerNotes;
  const isRail = variant === 'rail';
  const editTextareaRef = useRef(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const activeMenuIdRef = useRef(null);
  const [activeComposerId, setActiveComposerId] = useState(null);
  const handleActiveMenuChange = useCallback(menuId => {
    activeMenuIdRef.current = menuId;
    setActiveMenuId(menuId);
  }, []);
  const handleActionsRowEnter = useCallback(menuId => {
    const previousMenuId = activeMenuIdRef.current;
    if (!previousMenuId || previousMenuId === menuId) return;

    flushSync(() => handleActiveMenuChange(null));
    const previousTrigger = Array.from(
      document.querySelectorAll('[data-comment-actions-menu-id]')
    ).find(trigger => trigger.dataset.commentActionsMenuId === previousMenuId);
    previousTrigger?.blur?.();
  }, [handleActiveMenuChange]);
  const editNoteMentionAutocomplete = useReviewerMentionAutocomplete({
    maxLengthError: `Notes can contain at most ${MAX_SESSION_NOTE_LENGTH} characters.`,
    mentionUsers,
    onError: setEditError,
    onValueChange: setEditText,
    textareaRef: editTextareaRef,
    value: editText
  });
  const closeEditNoteMentionAutocomplete = editNoteMentionAutocomplete.close;

  const claimComposer = useCallback(id => {
    setActiveComposerId(id);
    onReplyComposerOpen();
    if (!String(id).startsWith('edit-note:')) {
      closeEditNoteMentionAutocomplete();
      cancelEditingNote();
    }
  }, [cancelEditingNote, closeEditNoteMentionAutocomplete, onReplyComposerOpen]);

  const beginEditNote = useCallback(note => {
    closeEditNoteMentionAutocomplete();
    claimComposer(noteEditComposerId(note.id));
    startEditingNote(note);
  }, [claimComposer, closeEditNoteMentionAutocomplete, startEditingNote]);

  useLayoutEffect(() => {
    if (editingNoteId == null) return;
    return focusTextareaAtEnd(editTextareaRef.current);
  }, [editingNoteId]);

  const renderTimestamp = (offsetMs, text, key) => {
    const canSeekToTimestamp = replayReady;
    const targetOffset = Math.min(offsetMs, replayDurationMs);
    const label = `Jump replay to ${formatReplayTimestamp(offsetMs)}`;
    return (
      <NoteTimestampButton
        key={key}
        type="button"
        disabled={!canSeekToTimestamp}
        aria-label={label}
        onClick={() => {
          if (!canSeekToTimestamp) {
            return;
          }
          onScrollToReplay();
          // shouldPlay=false: the replay holds on the target frame so the
          // reviewer can inspect that exact moment.
          onSeekReplay(targetOffset, false);
          if (typeof onTimestampNavigate === 'function') {
            onTimestampNavigate(targetOffset);
          }
        }}
      >
        {text}
      </NoteTimestampButton>
    );
  };

  const renderNoteText = text => parseBehaviorLensNoteTimestamps(text).map((token, index) => {
    if (token.type === 'text') {
      return (
        <React.Fragment key={`${index}-${token.text}`}>
          {renderReviewerMentions(token.text, mentionUsers, `note-${index}`)}
        </React.Fragment>
      );
    }
    return renderTimestamp(token.offsetMs, token.text, `${index}-${token.text}`);
  });

  return (
    <>
      {notes.length === 0 ? (
        <ReviewLoading>
          No notes for this session yet.
        </ReviewLoading>
      ) : (
        <NotesList $rail={isRail} aria-label="Session notes">
          {notes.map(note => {
            const ownedByCurrentReviewer = isSessionNoteOwner(note, currentUsername);
            const editing = editingNoteId === note.id;
            const noteIsTarget = String(note.id) === String(targetNoteId);
            const noteIsHighlighted = String(note.id) === String(highlightedNoteId);
            const mainNoteIsHighlighted = noteIsHighlighted && highlightedReplyId == null;
            const targetIsReply = activityOnly
              && targetReplyId != null
              && noteIsTarget;
            const authorName = ownedByCurrentReviewer
              ? 'You'
              : getVisibleAuthor(mentionUsers, note.created_by);
            const author = findMentionUser(mentionUsers, note.created_by);
            return (
              <NoteItem
                key={note.id}
                $highlighted={mainNoteIsHighlighted}
                $rail={isRail}
                data-session-note-id={note.id}
                data-session-note-highlighted={isRail && mainNoteIsHighlighted
                  ? 'true'
                  : undefined}
                data-testid="behaviorlens-session-note"
                onPointerEnter={() => {
                  if (!actionsMenuBelongsToNote(activeMenuId, note.id)) {
                    handleActionsRowEnter(noteActionsMenuId(note.id));
                  }
                }}
              >
                <NoteEntry $rail={isRail} $replyOnly={targetIsReply}>
                  {isRail && !targetIsReply && (
                    <NoteAvatar
                      img={author?.avatar || undefined}
                      initials={getMentionInitials(authorName) || 'JS'}
                      alt={authorName}
                      size="x-small"
                      variant="filled"
                    />
                  )}
                  <NoteBody
                    $rail={isRail}
                  >
                    <NoteThreadStack>
                      <SessionNoteThread
                        activeMenuId={activeMenuId}
                        activityOnly={activityOnly}
                        noteId={note.id}
                        noteAuthor={note.created_by}
                        currentUsername={currentUsername}
                        enabled={!editing || targetIsReply}
                        highlighted={!isRail && mainNoteIsHighlighted}
                        highlightedReplyId={noteIsHighlighted ? highlightedReplyId : null}
                        mentionUsers={mentionUsers}
                        mentionUsersLoading={mentionUsersLoading}
                        originInboxItemId={originInboxItemId}
                        activeComposerId={activeComposerId}
                        onActiveMenuChange={handleActiveMenuChange}
                        onActionsRowEnter={handleActionsRowEnter}
                        onClaimComposer={claimComposer}
                        onReplyCreate={onReplyCreate}
                        onReplyCountChange={onReplyCountChange}
                        onReplyComposerOpen={onReplyComposerOpen}
                        onTargetReplyDelete={onTargetReplyDelete}
                        onTargetReplyUpdate={onTargetReplyUpdate}
                        expandReplies={String(note.id) === String(targetNoteId)}
                        scrollReplies={scrollTargetReplies
                        && String(note.id) === String(targetNoteId)}
                        targetReplyId={String(note.id) === String(targetNoteId)
                          ? targetReplyId
                          : null}
                        variant={variant}
                      >
                        <NotePrimaryContent
                          $hasMenu={ownedByCurrentReviewer && !editing}
                          onPointerEnter={() => handleActionsRowEnter(noteActionsMenuId(note.id))}
                        >
                          {!targetIsReply && ownedByCurrentReviewer && !editing && (
                          <OverflowMenuPosition $rail={isRail}>
                            <CommentActionsMenu
                              activeMenuId={activeMenuId}
                              rail={isRail}
                              label="More note actions"
                              menuId={noteActionsMenuId(note.id)}
                              onActiveMenuChange={handleActiveMenuChange}
                              onEdit={() => beginEditNote(note)}
                              onDelete={() => {
                                onReplyComposerOpen();
                                openDeleteNote(note);
                              }}
                            />
                          </OverflowMenuPosition>
                          )}
                          {!targetIsReply && (
                          <NoteHeader $rail={isRail}>
                            <NoteAuthor $rail={isRail}>{authorName}</NoteAuthor>
                            <NoteDate
                              $rail={isRail}
                              title={formatSessionNoteDate(note.created_at)}
                            >
                              {formatRelativeTime(note.created_at)}
                              {note.updated_at !== note.created_at ? ' · Edited' : ''}
                            </NoteDate>
                          </NoteHeader>
                          )}

                          {!targetIsReply && (editing ? (
                            <EditNoteForm $rail={isRail} onSubmit={saveEditedNote}>
                              <FormControl
                                id={`behaviorlens-edit-session-note-${note.id}`}
                                colorStyle={editError ? 'error' : 'default'}
                              >
                                {!isRail && <FormLabel>Edit note</FormLabel>}
                                <NoteComposer
                                  $elevated={Boolean(editNoteMentionAutocomplete.mention)}
                                >
                                  <EditNoteTextarea
                                    ref={editTextareaRef}
                                    $rail={isRail}
                                    value={editText}
                                    rows={3}
                                    resize={isRail ? 'none' : 'vertical'}
                                    disabled={updatingNoteId === note.id}
                                    aria-label={isRail ? 'Edit note' : undefined}
                                    aria-describedby={editError ? `behaviorlens-edit-session-note-${note.id}-error` : undefined}
                                    aria-autocomplete="list"
                                    aria-controls={editNoteMentionAutocomplete.mention
                                      ? `behaviorlens-edit-note-mention-list-${note.id}`
                                      : undefined}
                                    aria-expanded={Boolean(editNoteMentionAutocomplete.mention)}
                                    onChange={event => {
                                      setEditText(event.target.value);
                                      setEditError('');
                                      editNoteMentionAutocomplete.update(
                                        event.target.value,
                                        event.target.selectionStart
                                      );
                                    }}
                                    onClick={event => editNoteMentionAutocomplete.update(
                                      event.currentTarget.value,
                                      event.currentTarget.selectionStart
                                    )}
                                    onKeyDown={editNoteMentionAutocomplete.onKeyDown}
                                  />
                                  {editNoteMentionAutocomplete.mention && (
                                  <MentionList
                                    contentKey={[
                                      editNoteMentionAutocomplete.mention.query,
                                      mentionUsersLoading,
                                      editNoteMentionAutocomplete.filteredUsers.length
                                    ].join(':')}
                                    id={`behaviorlens-edit-note-mention-list-${note.id}`}
                                    role="listbox"
                                  >
                                    {mentionUsersLoading && (
                                    <MentionEmpty>Loading reviewers...</MentionEmpty>
                                    )}
                                    {!mentionUsersLoading
                                  && editNoteMentionAutocomplete.filteredUsers.length === 0 && (
                                  <MentionEmpty>No reviewers found</MentionEmpty>
                                    )}
                                    {!mentionUsersLoading
                                  && editNoteMentionAutocomplete.filteredUsers.map((user, index) => (
                                    <MentionOption
                                      key={user.email || user.username}
                                      type="button"
                                      role="option"
                                      aria-selected={index
                                      === editNoteMentionAutocomplete.activeMentionIndex}
                                      $active={index
                                      === editNoteMentionAutocomplete.activeMentionIndex}
                                      onMouseDown={event => event.preventDefault()}
                                      onClick={() => editNoteMentionAutocomplete.select(user)}
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
                                {!isRail && (
                                <FormHelperText>
                                  {`${Array.from(editText).length}/${MAX_SESSION_NOTE_LENGTH} characters`}
                                </FormHelperText>
                                )}
                                {editError && (
                                <ReviewActionError
                                  id={`behaviorlens-edit-session-note-${note.id}-error`}
                                  role="alert"
                                >
                                  {editError}
                                </ReviewActionError>
                                )}
                              </FormControl>
                              <NoteComposerActions $rail={isRail}>
                                <Button
                                  type="button"
                                  size="small"
                                  colorStyle="secondary"
                                  variant={isRail ? 'ghost' : 'outline'}
                                  disabled={updatingNoteId === note.id}
                                  onClick={() => {
                                    editNoteMentionAutocomplete.close();
                                    cancelEditingNote();
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  size="small"
                                  colorStyle="primary"
                                  variant="filled"
                                  loader={updatingNoteId === note.id}
                                  loaderText="Saving..."
                                >
                                  Save
                                </Button>
                              </NoteComposerActions>
                            </EditNoteForm>
                          ) : (
                            <>
                              <CollapsibleSessionText
                                clamp={!activityOnly}
                                contentKey={`${note.updated_at || note.created_at}-${note.text}`}
                                rail={isRail}
                              >
                                {Number.isFinite(Number(note.replay_time_ms)) && Number(note.replay_time_ms) >= 0 && (
                                  <>
                                    {renderTimestamp(
                                      Number(note.replay_time_ms),
                                      formatReplayTimestamp(note.replay_time_ms),
                                      `moment-${note.id}`
                                    )}
                                    {note.text ? ' ' : null}
                                  </>
                                )}
                                {renderNoteText(note.text)}
                              </CollapsibleSessionText>
                              {Array.isArray(note.tags) && note.tags.length > 0 && (
                                <NoteTagList aria-label="Moment tags">
                                  {note.tags.map(tag => (
                                    <SavedNoteTagPill
                                      key={tag}
                                      $presentation={NOTE_TAG_PRESENTATION[tag] || {
                                        background: '#f1f2f5',
                                        border: '#d9dbe1',
                                        color: '#6f76a7',
                                        label: SESSION_TAG_PRESENTATION[tag]?.label || tag
                                      }}
                                    >
                                      {NOTE_TAG_PRESENTATION[tag]?.label
                                        || SESSION_TAG_PRESENTATION[tag]?.label
                                        || tag}
                                    </SavedNoteTagPill>
                                  ))}
                                </NoteTagList>
                              )}
                            </>
                          ))}
                        </NotePrimaryContent>
                      </SessionNoteThread>
                    </NoteThreadStack>
                  </NoteBody>
                </NoteEntry>
              </NoteItem>
            );
          })}
        </NotesList>
      )}

    </>
  );
};

SessionNotesList.propTypes = {
  activityOnly: PropTypes.bool,
  controller: PropTypes.object.isRequired,
  currentUsername: PropTypes.string,
  highlightedNoteId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  highlightedReplyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mentionUsers: PropTypes.array,
  mentionUsersLoading: PropTypes.bool,
  notes: PropTypes.array,
  originInboxItemId: PropTypes.string,
  onReplyCreate: PropTypes.func,
  onReplyCountChange: PropTypes.func,
  onReplyComposerOpen: PropTypes.func,
  onScrollToReplay: PropTypes.func,
  onSeekReplay: PropTypes.func,
  onTimestampNavigate: PropTypes.func,
  onTargetReplyDelete: PropTypes.func,
  onTargetReplyUpdate: PropTypes.func,
  replayDurationMs: PropTypes.number,
  replayReady: PropTypes.bool,
  scrollTargetReplies: PropTypes.bool,
  targetNoteId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  targetReplyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  variant: PropTypes.oneOf(['default', 'rail'])
};

SessionNotesList.defaultProps = {
  activityOnly: false,
  currentUsername: '',
  highlightedNoteId: null,
  highlightedReplyId: null,
  mentionUsers: [],
  mentionUsersLoading: false,
  notes: null,
  originInboxItemId: null,
  onReplyCreate: () => {},
  onReplyCountChange: () => {},
  onReplyComposerOpen: () => {},
  onScrollToReplay: () => {},
  onSeekReplay: () => false,
  onTimestampNavigate: undefined,
  onTargetReplyDelete: () => {},
  onTargetReplyUpdate: () => {},
  replayDurationMs: 0,
  replayReady: false,
  scrollTargetReplies: false,
  targetNoteId: null,
  targetReplyId: null,
  variant: 'default'
};

// Rendered once, high in the tree, and deliberately NOT inside the Note &
// Share popover: Magnet's Dialog portals to document.body, so a dialog owned
// by the popover was torn down by the popover's own outside-click handler the
// moment the user pressed Delete Note.
export const SessionNoteDeleteDialog = ({ controller }) => {
  const {
    closeDeleteNote,
    confirmDeleteNote,
    deleteError,
    deletingNoteId,
    notePendingDelete
  } = controller;

  return (
    <ConfirmationDialog
      isOpen={Boolean(notePendingDelete)}
      isConfirming={deletingNoteId !== null}
      showCloseButton={false}
      title="Delete note?"
      description="This note will be removed from the session for every reviewer."
      footer={deleteError ? <ReviewActionError role="alert">{deleteError}</ReviewActionError> : null}
      confirmText="Delete Note"
      confirmLoadingText="Deleting..."
      confirmButtonProps={{ colorStyle: 'error' }}
      onCancel={closeDeleteNote}
      onConfirm={confirmDeleteNote}
    />
  );
};

SessionNoteDeleteDialog.propTypes = {
  controller: PropTypes.object.isRequired
};

// Shared loading/error wrapper so the panel and popover surface identical
// notes states.
export const SessionNotesStateGate = ({ children, controller }) => {
  const { loadNotes, notesError, notesLoading } = controller;

  if (notesLoading) {
    return (
      <ReviewLoading role="status">
        <Loader size="small" />
        <span>Loading notes...</span>
      </ReviewLoading>
    );
  }
  if (notesError) {
    return (
      <>
        <Alert
          compact
          colorStyle="error"
          title="Notes unavailable"
          description={notesError}
        />
        <NoteComposerActions>
          <Button
            type="button"
            size="small"
            colorStyle="secondary"
            variant="outline"
            onClick={loadNotes}
          >
            Retry
          </Button>
        </NoteComposerActions>
      </>
    );
  }
  return children;
};

SessionNotesStateGate.propTypes = {
  children: PropTypes.node,
  controller: PropTypes.object.isRequired
};
