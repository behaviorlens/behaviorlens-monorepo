import React, {
  useContext, useEffect, useState
} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Alert,
  Button,
  Loader,
  Notification,
  NotificationContainer
} from '../../ui';
import { UserContext } from '../../store';
import CollapsibleInsightCard from './CollapsibleInsightCard';
import {
  formatReviewQueueDate,
  isSupportedSessionReviewStatus,
  isTerminalSessionReview,
  REVIEW_QUEUE_NOTIFICATION_ID
} from './behaviorLensReviewQueue';
import {
  InlinePriorityControl,
  InlineReviewerControl
} from './ReviewInlineControls';
import useSessionReviewQueue from './useSessionReviewQueue';
import { REVIEW_METADATA_NOTIFICATION_ID } from './useSessionReviewMetadata';

const PanelContent = styled.div`
  min-width: 0;
`;

const AddReviewerFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AddReviewerField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const AddReviewerFieldLabel = styled.span`
  color: #6f76a7;
  font-size: 12px;
  font-weight: 500;
  line-height: normal;
`;

const AddReviewerFieldValue = styled.div`
  min-width: 0;

  > div {
    max-width: none;
  }

  /* Match the Session Fields filter dropdown chrome. */
  button {
    height: 36px;
    min-height: 36px;
    padding: 0 11px;
    border-color: #c8ceed;
    border-radius: 4px;
    color: #0a1551;
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
  }

  button > span:first-of-type {
    padding-inline-start: 0;
  }

  .bl-avatar {
    margin-inline-start: -4px;
  }
`;

const PanelState = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: #64748b;
  font-size: 12px;
`;

const PanelActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const ReviewFieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(92px, 112px) minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 48px;
  border-bottom: 1px solid #eef1f5;

  @media (max-width: 520px) {
    grid-template-columns: 88px minmax(0, 1fr);
  }
`;

const ReviewFieldLabel = styled.span`
  color: #7b8494;
  font-size: 12px;
  font-weight: 600;
`;

const ReviewFieldValue = styled.div`
  min-width: 0;
  color: #1f2937;
`;

const LastUpdated = styled.div`
  padding-top: 10px;
  color: #98a1b1;
  font-size: 11px;
  line-height: 1.4;
`;

