import React, {
  createContext, useContext, useState
} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Alert,
  Button,
  Loader,
  NotificationContainer,
  Tooltip,
  UnstyledButton
} from '../../ui';
import { IconBookmarkFilled } from '../../ui/icons';
import { SESSION_TAG_PRESENTATION } from './behaviorLensSessionTags';
import { UserContext } from '../../store';
import {
  Card,
  CardTitle,
  TimelineChevron,
  TimelineToggle
} from './ScBehaviorLensDashboard';
import CollapsibleInsightCard from './CollapsibleInsightCard';
import { TagOptionPill } from './ScBehaviorLensSessionPopovers';
import useSessionReviewMetadata, {
  REVIEW_METADATA_NOTIFICATION_ID
} from './useSessionReviewMetadata';
import {
  getActiveNoteMention as getActiveNoteMentionShared,
  NoteComposerActions,
  ReviewLoading,
  SessionNoteComposer,
  SessionNoteDeleteDialog,
  SessionNotesList,
  SessionNotesStateGate,
  useReviewMentionUsers
} from './SessionNotesUI';
import { NOOP, RETURN_FALSE, RETURN_NULL } from '../../lib/propDefaults';

// Re-exported for existing importers/tests.
export const getActiveNoteMention = getActiveNoteMentionShared;

const PanelContent = styled.div``;

const SessionNotesCard = styled(Card)`
  box-sizing: border-box;
  width: 100%;
`;

const BOOKMARKED_COLOR = '#2563eb';
const BOOKMARKED_HOVER_COLOR = '#1d4ed8';
const UNBOOKMARKED_COLOR = '#6f76a7';
const UNBOOKMARKED_HOVER_COLOR = '#343c6a';

