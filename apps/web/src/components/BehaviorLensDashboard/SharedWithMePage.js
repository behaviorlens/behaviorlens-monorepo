import React, {
  useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  IconFlagFilled,
  IconMagnifyingGlass,
  IconPencilLine,
  IconPlayFilled
} from '../../ui/icons';
import { UserContext } from '../../store';
import {
  listSessions,
  listMentionsAndNotes,
  listReviewUsers,
  setMentionsAndNotesFlagged,
  setMentionsAndNotesRead
} from '../../services/BehaviorLensService';
import MentionsNotesEmptyIllustration from '../../assets/behaviorlens-mentions-notes-empty.svg';
import {
  ContextTimeChip,
  FlagFilterLabel,
  SenderAvatar,
  SharedByLine,
  SharedCard,
  SharedColumn,
  SharedContent,
  SharedContext,
  SharedEmpty,
  SharedEmptyAction,
  SharedInboxEmpty,
  SharedInboxEmptyContent,
  SharedInboxEmptyCopy,
  SharedInboxEmptyDescription,
  SharedInboxEmptyIllustration,
  SharedInboxEmptyTitle,
  SharedFiltersRow,
  SharedFlagButton,
  SharedIntro,
  SharedList,
  SharedMessage,
  SharedMessageBlock,
  SharedSearchWrap,
  SharedSkeletonAction,
  SharedSkeletonAvatar,
  SharedSkeletonBlock,
  SharedSkeletonBody,
  SharedSkeletonCard,
  SharedSkeletonMedia,
  SharedSkeletonPreview,
  SharedSkeletonPreviewBody,
  SharedSkeletonRow,
  SharedTitle,
  SharedTitleLink,
  SharedToolbar,
  SharedToolbarTop,
  SharedTopLine,
  UnreadDot,
  PaneAuthorAvatar,
  PaneAuthorName,
  PaneByLine,
  PaneFoot,
  PaneHead,
  PanePrimary,
  PaneSessionMetaLine,
  PaneStill,
  PaneTitle,
  PreviewNoteSlot,
  PreviewPane,
  PreviewPaneBody,
  SharedLayout,
  SharedListColumn,
  SharedListFade,
  SharedListScrollFrame,
  SourceNavButton,
  SourceNavRow,
  VisuallyHidden
} from './ScBehaviorLensSharedWithMe';
import {
  buildSharedItemTarget,
  isInboxMention,
  TAB_ALL,
  TAB_MY_MENTIONS,
  TAB_MY_NOTES,
  TAB_UNREAD
} from './behaviorLensSharedWithMe';
import {
  indexSessions,
  indexUsers,
  mapMentionsAndNotesItem
} from './behaviorLensMentionsAndNotes';
import { formatRelativeTime, formatReplayTimestamp } from './behaviorLensNoteTimestamps';
import SharedReplayPlayer from './SharedReplayPlayer';
import { SessionReviewMetadataFeature } from './SessionReviewMetadataPanel';
import {
  BookmarkedToggleControl,
  SearchInput,
  VisuallyHiddenInput
} from './ScBehaviorLensSessionListPage';
import {
  formatAbsoluteTime,
  formatSessionStart,
  getInitials,
  HighlightedText,
  SharedPathLabel,
  SharedPreviewNoteThread,
  useSearchDraft
} from './SharedWithMePageHelpers';
import useScrollEdgeFades from './useScrollEdgeFades';

// One default, one state, one escape hatch. A "Mentions" view sat between the
// last two and held every mention addressed to the reviewer, read or not —
// which made "Unread" a strict subset of the chip beside it, differing only by
// read state. Four chips also mixed two axes: what state a row is in, and who
// wrote it. What is left of "Mentions" is All minus My Notes, over rows an
// avatar and a badge already tell apart.
const SOURCES = [
  { id: TAB_ALL, label: 'All' },
  // What is waiting is the reason this page gets opened, so it is a view and
  // not only a number on "All": the count said two were waiting without
  // offering any way to see just those two.
  { id: TAB_UNREAD, label: 'Unread' },
  { id: TAB_MY_NOTES, label: 'My Notes' }
];

