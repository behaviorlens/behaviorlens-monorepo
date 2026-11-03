import React, {
  useCallback, useEffect, useLayoutEffect, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, Loader } from '../../ui';
import { IconPlus } from '../../ui/icons';
import NotesEmptyIllustration from '../../assets/behaviorlens-mentions-notes-empty.svg';
import { RAIL_SURFACE } from './ScBehaviorLensEventRail';
import { useSessionReviewMetadataContext } from './SessionReviewMetadataPanel';
import {
  SessionNotesRailListFrame,
  SessionNotesList,
  SessionNotesStateGate,
  ReviewLoading,
  useReviewMentionUsers
} from './SessionNotesUI';
import useScrollEdgeFades from './useScrollEdgeFades';
import { NOOP, RETURN_FALSE } from '../../lib/propDefaults';

const NotesRailRoot = styled.section`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e8e9ef;
  background: ${RAIL_SURFACE};
`;

const NotesRailTitle = styled.h2`
  flex: 0 0 auto;
  margin: 0;
  color: #6c73a8;
  font-size: 16px;
  font-weight: 700;
  line-height: normal;
`;

const NotesRailHeader = styled.div`
  flex: 0 0 auto;
  padding: 20px 20px 16px;
`;

const NotesRailFrame = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
`;

const NotesRailScroller = styled.div`
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 20px 20px;
`;

const NotesRailHydration = styled.div`
  visibility: ${({ $ready }) => ($ready ? 'visible' : 'hidden')};
`;

const NotesRailLoading = styled(ReviewLoading)`
  position: absolute;
  z-index: 2;
  inset: 0;
  align-items: flex-start;
  box-sizing: border-box;
  padding: 8px 20px;
  background: ${RAIL_SURFACE};
`;

const NotesRailEmptyState = styled.div`
  position: absolute;
  z-index: 1;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  padding: 24px 20px 40px;
  text-align: center;
`;

const NotesRailEmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: min(361px, 100%);
`;

const NotesRailEmptyIllustration = styled.div`
  flex: 0 0 auto;
  width: min(170px, 100%);
  aspect-ratio: 170 / 100.155;

  img {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

const NotesRailEmptyCopy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: min(360px, 100%);
  word-break: break-word;
`;

const NotesRailEmptyTitle = styled.h3`
  margin: 0;
  color: #0a1551;
  font-size: 22px;
  font-weight: 700;
  line-height: normal;
`;

const NotesRailEmptyDescription = styled.p`
  margin: 0;
  color: #6c73a8;
  font-size: 16px;
  font-weight: 400;
  line-height: normal;
`;

const NotesRailEmptyAction = styled(Button)`
  && {
    white-space: nowrap;
  }
`;

const NotesRailFade = styled.div`
  position: absolute;
  z-index: 1;
  right: 0;
  ${({ $edge }) => ($edge === 'top' ? 'top: 0;' : 'bottom: 0;')}
  left: 0;
  height: 40px;
  opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
  background: rgba(245, 249, 255, 0.62);
  mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  backdrop-filter: blur(2px);
  -webkit-mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  -webkit-backdrop-filter: blur(2px);
  transition: none;
  will-change: opacity;
`;