// Playlist ribbon colors/shape, sized up for the session card (20px vs 16px
// on the list). Do not `disabled` while a save is in flight (`aria-busy`).
const BookmarkButton = styled(UnstyledButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: ${({ $toolbar }) => ($toolbar ? '32px' : '20px')};
  height: ${({ $toolbar }) => ($toolbar ? '32px' : '20px')};
  padding: 0;
  border: ${({ $toolbar }) => ($toolbar ? '1px solid #d9e8ff' : '0')};
  border-radius: ${({ $toolbar }) => ($toolbar ? '8px' : '0')};
  background: ${({ $toolbar }) => ($toolbar ? '#ffffff' : 'transparent')};
  color: ${({ $bookmarked }) => ($bookmarked ? BOOKMARKED_COLOR : UNBOOKMARKED_COLOR)};
  cursor: pointer;
  user-select: none;
  transition: color 120ms ease, background 120ms ease;

  &:hover,
  &:active {
    background: ${({ $toolbar }) => ($toolbar ? '#f3f8ff' : 'transparent')};
    color: ${({ $bookmarked }) => ($bookmarked ? BOOKMARKED_HOVER_COLOR : UNBOOKMARKED_HOVER_COLOR)};
  }

  &:focus-visible {
    outline: 2px solid ${BOOKMARKED_COLOR};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.55;
  }

  svg {
    width: ${({ $toolbar }) => ($toolbar ? '16px' : '20px')};
    height: ${({ $toolbar }) => ($toolbar ? '16px' : '20px')};
    pointer-events: none;
  }
`;

const ReviewSection = styled.section`
  padding: 14px 0;
  border-top: 1px solid #f0f1f3;

  &:first-child {
    padding-top: 0;
    border-top: 0;
  }

  &:last-child {
    padding-bottom: 0;
  }
`;

const ReviewSectionTitle = styled.h4`
  margin: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 700;
`;

const ReviewSectionDescription = styled.p`
  margin: 3px 0 10px;
  color: #7b8493;
  font-size: 12px;
  line-height: 1.45;
`;

const SelectedTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
`;

const TagEmptyState = styled.p`
  margin: 0;
  color: #8b94a3;
  font-size: 12px;
`;

const SessionReviewMetadataContext = createContext(null);

export const useSessionReviewMetadataContext = () => useContext(SessionReviewMetadataContext);

export const SessionReviewMetadataFeature = ({ children, sessionId }) => {
  const { state: userState } = useContext(UserContext);
  const currentUsername = typeof userState?.user?.username === 'string'
    ? userState.user.username
    : '';
  const controller = useSessionReviewMetadata({ currentUsername, sessionId });

  return (
    <SessionReviewMetadataContext.Provider value={{ controller, currentUsername }}>
      {/* Workspace notes live in Note & Share, not Session Labels, so this
          container must sit on the feature that wraps the replay page.
          Otherwise "Note added." waits until the playlist mounts the same id. */}
      <NotificationContainer
        containerId={REVIEW_METADATA_NOTIFICATION_ID}
        position="top-right"
        autoClose={5000}
        draggable
        limit={3}
        offset="1rem"
        theme="light"
      />
      {children}
      {/* One dialog for every notes surface, mounted outside the Note & Share
          popover so its portal cannot be unmounted mid-confirmation. */}
      <SessionNoteDeleteDialog controller={controller} />
    </SessionReviewMetadataContext.Provider>
  );
};

SessionReviewMetadataFeature.propTypes = {
  children: PropTypes.node.isRequired,
  sessionId: PropTypes.string.isRequired
};

export const SessionBookmarkControl = ({ variant = 'ribbon' }) => {
  const { controller } = useSessionReviewMetadataContext();
  const {
    bookmarkPending,
    metadata,
    metadataError,
    metadataLoading,
    toggleBookmark
  } = controller;
  const { bookmarked } = metadata;
  const label = bookmarked ? 'Remove session bookmark' : 'Bookmark session';
  const toolbar = variant === 'toolbar';

  return (
    <Tooltip
      as={BookmarkButton}
      type="button"
      className="flex"
      placement="left"
      title={label}
      $bookmarked={bookmarked}
      $toolbar={toolbar}
      disabled={metadataLoading || Boolean(metadataError)}
      aria-busy={bookmarkPending}
      aria-label={label}
      aria-pressed={bookmarked}
      onClick={toggleBookmark}
    >
      <IconBookmarkFilled aria-hidden="true" />
    </Tooltip>
  );
};

SessionBookmarkControl.propTypes = { variant: PropTypes.string };
export const SessionLabelsPanel = ({
  bodyId = 'behaviorlens-session-labels-body', embedded = false, expanded, frameless = false, labelledBy, onToggle, showHeader = true
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(!embedded);
  const panelOpen = expanded === undefined ? uncontrolledOpen : expanded;
  const togglePanel = onToggle || (() => setUncontrolledOpen(open => !open));
  const { controller } = useSessionReviewMetadataContext();
  const {
    loadMetadata,
    metadata,
    metadataError,
    metadataLoading
  } = controller;

  return (
    <CollapsibleInsightCard
      bodyId={bodyId}
      expanded={panelOpen}
      frameless={frameless}
      labelledBy={labelledBy}
      showHeader={showHeader}
      title="Session Labels"
      onToggle={togglePanel}
    >
      <PanelContent>
        {metadataLoading && (
          <ReviewLoading role="status">
            <Loader size="small" />
            <span>Loading session labels...</span>
          </ReviewLoading>
        )}
        {!metadataLoading && metadataError && (
          <>
            <Alert
              compact
              colorStyle="error"
              title="Session labels unavailable"
              description={metadataError}
            />
            <NoteComposerActions>
              <Button
                type="button"
                size="small"
                colorStyle="secondary"
                variant="outline"
                onClick={loadMetadata}
              >
                Retry
              </Button>
            </NoteComposerActions>
          </>
        )}
        {!metadataLoading && !metadataError && (
          <ReviewSection>
            <ReviewSectionTitle>Tags from saved moments</ReviewSectionTitle>
            <ReviewSectionDescription>
              This session set is the unique union of tags saved in Notes &amp; Tags.
            </ReviewSectionDescription>
            {metadata.tags.length > 0 ? (
              <SelectedTagList aria-label="Session tags">
                {metadata.tags.map(tag => (
                  <TagOptionPill
                    key={tag}
                    $color={SESSION_TAG_PRESENTATION[tag]?.color || '#6f76a7'}
                  >
                    {SESSION_TAG_PRESENTATION[tag]?.label || tag}
                  </TagOptionPill>
                ))}
              </SelectedTagList>
            ) : <TagEmptyState>No moment tags yet.</TagEmptyState>}
          </ReviewSection>
        )}
      </PanelContent>
    </CollapsibleInsightCard>
  );
};

SessionLabelsPanel.propTypes = {
  bodyId: PropTypes.string,
  embedded: PropTypes.bool,
  expanded: PropTypes.bool,
  frameless: PropTypes.bool,
  labelledBy: PropTypes.string,
  onToggle: PropTypes.func,
  showHeader: PropTypes.bool
};

export const SessionNotesPanel = ({
  bodyId = 'behaviorlens-session-notes-body',
  composerRows = 3,
  embedded = false,
  expanded,
  getReplayCurrentTime = RETURN_NULL,
  labelledBy,
  onNoteComposerFocus = NOOP,
  onSeekReplay = RETURN_FALSE,
  onScrollToReplay = NOOP,
  replayDurationMs = 0,
  replayReady = false,
  showDescription = true,
  showHeader = true,
  showNotesList = true
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(!embedded);
  const panelOpen = expanded === undefined ? uncontrolledOpen : expanded;
  const { mentionUsers, mentionUsersLoading } = useReviewMentionUsers();
  const { controller, currentUsername } = useSessionReviewMetadataContext();

  const NotesShell = showHeader ? SessionNotesCard : CollapsibleInsightCard;
  const notesShellProps = showHeader
    ? { 'data-testid': 'session-notes-panel' }
    : {
      bodyId,
      expanded: panelOpen,
      labelledBy,
      showHeader: false,
      title: 'Notes'
    };

  return (
    <NotesShell {...notesShellProps}>
      {showHeader && (embedded ? (
        <TimelineToggle
          type="button"
          aria-expanded={panelOpen}
          onClick={() => setUncontrolledOpen(open => !open)}
        >
          <span>Notes</span>
          <TimelineChevron $open={panelOpen}>▾</TimelineChevron>
        </TimelineToggle>
      ) : <CardTitle>Notes</CardTitle>)}

      {(!showHeader || panelOpen) && (
        <PanelContent $embedded={embedded}>
          {showDescription && (
            <ReviewSectionDescription>
              To reference a point in the replay, add a timestamp using the 00:00 format—for example, 01:25.
            </ReviewSectionDescription>
          )}

          <SessionNotesStateGate controller={controller}>
            <SessionNoteComposer
              controller={controller}
              rows={composerRows}
              getReplayCurrentTime={getReplayCurrentTime}
              mentionUsers={mentionUsers}
              mentionUsersLoading={mentionUsersLoading}
              onNoteComposerFocus={onNoteComposerFocus}
              replayReady={replayReady}
              variant="panel"
            />
            {showNotesList && (
              <SessionNotesList
                controller={controller}
                currentUsername={currentUsername}
                mentionUsers={mentionUsers}
                mentionUsersLoading={mentionUsersLoading}
                onReplyComposerOpen={onNoteComposerFocus}
                onScrollToReplay={onScrollToReplay}
                onSeekReplay={onSeekReplay}
                replayDurationMs={replayDurationMs}
                replayReady={replayReady}
              />
            )}
          </SessionNotesStateGate>
        </PanelContent>
      )}
    </NotesShell>
  );
};

SessionNotesPanel.propTypes = {
  bodyId: PropTypes.string,
  composerRows: PropTypes.number,
  embedded: PropTypes.bool,
  expanded: PropTypes.bool,
  getReplayCurrentTime: PropTypes.func,
  labelledBy: PropTypes.string,
  onNoteComposerFocus: PropTypes.func,
  onSeekReplay: PropTypes.func,
  onScrollToReplay: PropTypes.func,
  replayDurationMs: PropTypes.number,
  replayReady: PropTypes.bool,
  showDescription: PropTypes.bool,
  showHeader: PropTypes.bool,
  showNotesList: PropTypes.bool
};

const SessionReviewMetadataPanel = ({ embedded = false, sessionId, ...notesProps }) => (
  <SessionReviewMetadataFeature sessionId={sessionId}>
    <SessionBookmarkControl />
    <SessionLabelsPanel embedded={embedded} />
    <SessionNotesPanel embedded={embedded} {...notesProps} />
  </SessionReviewMetadataFeature>
);

SessionReviewMetadataPanel.propTypes = {
  embedded: PropTypes.bool,
  getReplayCurrentTime: PropTypes.func,
  onNoteComposerFocus: PropTypes.func,
  onSeekReplay: PropTypes.func,
  onScrollToReplay: PropTypes.func,
  replayDurationMs: PropTypes.number,
  replayReady: PropTypes.bool,
  sessionId: PropTypes.string.isRequired
};

export default SessionReviewMetadataPanel;