const EMPTY_STATE_COPY = {
  [TAB_ALL]: {
    heading: 'No notes yet',
    description: 'Notes you create or are mentioned in will appear here.'
  },
  [TAB_UNREAD]: {
    heading: 'You’re all caught up',
    description: 'New mentions you haven’t viewed yet will appear here.'
  },
  [TAB_MY_NOTES]: {
    heading: 'No notes from you yet',
    description: 'Notes you add to sessions will appear here for quick access.'
  }
};

// Filters live in the URL, the way the session list keeps its own, so a
// refresh, the back button and a pasted link all restore the same view.
const TAB_PARAM = 'tab';
const QUERY_PARAM = 'q';
const SELECTED_PARAM = 'item';
const FLAGGED_PARAM = 'flagged';
const PARAM_BY_TAB = {
  [TAB_UNREAD]: 'unread',
  [TAB_MY_NOTES]: 'notes'
};
// A link to the view that no longer exists resolves to All rather than to a
// list with no chip pressed on it.
const TAB_BY_PARAM = {
  unread: TAB_UNREAD,
  notes: TAB_MY_NOTES
};

// Typing is not a filter change. Without this every keystroke rewrote the URL
// and re-filtered the whole list.
const INBOX_PAGE_SIZE = 100;

const findInboxItem = async (itemId, offset = 0) => {
  const response = await listMentionsAndNotes({
    view: 'all', q: '', flagged: false, limit: INBOX_PAGE_SIZE, offset
  });
  const page = Array.isArray(response?.items) ? response.items : [];
  const match = page.find(item => String(item.id) === itemId);
  if (match) return match;

  const nextOffset = offset + INBOX_PAGE_SIZE;
  return nextOffset < (Number(response?.total) || 0)
    ? findInboxItem(itemId, nextOffset)
    : null;
};

// The pane opens on the width this page actually got, not on the viewport:
// the shell's sidebar and gaps mean the same window leaves different room on
// different routes. Below it the page behaves exactly as it did — a row is a
// link to the replay.
// The pane opens on the width this page actually got, not on the viewport:
// the shell's sidebar and gaps mean the same window leaves different room on
// different routes. Below it the page behaves exactly as it did — a row is a
// link to the replay.
const PREVIEW_MIN_WIDTH = 880;
const LOADING_ROWS = [
  {
    id: 'one', title: '72%', byline: '46%', message: '88%', path: '64%'
  },
  {
    id: 'two', title: '58%', byline: '38%', message: '76%', path: '52%'
  },
  {
    id: 'three', title: '78%', byline: '51%', message: '92%', path: '68%'
  },
  {
    id: 'four', title: '64%', byline: '43%', message: '81%', path: '57%'
  },
  {
    id: 'five', title: '74%', byline: '48%', message: '86%', path: '61%'
  },
  {
    id: 'six', title: '61%', byline: '40%', message: '79%', path: '55%'
  }
];

const useSharedInboxPageState = () => {
  const history = useHistory();
  const location = useLocation();
  const { state: userState } = useContext(UserContext);
  const currentUsername = typeof userState?.user?.username === 'string'
    ? userState.user.username
    : '';
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeTab = TAB_BY_PARAM[params.get(TAB_PARAM)] || TAB_ALL;
  const emptyStateCopy = EMPTY_STATE_COPY[activeTab] || EMPTY_STATE_COPY[TAB_ALL];
  const query = params.get(QUERY_PARAM) || '';
  const selectedParam = params.get(SELECTED_PARAM) || '';
  const flaggedOnly = params.get(FLAGGED_PARAM) === 'true';

  return {
    activeTab,
    currentUsername,
    emptyStateCopy,
    flaggedOnly,
    history,
    location,
    query,
    selectedParam,
    userState
  };
};