const SessionNotesRail = ({
  noteReveal = null,
  onAddNote = NOOP,
  onReplyComposerOpen = NOOP,
  onScrollToReplay = NOOP,
  onSeekReplay = RETURN_FALSE,
  replayDurationMs = 0,
  replayReady = false
}) => {
  const scrollerRef = useRef(null);
  const { mentionUsers, mentionUsersLoading } = useReviewMentionUsers();
  const { controller, currentUsername } = useSessionReviewMetadataContext();
  const notes = Array.isArray(controller.notes) ? controller.notes : [];
  const [replyCounts, setReplyCounts] = useState({});
  const [highlightActive, setHighlightActive] = useState(false);
  const newestNoteId = notes[0]?.id ?? null;
  const previousNewestNoteIdRef = useRef(newestNoteId);
  const previousNoteCountRef = useRef(notes.length);
  const noteIdsKey = notes.map(note => note.id).join(',');
  const handleReplyCountChange = useCallback((noteId, count) => {
    setReplyCounts(previous => {
      const key = String(noteId);
      if (previous[key] === count) return previous;
      return { ...previous, [key]: count };
    });
  }, []);
  const listedReplyCounts = notes.map(note => {
    const key = String(note.id);
    if (Object.prototype.hasOwnProperty.call(replyCounts, key)) {
      return replyCounts[key];
    }
    const count = Number(note.reply_count);
    return note.reply_count != null && Number.isInteger(count) && count >= 0
      ? count
      : null;
  });
  const listedCountReady = !controller.notesLoading
    && listedReplyCounts.every(count => count !== null);
  const replyThreadsReady = !controller.notesLoading && notes.every(note => (
    Object.prototype.hasOwnProperty.call(replyCounts, String(note.id))
  ));
  const railReady = listedCountReady && replyThreadsReady && !mentionUsersLoading;
  const showEmptyState = railReady
    && !controller.notesError
    && notes.length === 0;
  const listedCount = notes.length + listedReplyCounts.reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(
    notes,
    scrollerRef
  );

  useLayoutEffect(() => {
    const previousNewestNoteId = previousNewestNoteIdRef.current;
    const previousNoteCount = previousNoteCountRef.current;
    previousNewestNoteIdRef.current = newestNoteId;
    previousNoteCountRef.current = notes.length;

    if (previousNoteCount > 0
      && notes.length > previousNoteCount
      && String(newestNoteId) !== String(previousNewestNoteId)
      && scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [newestNoteId, notes.length]);

  useEffect(() => {
    const ids = new Set(notes.map(note => String(note.id)));
    setReplyCounts(previous => {
      let changed = false;
      const next = {};
      Object.keys(previous).forEach(id => {
        if (ids.has(id)) {
          next[id] = previous[id];
        } else {
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [noteIdsKey, notes]);

  useEffect(() => {
    if (!railReady || noteReveal?.noteId == null || noteReveal?.replyId != null) {
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      const target = Array.from(
        scrollerRef.current?.querySelectorAll('[data-session-note-primary-id]') || []
      ).find(node => (
        String(node.getAttribute('data-session-note-primary-id')) === String(noteReveal.noteId)
      ));
      target?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [noteReveal?.noteId, noteReveal?.replyId, noteReveal?.requestId, notes, railReady]);

  useLayoutEffect(() => {
    if (!railReady || noteReveal?.noteId == null) {
      setHighlightActive(false);
      return undefined;
    }

    setHighlightActive(true);
    const timer = setTimeout(() => setHighlightActive(false), 5000);
    return () => clearTimeout(timer);
  }, [
    noteReveal?.noteId,
    noteReveal?.replyId,
    noteReveal?.requestId,
    railReady
  ]);

  return (
    <NotesRailRoot aria-label="Session Notes" data-testid="behaviorlens-session-notes-rail">
      <NotesRailHeader>
        <NotesRailTitle>
          {railReady ? `Notes (${listedCount})` : 'Notes'}
        </NotesRailTitle>
      </NotesRailHeader>
      <NotesRailFrame>
        <NotesRailScroller ref={scrollRef} data-testid="behaviorlens-session-notes-scroller">
          <SessionNotesRailListFrame>
            <SessionNotesStateGate controller={controller}>
              <NotesRailHydration $ready={railReady}>
                {notes.length > 0 && (
                  <SessionNotesList
                    controller={controller}
                    currentUsername={currentUsername}
                    highlightedNoteId={highlightActive ? noteReveal?.noteId : null}
                    highlightedReplyId={highlightActive ? noteReveal?.replyId : null}
                    mentionUsers={mentionUsers}
                    mentionUsersLoading={mentionUsersLoading}
                    notes={notes}
                    onReplyCountChange={handleReplyCountChange}
                    onReplyComposerOpen={onReplyComposerOpen}
                    onScrollToReplay={onScrollToReplay}
                    onSeekReplay={onSeekReplay}
                    replayDurationMs={replayDurationMs}
                    replayReady={replayReady}
                    targetNoteId={noteReveal?.noteId}
                    targetReplyId={noteReveal?.replyId}
                    variant="rail"
                  />
                )}
              </NotesRailHydration>
            </SessionNotesStateGate>
          </SessionNotesRailListFrame>
        </NotesRailScroller>
        {!controller.notesLoading && !controller.notesError && !railReady && (
          <NotesRailLoading role="status">
            <Loader size="small" />
            <span>Loading notes...</span>
          </NotesRailLoading>
        )}
        {showEmptyState && (
          <NotesRailEmptyState role="status">
            <NotesRailEmptyContent>
              <NotesRailEmptyIllustration aria-hidden="true">
                <img src={NotesEmptyIllustration} alt="" />
              </NotesRailEmptyIllustration>
              <NotesRailEmptyCopy>
                <NotesRailEmptyTitle>Add your first note</NotesRailEmptyTitle>
                <NotesRailEmptyDescription>
                  Keep track of important moments by adding a note to this session.
                </NotesRailEmptyDescription>
              </NotesRailEmptyCopy>
            </NotesRailEmptyContent>
            <NotesRailEmptyAction
              type="button"
              size="small"
              colorStyle="primary"
              variant="filled"
              startIcon={IconPlus}
              onClick={onAddNote}
            >
              Add note
            </NotesRailEmptyAction>
          </NotesRailEmptyState>
        )}
        <NotesRailFade aria-hidden="true" $edge="top" $opacity={fadeTop} />
        <NotesRailFade aria-hidden="true" $edge="bottom" $opacity={fadeBottom} />
      </NotesRailFrame>
    </NotesRailRoot>
  );
};

SessionNotesRail.propTypes = {
  noteReveal: PropTypes.shape({
    noteId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    offsetMs: PropTypes.number,
    replyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    requestId: PropTypes.number
  }),
  onAddNote: PropTypes.func,
  onReplyComposerOpen: PropTypes.func,
  onScrollToReplay: PropTypes.func,
  onSeekReplay: PropTypes.func,
  replayDurationMs: PropTypes.number,
  replayReady: PropTypes.bool
};

export default SessionNotesRail;
