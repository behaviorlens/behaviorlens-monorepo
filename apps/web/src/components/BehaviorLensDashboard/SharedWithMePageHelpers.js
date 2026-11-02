import React, {
  useCallback, useEffect, useLayoutEffect, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '../../ui';
import { describeUserAgentParts } from './behaviorLensUserAgent';
import {
  HighlightMark,
  PaneNoteFade,
  PaneNoteScroller,
  PaneNoteThread,
  PaneVisitorDevice,
  PaneVisitorDeviceMark,
  SharedPath,
  SharedPathSlot
} from './ScBehaviorLensSharedWithMe';
import {
  SessionNotesRailListFrame,
  SessionNotesList,
  SessionNotesStateGate,
  useReviewMentionUsers
} from './SessionNotesUI';
import { useSessionReviewMetadataContext } from './SessionReviewMetadataPanel';
import useScrollEdgeFades from './useScrollEdgeFades';

const QUERY_PARAM = 'q';
const SEARCH_DEBOUNCE_MS = 250;

// "12h ago" is enough to scan but useless for triage across days, so the exact
// moment is one hover — or one screen-reader stop — away. To the minute:
// seconds answer a question nobody asks of a comment and turn a date into a
// serial number ("01.09.2026 09:48:40").
export const formatAbsoluteTime = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).replace('Sept', 'Sep');
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  return `${datePart} ${timePart}`;
};

export const formatSessionStart = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace('Sept', 'Sep');
};

export const getInitials = value => String(value || '')
  .trim()
  .split(/\s+/u)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part.charAt(0).toUpperCase())
  .join('') || 'JS';

export const VisitorDeviceLine = ({ userAgent }) => {
  const parts = describeUserAgentParts(userAgent);
  if (!parts) return null;

  return (
    <PaneVisitorDevice data-testid="behaviorlens-shared-preview-device">
      <PaneVisitorDeviceMark>{parts.browser}</PaneVisitorDeviceMark>
      <span aria-hidden="true">·</span>
      <PaneVisitorDeviceMark>{parts.os}</PaneVisitorDeviceMark>
    </PaneVisitorDevice>
  );
};

export const HighlightedText = ({ text, query }) => {
  if (!text || !query) return text || null;
  const needle = query.trim();
  if (!needle) return text;

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, index) => {
        if (part.toLowerCase() === needle.toLowerCase()) {
          return <HighlightMark key={index}>{part}</HighlightMark>;
        }
        return part;
      })}
    </>
  );
};

export const SharedPathLabel = ({ path = '', query = '', url = '' }) => {
  const slotRef = useRef(null);
  const [truncated, setTruncated] = useState(false);
  const full = url || path || '';

  const measure = useCallback(() => {
    const node = slotRef.current?.firstElementChild;
    if (!node) {
      setTruncated(false);
      return;
    }
    setTruncated(node.scrollWidth > node.clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [full, measure, path, query]);

  useEffect(() => {
    const node = slotRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <SharedPathSlot ref={slotRef}>
      <Tooltip
        as={SharedPath}
        className="block"
        open={truncated ? undefined : false}
        placement="top"
        tabIndex={truncated ? 0 : undefined}
        title={truncated ? full : undefined}
        tooltipStyle={{
          maxWidth: '320px',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal'
        }}
        usePortal
      >
        <HighlightedText text={path} query={query} />
      </Tooltip>
    </SharedPathSlot>
  );
};

SharedPathLabel.propTypes = {
  path: PropTypes.string,
  query: PropTypes.string,
  url: PropTypes.string
};

export const useSearchDraft = (query, updateParam) => {
  const [searchDraft, setSearchDraft] = useState(query);

  useEffect(() => setSearchDraft(query), [query]);

  useEffect(() => {
    if (searchDraft === query) return undefined;
    const timer = setTimeout(
      () => updateParam(QUERY_PARAM, searchDraft),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [query, searchDraft, updateParam]);

  return [searchDraft, setSearchDraft];
};

export const SharedPreviewNoteThread = ({
  item, onActivityChange, onActivityCreate, onActivityDelete, onNoteChange
}) => {
  const { controller, currentUsername } = useSessionReviewMetadataContext();
  const { mentionUsers, mentionUsersLoading } = useReviewMentionUsers();
  const notes = controller.notes.filter(note => String(note.id) === String(item.noteId));
  const note = notes[0] || null;

  useEffect(() => {
    if (controller.notesLoading || controller.notesError) return;
    onNoteChange(item.id, item.noteId, note);
  }, [
    controller.notesError,
    controller.notesLoading,
    item.id,
    item.noteId,
    note,
    onNoteChange
  ]);

  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(
    `${item.id}:${item.noteId}:${note?.updated_at || ''}`
  );

  return (
    <PaneNoteThread>
      <PaneNoteScroller ref={scrollRef} data-testid="behaviorlens-shared-preview-note-scroll">
        <SessionNotesRailListFrame $cardless>
          <SessionNotesStateGate controller={controller}>
            <SessionNotesList
              activityOnly
              controller={controller}
              currentUsername={currentUsername}
              mentionUsers={mentionUsers}
              mentionUsersLoading={mentionUsersLoading}
              notes={notes}
              originInboxItemId={item.id}
              onReplyCreate={(reply, mentionedUsername) => (
                onActivityCreate(item, reply, mentionedUsername)
              )}
              onTargetReplyDelete={replyId => onActivityDelete(item, replyId)}
              onTargetReplyUpdate={onActivityChange}
              targetNoteId={item.noteId}
              targetReplyId={item.replyId}
              variant="rail"
            />
          </SessionNotesStateGate>
        </SessionNotesRailListFrame>
      </PaneNoteScroller>
      <PaneNoteFade aria-hidden="true" $edge="top" $opacity={fadeTop} />
      <PaneNoteFade aria-hidden="true" $edge="bottom" $opacity={fadeBottom} />
    </PaneNoteThread>
  );
};

SharedPreviewNoteThread.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    noteId: PropTypes.string.isRequired,
    replyId: PropTypes.string
  }).isRequired,
  onActivityChange: PropTypes.func.isRequired,
  onActivityCreate: PropTypes.func.isRequired,
  onActivityDelete: PropTypes.func.isRequired,
  onNoteChange: PropTypes.func.isRequired
};