const SaveAction = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
`;

const SaveButton = styled(Button)`
  && {
    min-width: 80px;
    height: 32px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
`;

const CompactReviewSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  div {
    min-width: 0;
    border-radius: 8px;
    padding: 10px;
    background: #f7f9fc;
  }
  span {
    display: block;
    margin-bottom: 4px;
    color: #8b95a7;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }
  strong {
    display: block;
    overflow: hidden;
    color: #273349;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const SessionReviewQueuePanel = ({
  addReviewerMode, bodyId, compact, embedded, expanded, frameless, labelledBy, onSave, onToggle,
  sessionId, showHeader
}) => {
  const { state: userState } = useContext(UserContext);
  const currentUsername = typeof userState?.user?.username === 'string'
    ? userState.user.username
    : '';
  const [uncontrolledOpen, setUncontrolledOpen] = useState(!embedded);
  const [reviewerPickerOpen, setReviewerPickerOpen] = useState(false);
  const panelOpen = expanded === undefined ? uncontrolledOpen : expanded;
  const togglePanel = onToggle || (() => setUncontrolledOpen(open => !open));
  const controller = useSessionReviewQueue({ currentUsername, sessionId });
  const {
    error,
    load,
    loading,
    mutationError,
    record,
    saving,
    update
  } = controller;
  const [draftPriority, setDraftPriority] = useState('');
  const [draftReviewer, setDraftReviewer] = useState('');
  const [savePending, setSavePending] = useState(false);
  const fieldsDisabled = !currentUsername
    || !isSupportedSessionReviewStatus(record?.review_status);
  const handleSave = async event => {
    event?.preventDefault?.();
    if (savePending) {
      return;
    }
    if (addReviewerMode && record) {
      const changes = {};
      if ((draftPriority || '') !== (record.priority || '')) {
        changes.priority = draftPriority;
      }
      if ((draftReviewer || '') !== (record.reviewer || '')) {
        changes.reviewer = draftReviewer || null;
      }
      if (Object.keys(changes).length > 0) {
        setSavePending(true);
        try {
          const updated = await update(changes);
          if (!updated) {
            return;
          }
        } finally {
          setSavePending(false);
        }
      }
    }
    Notification.show({
      description: 'Review saved.',
      colorStyle: 'success',
      containerId: REVIEW_METADATA_NOTIFICATION_ID
    });
    onSave();
  };

  useEffect(() => {
    setDraftPriority(record?.priority || '');
    setDraftReviewer(record?.reviewer || '');
  }, [record?.priority, record?.reviewer, sessionId]);

  useEffect(() => {
    setReviewerPickerOpen(false);
  }, [sessionId]);

  return (
    <>
      <NotificationContainer
        containerId={REVIEW_QUEUE_NOTIFICATION_ID}
        position="top-right"
        autoClose={5000}
        draggable
        limit={3}
        offset="1rem"
        theme="light"
      />
      <CollapsibleInsightCard
        bodyId={bodyId}
        expanded={panelOpen}
        frameless={frameless}
        labelledBy={labelledBy}
        showHeader={showHeader}
        title="Review"
        onToggle={togglePanel}
      >
        <PanelContent
          onKeyDown={event => {
            if (reviewerPickerOpen && event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              setReviewerPickerOpen(false);
            }
          }}
        >
          {loading && (
          <PanelState role="status">
            <Loader size="small" />
            <span>Loading Review status...</span>
          </PanelState>
          )}
          {!loading && error && (
          <>
            <Alert
              compact colorStyle="error" title="Review unavailable"
              description={error}
            />
            {!isTerminalSessionReview(record) && (
            <PanelActions>
              <Button
                type="button"
                size="small"
                colorStyle="secondary"
                variant="outline"
                onClick={load}
              >
                Retry
              </Button>
            </PanelActions>
            )}
          </>
          )}
          {!loading && !error && !record && (
          <>
            <PanelState>This session is not in Review.</PanelState>
          </>
          )}
          {!loading && !error && record && (
          <>
            {compact ? (
              <CompactReviewSummary data-testid="behaviorlens-review-compact-summary">
                <div>
                  <span>Status</span>
                  <strong>{record.review_status || '-'}</strong>
                </div>
                <div>
                  <span>Priority</span>
                  <strong>{record.priority || '-'}</strong>
                </div>
                <div>
                  <span>Reviewer</span>
                  <strong>{record.reviewer || 'Unassigned'}</strong>
                </div>
              </CompactReviewSummary>
            ) : addReviewerMode ? (
              <form
                onSubmit={event => {
                  event.preventDefault();
                }}
              >
                <AddReviewerFields>
                  <AddReviewerField>
                    <AddReviewerFieldLabel>Reviewer</AddReviewerFieldLabel>
                    <AddReviewerFieldValue>
                      <InlineReviewerControl
                        avatarSize="3x-small"
                        commitOnChange={false}
                        controlId={`review-reviewer-${sessionId}`}
                        value={draftReviewer}
                        onChange={({ reviewer }) => setDraftReviewer(reviewer || '')}
                        matchPopoverBottom
                        placeholder="Select a reviewer..."
                        scrollFades
                        showArrow
                        disabled={fieldsDisabled}
                      />
                    </AddReviewerFieldValue>
                  </AddReviewerField>
                  <AddReviewerField>
                    <AddReviewerFieldLabel>Priority</AddReviewerFieldLabel>
                    <AddReviewerFieldValue>
                      <InlinePriorityControl
                        commitOnChange={false}
                        controlId={`review-priority-${sessionId}`}
                        value={draftPriority}
                        onChange={({ priority }) => setDraftPriority(priority || '')}
                        showArrow
                        disabled={fieldsDisabled}
                      />
                    </AddReviewerFieldValue>
                  </AddReviewerField>
                </AddReviewerFields>
                {onSave && (
                  <SaveAction $addReviewerMode>
                    <SaveButton
                      $addReviewerMode
                      type="button"
                      colorStyle="primary"
                      variant="filled"
                      size="small"
                      disabled={savePending}
                      onClick={handleSave}
                    >
                      Save
                    </SaveButton>
                  </SaveAction>
                )}
              </form>
            ) : reviewerPickerOpen ? (
              <InlineReviewerControl
                controlId={`review-reviewer-${sessionId}`}
                value={record.reviewer}
                onUpdate={update}
                onPickerClose={() => setReviewerPickerOpen(false)}
                pickerMode
                disabled={fieldsDisabled}
              />
            ) : (
              <>
                <ReviewFieldRow>
                  <ReviewFieldLabel>Priority</ReviewFieldLabel>
                  <ReviewFieldValue>
                    <InlinePriorityControl
                      controlId={`review-priority-${sessionId}`}
                      value={record.priority}
                      onUpdate={update}
                      disabled={fieldsDisabled}
                    />
                  </ReviewFieldValue>
                </ReviewFieldRow>
                <ReviewFieldRow>
                  <ReviewFieldLabel>Reviewer</ReviewFieldLabel>
                  <ReviewFieldValue>
                    <InlineReviewerControl
                      controlId={`review-reviewer-${sessionId}`}
                      value={record.reviewer}
                      onOpenPicker={() => setReviewerPickerOpen(true)}
                      onUpdate={update}
                      disabled={fieldsDisabled}
                    />
                  </ReviewFieldValue>
                </ReviewFieldRow>
                <LastUpdated>
                  {`Last updated ${formatReviewQueueDate(record.updated_at)}`}
                </LastUpdated>
                {onSave && (
                  <SaveAction>
                    <SaveButton
                      type="button"
                      colorStyle="primary"
                      variant="filled"
                      size="small"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      Save
                    </SaveButton>
                  </SaveAction>
                )}
              </>
            )}
            {mutationError && (
            <Alert
              compact
              colorStyle="error"
              title="Changes not saved"
              description={mutationError}
            />
            )}
          </>
          )}
        </PanelContent>
      </CollapsibleInsightCard>
    </>
  );
};

SessionReviewQueuePanel.propTypes = {
  addReviewerMode: PropTypes.bool,
  bodyId: PropTypes.string,
  compact: PropTypes.bool,
  embedded: PropTypes.bool,
  expanded: PropTypes.bool,
  frameless: PropTypes.bool,
  labelledBy: PropTypes.string,
  onSave: PropTypes.func,
  onToggle: PropTypes.func,
  sessionId: PropTypes.string.isRequired,
  showHeader: PropTypes.bool
};

SessionReviewQueuePanel.defaultProps = {
  addReviewerMode: false,
  bodyId: 'behaviorlens-review-body',
  compact: false,
  embedded: false,
  expanded: undefined,
  frameless: false,
  labelledBy: undefined,
  onSave: undefined,
  onToggle: undefined,
  showHeader: true
};

export default SessionReviewQueuePanel;
