import React, {
  useCallback, useEffect, useLayoutEffect, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import {
  Avatar,
  Button,
  FormControl,
  FormHelperText,
  FormLabel
} from '../../ui';
import { BEHAVIORLENS_SESSION_TAGS, listReviewUsers } from '../../services/BehaviorLensService';
import { MAX_SESSION_NOTE_LENGTH } from './useSessionReviewMetadata';
import { formatReplayTimestamp } from './behaviorLensNoteTimestamps';
import { renderReviewerMentions, getReviewerMentionHandle } from './behaviorLensNoteMentions';
import { matchesReviewerDirectoryQuery } from './behaviorLensSessionReviewers';
import {
  MomentTagPill,
  NOTE_TAG_PRESENTATION
} from './ScBehaviorLensSessionPopovers';
import {
  ComposerHighlight,
  MentionEmpty,
  MentionList,
  MentionOption,
  MentionOptionName,
  MentionTextarea,
  NoteComposer,
  NoteComposerActions
} from './ScBehaviorLensSessionNotesComposer';
import {
  ComposerFooter,
  MomentTagChip,
  MomentTagsField,
  MomentTagsRow,
  MomentTimeLabel,
  ReviewActionError
} from './ScBehaviorLensSessionNotesThread';

export const getActiveNoteMention = (text, selectionStart) => {
  const beforeCursor = String(text || '').slice(0, selectionStart);
  const match = beforeCursor.match(/(?:^|\s)@([^\s@]*)$/u);
  if (!match) {
    return null;
  }
  return {
    query: match[1],
    start: selectionStart - match[1].length - 1,
    end: selectionStart
  };
};

export const getMentionInitials = name => {
  const words = String(name || '').trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  const firstInitial = Array.from(words[0])[0];
  if (words.length === 1) {
    return firstInitial.toLocaleUpperCase();
  }
  return `${firstInitial}${Array.from(words.at(-1))[0]}`.toLocaleUpperCase();
};

export const findMentionUser = (mentionUsers, username) => (
  mentionUsers.find(user => user.username === username)
);

export const getVisibleAuthor = (mentionUsers, username) => (
  findMentionUser(mentionUsers, username)?.name || username || 'Unknown user'
);

// Loads the reviewer directory once for @mention autocomplete and mention
// highlighting; shared by the rail panel and the Note & Share popover.
export const useReviewMentionUsers = () => {
  const [mentionUsers, setMentionUsers] = useState([]);
  const [mentionUsersLoading, setMentionUsersLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setMentionUsersLoading(true);
    listReviewUsers()
      .then(users => {
        if (active) {
          setMentionUsers(Array.isArray(users) ? users : []);
        }
      })
      .catch(() => {
        if (active) {
          setMentionUsers([]);
        }
      })
      .finally(() => {
        if (active) {
          setMentionUsersLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return { mentionUsers, mentionUsersLoading };
};

export const useReviewerMentionAutocomplete = ({
  maxLengthError = `Replies can contain at most ${MAX_SESSION_NOTE_LENGTH} characters.`,
  mentionUsers,
  onError,
  onValueChange,
  textareaRef,
  value
}) => {
  const pendingSelectionRef = useRef(null);
  const [mention, setMention] = useState(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const filteredUsers = mention
    ? mentionUsers.filter(user => matchesReviewerDirectoryQuery(user, mention.query))
    : [];

  useEffect(() => {
    const selection = pendingSelectionRef.current;
    const textarea = textareaRef.current;
    if (selection == null || !textarea) return;
    pendingSelectionRef.current = null;
    textarea.focus();
    textarea.setSelectionRange(selection, selection);
  }, [textareaRef, value]);

  const update = (text, selectionStart) => {
    setMention(getActiveNoteMention(text, selectionStart));
    setActiveMentionIndex(0);
  };

  const select = user => {
    if (!mention) return;
    const handle = getReviewerMentionHandle(user);
    if (!handle) return;
    const mentionText = `@${handle} `;
    const nextValue = `${value.slice(0, mention.start)}${mentionText}${value.slice(mention.end)}`;
    if (Array.from(nextValue).length > MAX_SESSION_NOTE_LENGTH) {
      onError(maxLengthError);
      return;
    }
    pendingSelectionRef.current = mention.start + mentionText.length;
    onValueChange(nextValue);
    setMention(null);
    onError('');
  };

  const onKeyDown = event => {
    if (!mention) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setMention(null);
      return;
    }
    if (filteredUsers.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveMentionIndex(index => (
        (index + direction + filteredUsers.length) % filteredUsers.length
      ));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      select(filteredUsers[activeMentionIndex]);
    }
  };
  const close = useCallback(() => setMention(null), []);

  return {
    activeMentionIndex,
    close,
    filteredUsers,
    mention,
    onKeyDown,
    select,
    update
  };
};

// The note composer (with @mention support) shared by the rail panel and the
// Note & Share popover. variant="panel" keeps the original layout; the
// popover variant adds moment tags and always saves at the live replay clock.
export const SessionNoteComposer = ({
  controller,
  getReplayCurrentTime,
  mentionUsers,
  mentionUsersLoading,
  onNoteComposerFocus,
  onSaved,
  replayReady,
  rows,
  selectedTags,
  setSelectedTags,
  variant
}) => {
  const newNoteTextareaRef = useRef(null);
  const mentionListRef = useRef(null);
  const pendingSelectionRef = useRef(null);
  const [mention, setMention] = useState(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionListMaxHeight, setMentionListMaxHeight] = useState(null);
  const {
    createError,
    createNote,
    creating,
    newNoteText,
    setCreateError,
    setNewNoteText
  } = controller;
  const isPopover = variant === 'popover';

  useEffect(() => {
    const selection = pendingSelectionRef.current;
    const textarea = newNoteTextareaRef.current;
    if (!selection || !textarea) {
      return;
    }
    pendingSelectionRef.current = null;
    textarea.focus();
    textarea.setSelectionRange(selection, selection);
  }, [newNoteText]);

  useEffect(() => {
    if (isPopover) {
      newNoteTextareaRef.current?.focus();
    }
  }, [isPopover]);

  useLayoutEffect(() => {
    if (!isPopover || !mention || !mentionListRef.current) return undefined;
    const mentionList = mentionListRef.current;
    const popover = mentionList.closest('[data-testid="behaviorlens-note-share-popover"]');
    if (!popover) return undefined;
    const fitListToPopover = () => {
      const availableHeight = Math.floor(
        popover.getBoundingClientRect().bottom
        - mentionList.getBoundingClientRect().top
        - 8
      );
      setMentionListMaxHeight(Math.max(0, Math.min(192, availableHeight)));
    };
    fitListToPopover();
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(fitListToPopover);
    observer?.observe(popover);
    window.addEventListener('resize', fitListToPopover);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', fitListToPopover);
    };
  }, [isPopover, mention]);

  const insertCurrentTime = () => {
    const currentTime = getReplayCurrentTime();
    if (!Number.isFinite(currentTime) || currentTime < 0) {
      return;
    }
    const timestamp = formatReplayTimestamp(currentTime);
    const textarea = newNoteTextareaRef.current;
    const selectionStart = textarea?.selectionStart ?? newNoteText.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const nextText = `${newNoteText.slice(0, selectionStart)}${timestamp}${newNoteText.slice(selectionEnd)}`;
    if (Array.from(nextText).length > MAX_SESSION_NOTE_LENGTH) {
      setCreateError(`Notes can contain at most ${MAX_SESSION_NOTE_LENGTH} characters.`);
      return;
    }
    pendingSelectionRef.current = selectionStart + timestamp.length;
    setNewNoteText(nextText);
    setCreateError('');
  };

  const mentionUsersFiltered = mention
    ? mentionUsers.filter(user => matchesReviewerDirectoryQuery(user, mention.query))
    : [];

  const selectMention = user => {
    if (!mention) {
      return;
    }
    const handle = getReviewerMentionHandle(user);
    if (!handle) {
      return;
    }
    const mentionText = `@${handle} `;
    const nextText = `${newNoteText.slice(0, mention.start)}${mentionText}${newNoteText.slice(mention.end)}`;
    if (Array.from(nextText).length > MAX_SESSION_NOTE_LENGTH) {
      setCreateError(`Notes can contain at most ${MAX_SESSION_NOTE_LENGTH} characters.`);
      return;
    }
    pendingSelectionRef.current = mention.start + mentionText.length;
    setNewNoteText(nextText);
    setMention(null);
    setCreateError('');
  };

  const updateMention = (text, selectionStart) => {
    setMention(getActiveNoteMention(text, selectionStart));
    setActiveMentionIndex(0);
  };

  const handleNoteKeyDown = event => {
    if (!mention) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setMention(null);
      return;
    }
    if (mentionUsersFiltered.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveMentionIndex(index => (
        (index + direction + mentionUsersFiltered.length) % mentionUsersFiltered.length
      ));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      selectMention(mentionUsersFiltered[activeMentionIndex]);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const sampledTime = getReplayCurrentTime();
    const liveTime = sampledTime === null || sampledTime === undefined
      ? Number.NaN
      : Number(sampledTime);
    const created = await createNote(event, {
      offsetMs: liveTime,
      tags: isPopover ? selectedTags : []
    });
    if (created && typeof onSaved === 'function') {
      onSaved();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isPopover && (
        <MomentTagsField data-testid="behaviorlens-moment-tags">
          <MomentTimeLabel>Add tags</MomentTimeLabel>
          <MomentTagsRow>
            {BEHAVIORLENS_SESSION_TAGS.map(tag => {
              const presentation = NOTE_TAG_PRESENTATION[tag];
              const selected = selectedTags.includes(tag);
              return (
                <MomentTagChip
                  key={tag}
                  type="button"
                  aria-pressed={selected}
                  disabled={creating}
                  onClick={() => setSelectedTags(current => (
                    selected
                      ? current.filter(value => value !== tag)
                      : [...current, tag]
                  ))}
                >
                  <MomentTagPill $presentation={presentation} $selected={selected}>
                    {presentation.label}
                  </MomentTagPill>
                </MomentTagChip>
              );
            })}
          </MomentTagsRow>
        </MomentTagsField>
      )}
      <FormControl
        id="behaviorlens-new-session-note"
        colorStyle={createError ? 'error' : 'default'}
      >
        {!isPopover && <FormLabel>Add a note</FormLabel>}
        <NoteComposer>
          <ComposerHighlight $popover={isPopover} aria-hidden="true">
            {renderReviewerMentions(
              newNoteText,
              mentionUsers,
              'composer',
              true
            )}
          </ComposerHighlight>
          <MentionTextarea
            ref={newNoteTextareaRef}
            $popover={isPopover}
            value={newNoteText}
            rows={rows}
            resize="vertical"
            placeholder={isPopover ? 'Add a note' : 'Add context for other reviewers'}
            disabled={creating}
            aria-label={isPopover ? 'Note text' : undefined}
            aria-autocomplete="list"
            aria-controls={mention ? 'behaviorlens-note-mention-list' : undefined}
            aria-expanded={Boolean(mention)}
            aria-describedby={createError ? 'behaviorlens-new-session-note-error' : undefined}
            onChange={event => {
              setNewNoteText(event.target.value);
              updateMention(event.target.value, event.target.selectionStart);
              setCreateError('');
            }}
            onClick={event => updateMention(event.target.value, event.target.selectionStart)}
            onFocus={onNoteComposerFocus}
            onKeyDown={handleNoteKeyDown}
          />
          {mention && (
            <MentionList
              ref={mentionListRef}
              $maxHeight={isPopover ? mentionListMaxHeight : null}
              contentKey={[
                mention.query, mentionUsersLoading, mentionUsersFiltered.length
              ].join(':')}
              id="behaviorlens-note-mention-list"
              role="listbox"
            >
              {mentionUsersLoading && <MentionEmpty>Loading reviewers...</MentionEmpty>}
              {!mentionUsersLoading && mentionUsersFiltered.length === 0 && (
                <MentionEmpty>No reviewers found</MentionEmpty>
              )}
              {!mentionUsersLoading && mentionUsersFiltered.map((user, index) => (
                <MentionOption
                  key={user.email}
                  type="button"
                  role="option"
                  aria-selected={index === activeMentionIndex}
                  $active={index === activeMentionIndex}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => selectMention(user)}
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
        {!isPopover && (
          <FormHelperText>
            {`${Array.from(newNoteText).length}/${MAX_SESSION_NOTE_LENGTH} characters`}
          </FormHelperText>
        )}
        {createError && (
          <ReviewActionError id="behaviorlens-new-session-note-error" role="alert">
            {createError}
          </ReviewActionError>
        )}
      </FormControl>
      {isPopover ? (
        <ComposerFooter $popover>
          <FormHelperText>
            {`${Array.from(newNoteText).length}/${MAX_SESSION_NOTE_LENGTH} characters`}
          </FormHelperText>
          <NoteComposerActions style={{ marginTop: 0 }}>
            <Button
              type="submit"
              size="small"
              colorStyle="primary"
              variant="filled"
              loader={creating}
              loaderText="Saving..."
            >
              Save
            </Button>
          </NoteComposerActions>
        </ComposerFooter>
      ) : (
        <NoteComposerActions>
          <Button
            type="button"
            size="small"
            colorStyle="secondary"
            variant="outline"
            disabled={!replayReady || creating}
            onClick={insertCurrentTime}
          >
            Insert current time
          </Button>
          <Button
            type="submit"
            size="small"
            colorStyle="primary"
            variant="filled"
          >
            Add Note
          </Button>
        </NoteComposerActions>
      )}
    </form>
  );
};

SessionNoteComposer.propTypes = {
  controller: PropTypes.object.isRequired,
  getReplayCurrentTime: PropTypes.func,
  mentionUsers: PropTypes.array,
  mentionUsersLoading: PropTypes.bool,
  onNoteComposerFocus: PropTypes.func,
  onSaved: PropTypes.func,
  replayReady: PropTypes.bool,
  rows: PropTypes.number,
  selectedTags: PropTypes.arrayOf(PropTypes.string),
  setSelectedTags: PropTypes.func,
  variant: PropTypes.oneOf(['panel', 'popover'])
};

SessionNoteComposer.defaultProps = {
  getReplayCurrentTime: () => null,
  mentionUsers: [],
  mentionUsersLoading: false,
  onNoteComposerFocus: () => {},
  onSaved: undefined,
  replayReady: false,
  rows: 3,
  selectedTags: [],
  setSelectedTags: () => {},
  variant: 'panel'
};