const SharedWithMePage = () => {
  const {
    activeTab,
    currentUsername,
    emptyStateCopy,
    flaggedOnly,
    history,
    location,
    query,
    selectedParam,
    userState
  } = useSharedInboxPageState();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hasPane, setHasPane] = useState(false);
  const [usersByUsername, setUsersByUsername] = useState(new Map());
  const layoutRef = useRef(null);
  const selectedCardRef = useRef(null);
  const selectedParamRef = useRef(selectedParam);
  selectedParamRef.current = selectedParam;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    const view = PARAM_BY_TAB[activeTab] || 'all';
    const selectedItemId = selectedParamRef.current;

    Promise.all([
      listMentionsAndNotes({
        view, q: query, flagged: flaggedOnly, limit: 100, offset: 0
      }),
      listSessions(1000, 0).catch(() => ({ sessions: [] })),
      listReviewUsers().catch(() => [])
    ]).then(async ([inbox, sessionResponse, users]) => {
      if (!active) return;
      const sessionsById = indexSessions(sessionResponse?.sessions);
      let inboxItems = Array.isArray(inbox?.items) ? inbox.items : [];
      if (activeTab === TAB_UNREAD
        && selectedItemId
        && !inboxItems.some(item => String(item.id) === selectedItemId)) {
        const selectedInboxItem = await findInboxItem(selectedItemId);
        if (!active) return;
        if (selectedInboxItem) inboxItems = [selectedInboxItem, ...inboxItems];
      }
      const nextItems = inboxItems
        .map(item => mapMentionsAndNotesItem(
          item,
          sessionsById.get(item.session_id),
          currentUsername
        ));
      const nextUsersByUsername = indexUsers(users);
      setItems(nextItems);
      setUnreadCount(Number(inbox?.unread_count) || 0);
      setUsersByUsername(nextUsersByUsername);
    }).catch(() => {
      if (!active) return;
      setItems([]);
      setUnreadCount(0);
      setLoadError('Mentions & Notes could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [activeTab, currentUsername, flaggedOnly, query]);

  // Measured, not guessed: the element this page was given is the only thing
  // that knows whether a second column fits beside the reading one. It is the
  // outer column that is observed, not the list — the list is not rendered at
  // all while a filter matches nothing, and a page that opened on an empty
  // result would then never find its width again.
  useEffect(() => {
    const node = layoutRef.current;
    if (!node || typeof window.ResizeObserver !== 'function') {
      return undefined;
    }
    const observer = new window.ResizeObserver(([entry]) => {
      setHasPane(entry.contentRect.width >= PREVIEW_MIN_WIDTH);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const updateParam = useCallback((name, value) => {
    const next = new URLSearchParams(location.search);
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    const queryString = next.toString();
    history.replace({
      pathname: location.pathname,
      search: queryString ? `?${queryString}` : ''
    });
  }, [history, location.pathname, location.search]);
  const selectTab = useCallback(tab => {
    const next = new URLSearchParams(location.search);
    const value = PARAM_BY_TAB[tab];
    if (value) {
      next.set(TAB_PARAM, value);
    } else {
      next.delete(TAB_PARAM);
    }
    next.delete(SELECTED_PARAM);
    const queryString = next.toString();
    history.replace({
      pathname: location.pathname,
      search: queryString ? `?${queryString}` : ''
    });
  }, [history, location.pathname, location.search]);
  const getInboxReturnPath = useCallback(itemId => {
    const next = new URLSearchParams(location.search);
    next.set(SELECTED_PARAM, itemId);
    return `${location.pathname}?${next.toString()}`;
  }, [location.pathname, location.search]);
  const [searchDraft, setSearchDraft] = useSearchDraft(query, updateParam);
  const clearInboxFilters = useCallback(() => {
    const next = new URLSearchParams(location.search);
    next.delete(QUERY_PARAM);
    next.delete(FLAGGED_PARAM);
    const queryString = next.toString();
    history.replace({
      pathname: location.pathname,
      search: queryString ? `?${queryString}` : ''
    });
    setSearchDraft('');
  }, [history, location.pathname, location.search, setSearchDraft]);

  const setRead = useCallback((id, read) => {
    const item = items.find(candidate => candidate.id === id);
    if (!item) return Promise.resolve();
    const previousIndex = items.findIndex(candidate => candidate.id === id);
    const previousRead = Boolean(item.read);
    const nextRead = Boolean(read);
    const changesUnreadCount = isInboxMention(item) && previousRead !== nextRead;
    const removesFromView = activeTab === TAB_UNREAD && nextRead && !hasPane;

    setItems(current => (removesFromView
      ? current.filter(candidate => candidate.id !== id)
      : current.map(candidate => (
        candidate.id === id ? { ...candidate, read: nextRead } : candidate
      ))));
    if (changesUnreadCount) {
      setUnreadCount(current => Math.max(0, current + (nextRead ? -1 : 1)));
    }

    return setMentionsAndNotesRead(id, nextRead).catch(() => {
      setItems(current => {
        if (removesFromView && !current.some(candidate => candidate.id === id)) {
          const restored = [...current];
          restored.splice(Math.min(previousIndex, restored.length), 0, item);
          return restored;
        }
        return current.map(candidate => (
          candidate.id === id ? { ...candidate, read: previousRead } : candidate
        ));
      });
      if (changesUnreadCount) {
        setUnreadCount(current => Math.max(0, current + (nextRead ? 1 : -1)));
      }
    });
  }, [activeTab, hasPane, items]);

  const setFlag = useCallback((id, flagged) => {
    const item = items.find(candidate => candidate.id === id);
    if (!item) return Promise.resolve();
    const previousIndex = items.findIndex(candidate => candidate.id === id);
    const previousFlagged = Boolean(item.flagged);
    const nextFlagged = Boolean(flagged);
    const removesFromView = flaggedOnly && !nextFlagged;

    setItems(current => (removesFromView
      ? current.filter(candidate => candidate.id !== id)
      : current.map(candidate => (
        candidate.id === id ? { ...candidate, flagged: nextFlagged } : candidate
      ))));

    return setMentionsAndNotesFlagged(id, nextFlagged).catch(() => {
      setItems(current => {
        if (removesFromView && !current.some(candidate => candidate.id === id)) {
          const restored = [...current];
          restored.splice(Math.min(previousIndex, restored.length), 0, item);
          return restored;
        }
        return current.map(candidate => (
          candidate.id === id ? { ...candidate, flagged: previousFlagged } : candidate
        ));
      });
    });
  }, [flaggedOnly, items]);

  const handlePreviewNoteChange = useCallback((itemId, noteId, note) => {
    if (!note) {
      setItems(current => current.filter(candidate => candidate.noteId !== noteId));
      updateParam(SELECTED_PARAM, '');
      return;
    }
    setItems(current => current.map(candidate => (
      candidate.id === itemId
        ? {
          ...candidate,
          message: candidate.replyId ? candidate.message : String(note.text || ''),
          noteCreatedAt: candidate.replyId
            ? candidate.noteCreatedAt
            : (note.created_at || candidate.noteCreatedAt),
          noteUpdatedAt: candidate.replyId
            ? candidate.noteUpdatedAt
            : (note.updated_at || note.created_at || candidate.noteUpdatedAt),
          tags: Array.isArray(note.tags) ? note.tags : candidate.tags
        }
        : candidate
    )));
  }, [updateParam]);

  const handlePreviewActivityDelete = useCallback((sourceItem, replyId) => {
    setItems(current => current.filter(candidate => (
      String(candidate.replyId || '') !== String(replyId)
    )));
    if (String(sourceItem.replyId || '') === String(replyId)) {
      updateParam(SELECTED_PARAM, '');
    }
  }, [updateParam]);

  const handlePreviewActivityChange = useCallback(reply => {
    setItems(current => current.map(candidate => (
      String(candidate.replyId || '') === String(reply?.id || '')
        ? { ...candidate, message: String(reply?.text || '') }
        : candidate
    )));
  }, []);

  const handlePreviewActivityCreate = useCallback((sourceItem, reply, mentionedUsername) => {
    const replyId = String(reply?.id || '');
    if (!replyId || activeTab === TAB_UNREAD || flaggedOnly) return;

    const targetUsername = String(mentionedUsername || '').replace(/^@/u, '');
    const mentionsAnotherUser = targetUsername
      && targetUsername.toLocaleLowerCase() !== currentUsername.toLocaleLowerCase();
    const createdAt = reply?.created_at || new Date().toISOString();
    const currentUser = usersByUsername.get(currentUsername);
    const nextItem = {
      ...sourceItem,
      id: replyId,
      replyId,
      category: mentionsAnotherUser ? TAB_MY_MENTIONS : TAB_MY_NOTES,
      author: {
        name: currentUser?.name || currentUsername || 'You',
        username: currentUsername,
        initials: getInitials(currentUser?.name || currentUsername || 'You'),
        isCurrentUser: true
      },
      mentions: mentionsAnotherUser ? [targetUsername] : [],
      message: String(reply?.text || ''),
      tags: [],
      createdAt,
      noteUpdatedAt: reply?.updated_at || createdAt,
      read: true,
      flagged: false
    };

    setItems(current => [
      nextItem,
      ...current.filter(candidate => candidate.id !== replyId)
    ]);
  }, [activeTab, currentUsername, flaggedOnly, usersByUsername]);

  // Opening the page starts with the list only. The preview is opt-in and is
  // shown after a note is selected (or when the URL names one explicitly).
  const selectedItem = useMemo(() => (
    items.find(item => item.id === selectedParam) || null
  ), [items, selectedParam]);
  const isEmptyState = !loading && !loadError && items.length === 0;
  const showPane = hasPane && Boolean(selectedItem);
  const showLoadingPane = loading && hasPane && Boolean(selectedParam);
  const selectedSessionMetadata = useMemo(() => {
    if (!selectedItem) return [];
    return [
      selectedItem.visitor,
      formatSessionStart(selectedItem.startedAt)
    ].filter(Boolean);
  }, [selectedItem]);

  // Selecting an inbox note counts as reading it; private notes have no unread
  // state. The item stays in the open Unread view so the preview does not jump
  // to a different row while the reviewer is reading it.
  const selectItem = useCallback(id => updateParam(SELECTED_PARAM, id), [updateParam]);

  const openSelected = useCallback(() => {
    if (selectedItem) {
      setRead(selectedItem.id, true);
      history.push(buildSharedItemTarget(
        selectedItem,
        getInboxReturnPath(selectedItem.id)
      ));
    }
  }, [getInboxReturnPath, history, selectedItem, setRead]);

  const openItemAtNote = useCallback((event, item) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    const returnPath = getInboxReturnPath(item.id);
    history.replace(returnPath);
    setRead(item.id, true);
    history.push(buildSharedItemTarget(item, returnPath));
  }, [getInboxReturnPath, history, setRead]);

  // ↑/↓ walks the list and Enter opens what is selected, the way an inbox is
  // read. Typing in the search box and pressing a button keep their own keys.
  useEffect(() => {
    if (!hasPane || items.length === 0) {
      return undefined;
    }
    const onKeyDown = event => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) {
        return;
      }
      if (event.key === 'Enter') {
        if (tag !== 'BUTTON' && tag !== 'A') {
          event.preventDefault();
          openSelected();
        }
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }
      event.preventDefault();
      const current = items.findIndex(item => item.id === selectedItem?.id);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next = Math.min(items.length - 1, Math.max(0, current + step));
      selectItem(items[next].id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasPane, items, openSelected, selectItem, selectedItem]);

  // With the pane open a row shows itself there instead of leaving the page.
  // The title stays a real link to the replay so a modified click, a middle
  // click and the accessible name all still work.
  const handleCardClick = (event, item) => {
    if (isInboxMention(item) && !item.read) {
      setRead(item.id, true);
    }
    // Without the pane a row is a link: following it opens the replay, which is
    // the same act the pane's "Open" button performs.
    if (!hasPane || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    const isUnselecting = selectedItem?.id === item.id;
    selectItem(isUnselecting ? '' : item.id);
    if (isUnselecting && event.detail > 0) {
      event.currentTarget.blur();
    }
  };

  const {
    fadeBottom: listFadeBottom,
    fadeTop: listFadeTop,
    scrollRef: listScrollRef
  } = useScrollEdgeFades(`${loading}:${items.map(item => item.id).join(':')}`);

  useLayoutEffect(() => {
    if (loading || !selectedItem || !selectedCardRef.current) return;

    selectedCardRef.current.scrollIntoView({
      block: 'center',
      inline: 'nearest'
    });
  }, [loading, selectedItem?.id]);

  return (
    <SharedColumn ref={layoutRef}>
      <SharedIntro>Catch up on the sessions.</SharedIntro>
      <SharedToolbar $hasPane={showPane || showLoadingPane}>
        <SharedToolbarTop>
          <SharedSearchWrap>
            <IconMagnifyingGlass aria-hidden="true" />
            <SearchInput
              type="search"
              value={searchDraft}
              aria-label="Search notes, mentions or pages"
              placeholder="Search notes"
              onChange={event => setSearchDraft(event.target.value)}
            />
          </SharedSearchWrap>
        </SharedToolbarTop>

        <SharedFiltersRow>
          <SourceNavRow role="tablist" aria-label="Filter mentions and notes">
            {SOURCES.map(tab => (
              <SourceNavButton
                key={tab.id}
                type="button"
                role="tab"
                $active={activeTab === tab.id}
                aria-selected={activeTab === tab.id}
                data-testid={`behaviorlens-shared-tab-${tab.id}`}
                onClick={() => selectTab(tab.id)}
                aria-label={tab.id === TAB_UNREAD && unreadCount > 0
                  ? `Unread, ${unreadCount} waiting`
                  : undefined}
              >
                {tab.label}
                {tab.id === TAB_UNREAD && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </SourceNavButton>
            ))}
          </SourceNavRow>
          {(!isEmptyState || flaggedOnly) && (
            <FlagFilterLabel>
              <VisuallyHiddenInput
                type="checkbox"
                checked={flaggedOnly}
                aria-label="Only Flagged Notes"
                onChange={event => updateParam(FLAGGED_PARAM, event.target.checked ? 'true' : '')}
              />
              <BookmarkedToggleControl $checked={flaggedOnly} aria-hidden="true" />
              <span>Only Flagged Notes</span>
            </FlagFilterLabel>
          )}
        </SharedFiltersRow>
      </SharedToolbar>

      {/* The count was a line of page furniture: it is only news when it
          changes, and only to a reader who cannot see the list change. */}
      <VisuallyHidden aria-live="polite" data-testid="behaviorlens-shared-count">
        {`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        {query ? ` matching “${query}”` : ''}
      </VisuallyHidden>

      {loading ? (
        <SharedLayout
          data-pane={String(showLoadingPane)}
          role="status"
          aria-label="Loading Mentions & Notes"
        >
          <SharedListColumn $hasPane={showLoadingPane} aria-hidden="true">
            <SharedList>
              {LOADING_ROWS.map(row => (
                <SharedSkeletonCard key={row.id}>
                  <SharedSkeletonAvatar $width={40} $height={40} />
                  <SharedSkeletonBody>
                    <SharedSkeletonRow>
                      <SharedSkeletonBlock $width={row.title} $height={14} />
                      <SharedSkeletonBlock $width={16} $height={16} />
                    </SharedSkeletonRow>
                    <SharedSkeletonBlock $width={row.byline} $height={11} />
                    <SharedSkeletonBlock $width={row.message} $height={13} />
                    <SharedSkeletonRow>
                      <SharedSkeletonBlock $width={60} $height={25} />
                      <SharedSkeletonBlock $width={row.path} $height={11} />
                    </SharedSkeletonRow>
                  </SharedSkeletonBody>
                </SharedSkeletonCard>
              ))}
            </SharedList>
          </SharedListColumn>
          {showLoadingPane && (
            <SharedSkeletonPreview aria-hidden="true">
              <PreviewPaneBody>
                <SharedSkeletonPreviewBody>
                  <SharedSkeletonBlock $width="76%" $height={16} />
                  <SharedSkeletonRow>
                    <SharedSkeletonAvatar $width={20} $height={20} />
                    <SharedSkeletonBlock $width="38%" $height={11} />
                  </SharedSkeletonRow>
                  <SharedSkeletonMedia />
                  <SharedSkeletonBlock $width="100%" $height={64} />
                  <SharedSkeletonBlock $width="28%" $height={14} />
                  <SharedSkeletonBlock $width="82%" $height={12} />
                  <SharedSkeletonBlock $width="68%" $height={12} />
                  <SharedSkeletonBlock $width="100%" $height={34} />
                  <SharedSkeletonBlock $width="100%" $height={1} />
                  <SharedSkeletonBlock $width="100%" $height={16} />
                  <SharedSkeletonBlock $width="92%" $height={16} />
                  <SharedSkeletonBlock $width="86%" $height={16} />
                </SharedSkeletonPreviewBody>
                <SharedSkeletonAction $width="100%" $height={32} />
              </PreviewPaneBody>
            </SharedSkeletonPreview>
          )}
        </SharedLayout>
      ) : loadError ? (
        <SharedEmpty role="alert">
          <strong>{loadError}</strong>
          Please try again.
        </SharedEmpty>
      ) : flaggedOnly && items.length === 0 ? (
        <SharedLayout data-pane="false">
          <SharedEmpty role="status">No flagged notes.</SharedEmpty>
        </SharedLayout>
      ) : items.length > 0 ? (
        <SharedLayout data-pane={String(showPane)}>
          <SharedListScrollFrame $hasPane={showPane}>
            <SharedListColumn
              ref={listScrollRef}
              $hasPane={showPane}
              data-testid="behaviorlens-shared-list"
            >
              <SharedList>
                {items.map(item => {
                  const inbox = isInboxMention(item);
                  const isRead = Boolean(item.read);
                  const isUnread = inbox && !isRead;
                  const isSelectedItem = selectedItem?.id === item.id;
                  const isSelected = showPane && isSelectedItem;
                  const hasMentions = Array.isArray(item.mentions) && item.mentions.length > 0;
                  const mentionedDisplayNames = hasMentions
                    ? item.mentions.map(username => (
                      usersByUsername.get(username)?.name || String(username).replace(/^@/u, '')
                    ))
                    : [];
                  const clock = formatReplayTimestamp(item.offsetSeconds * 1000);
                  const avatarUser = usersByUsername.get(
                    inbox ? item.author?.username : currentUsername
                  );
                  const avatar = inbox
                    ? avatarUser?.avatar
                    : (hasMentions ? (avatarUser?.avatar || userState?.user?.avatarUrl) : '');
                  const ownMentionInitials = getInitials(
                    avatarUser?.name || currentUsername || 'You'
                  );

                  return (
                    <SharedCard
                      key={item.id}
                      ref={isSelectedItem ? selectedCardRef : null}
                      $selected={isSelected}
                      data-testid="behaviorlens-shared-item"
                    >
                      {isUnread && <UnreadDot aria-hidden="true" />}
                      <SenderAvatar $isCurrentUser={!inbox} aria-hidden="true">
                        {avatar
                          ? <img src={avatar} alt="" />
                          : (inbox
                            ? (item.author?.initials || 'JS')
                            : (hasMentions ? ownMentionInitials : <IconPencilLine />))}
                      </SenderAvatar>
                      <SharedContent>
                        <SharedTopLine>
                          <SharedTitle $unread={isUnread}>
                            <SharedTitleLink
                              to={buildSharedItemTarget(item, getInboxReturnPath(item.id))}
                              data-testid="behaviorlens-shared-item-link"
                              onClick={event => handleCardClick(event, item)}
                            >
                              <HighlightedText text={item.title} query={query} />
                            </SharedTitleLink>
                          </SharedTitle>
                          {isUnread && <VisuallyHidden>Unread</VisuallyHidden>}
                          <SharedFlagButton
                            type="button"
                            $flagged={item.flagged}
                            aria-label={item.flagged ? 'Remove note flag' : 'Flag note'}
                            aria-pressed={item.flagged}
                            onClick={event => {
                              event.preventDefault();
                              event.stopPropagation();
                              setFlag(item.id, !item.flagged);
                            }}
                          >
                            <IconFlagFilled aria-hidden="true" />
                          </SharedFlagButton>
                        </SharedTopLine>
                        <SharedByLine>
                          {inbox ? (
                            <>
                              <HighlightedText text={item.author?.name} query={query} />
                              {' mentioned you'}
                            </>
                          ) : (
                            hasMentions ? (
                              <>
                                {'You mentioned '}
                                <HighlightedText text={mentionedDisplayNames.join(', ')} query={query} />
                              </>
                            ) : 'Your note'
                          )}
                          {' · '}
                          <time dateTime={item.createdAt} title={formatAbsoluteTime(item.createdAt)}>
                            {formatRelativeTime(item.createdAt)}
                          </time>
                        </SharedByLine>
                        <SharedMessageBlock>
                          <SharedMessage>
                            <HighlightedText text={item.message} query={query} />
                          </SharedMessage>
                        </SharedMessageBlock>
                        <SharedContext>
                          <ContextTimeChip
                            to={buildSharedItemTarget(item, getInboxReturnPath(item.id))}
                            title={`Opens the replay at ${clock}`}
                            aria-label={`Open Session Notes at ${clock}`}
                            onClick={event => openItemAtNote(event, item)}
                          >
                            <IconPlayFilled aria-hidden="true" />
                            {clock}
                          </ContextTimeChip>
                          <SharedPathLabel
                            path={item.path}
                            query={query}
                            url={item.url}
                          />
                        </SharedContext>
                      </SharedContent>
                    </SharedCard>
                  );
                })}
              </SharedList>
            </SharedListColumn>
            <SharedListFade aria-hidden="true" $edge="top" $opacity={listFadeTop} />
            <SharedListFade aria-hidden="true" $edge="bottom" $opacity={listFadeBottom} />
          </SharedListScrollFrame>

          {showPane && (
            <PreviewPane data-testid="behaviorlens-shared-preview" aria-label="Mention preview">
              <PreviewPaneBody>
                <PaneHead>
                  <PaneTitle>{selectedItem.title}</PaneTitle>
                  {selectedSessionMetadata.length > 0 && (
                  <PaneSessionMetaLine>
                    {selectedSessionMetadata.map((value, index) => (
                      <React.Fragment key={`${value}-${index}`}>
                        {index > 0 && <span aria-hidden="true">·</span>}
                        <span>{value}</span>
                      </React.Fragment>
                    ))}
                  </PaneSessionMetaLine>
                  )}
                  <PaneByLine>
                    <PaneAuthorAvatar
                      $isCurrentUser={!isInboxMention(selectedItem)}
                      aria-hidden="true"
                    >
                      {usersByUsername.get(selectedItem.author?.username)?.avatar
                        ? (
                          <img
                            src={usersByUsername.get(selectedItem.author?.username).avatar}
                            alt=""
                          />
                        )
                        : getInitials(selectedItem.author?.name)}
                    </PaneAuthorAvatar>
                    <PaneAuthorName>
                      {isInboxMention(selectedItem) ? selectedItem.author?.name : 'You'}
                    </PaneAuthorName>
                    <time
                      dateTime={selectedItem.createdAt}
                      title={formatAbsoluteTime(selectedItem.createdAt)}
                    >
                      {formatRelativeTime(selectedItem.createdAt)}
                    </time>
                  </PaneByLine>
                </PaneHead>

                <PaneStill>
                  <SharedReplayPlayer
                    sessionId={selectedItem.sessionId}
                    offsetSeconds={selectedItem.offsetSeconds}
                  />
                </PaneStill>

                <PreviewNoteSlot>
                  <SessionReviewMetadataFeature
                    key={selectedItem.sessionId}
                    sessionId={selectedItem.sessionId}
                  >
                    <SharedPreviewNoteThread
                      item={selectedItem}
                      onActivityChange={handlePreviewActivityChange}
                      onActivityCreate={handlePreviewActivityCreate}
                      onActivityDelete={handlePreviewActivityDelete}
                      onNoteChange={handlePreviewNoteChange}
                    />
                  </SessionReviewMetadataFeature>
                </PreviewNoteSlot>

                <PaneFoot>
                  <PanePrimary
                    to={buildSharedItemTarget(
                      selectedItem,
                      getInboxReturnPath(selectedItem.id)
                    )}
                    data-testid="behaviorlens-shared-preview-open"
                    aria-label={`Go to session at ${formatReplayTimestamp(selectedItem.offsetSeconds * 1000)}`}
                    onClick={() => setRead(selectedItem.id, true)}
                  >
                    Go to Session
                  </PanePrimary>
                </PaneFoot>
              </PreviewPaneBody>
            </PreviewPane>
          )}
        </SharedLayout>
      ) : (
        <SharedInboxEmpty role="status">
          <SharedInboxEmptyContent>
            <SharedInboxEmptyIllustration aria-hidden="true">
              <img src={MentionsNotesEmptyIllustration} alt="" />
            </SharedInboxEmptyIllustration>
            <SharedInboxEmptyCopy $stabilizeHeight={!query && !flaggedOnly}>
              <SharedInboxEmptyTitle>
                {query || flaggedOnly
                  ? 'No notes or mentions match this view'
                  : emptyStateCopy.heading}
              </SharedInboxEmptyTitle>
              {!query && !flaggedOnly && (
                <SharedInboxEmptyDescription>
                  {emptyStateCopy.description}
                </SharedInboxEmptyDescription>
              )}
            </SharedInboxEmptyCopy>
          </SharedInboxEmptyContent>
          {(query || flaggedOnly) && (
            <SharedEmptyAction type="button" onClick={clearInboxFilters}>
              Clear all filters
            </SharedEmptyAction>
          )}
        </SharedInboxEmpty>
      )}
    </SharedColumn>
  );
};

export default SharedWithMePage;
