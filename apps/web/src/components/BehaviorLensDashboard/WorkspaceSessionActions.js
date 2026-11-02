import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../../ui';
import {
  IconAngleLeft,
  IconAngleRight,
  IconUserPlusFilled,
  IconXmark
} from '../../ui/icons';
import {
  WorkspaceActionCluster,
  WorkspaceActionPopover,
  WorkspaceActionPopoverBody,
  WorkspaceActionPopoverClose,
  WorkspaceActionPopoverHeader,
  WorkspaceActionPopoverTitle,
  WorkspaceIconButton,
  WorkspacePosition
} from './ScBehaviorLensWorkspace';
import {
  SessionBookmarkControl
} from './SessionReviewMetadataPanel';
import SessionReviewQueuePanel from './SessionReviewQueuePanel';

const POPOVER_REVIEW = 'review';

const WorkspaceSessionActions = ({ onNavigateSession, recentSessions, sessionId }) => {
  const [openPopover, setOpenPopover] = useState(null);
  const clusterRef = useRef(null);
  const positionLabel = recentSessions.getPositionLabel();

  useEffect(() => {
    setOpenPopover(null);
  }, [sessionId]);

  useEffect(() => {
    if (!openPopover) {
      return undefined;
    }
    const closeOnOutside = event => {
      if (!clusterRef.current?.contains(event.target)) {
        setOpenPopover(null);
      }
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openPopover]);

  const togglePopover = name => setOpenPopover(current => (current === name ? null : name));

  return (
    <WorkspaceActionCluster ref={clusterRef} data-testid="behaviorlens-workspace-actions">
      <Button
        type="button"
        colorStyle="primary"
        variant="filled"
        size="small"
        startIcon={IconUserPlusFilled}
        aria-expanded={openPopover === POPOVER_REVIEW}
        aria-haspopup="dialog"
        aria-controls="behaviorlens-review-popover"
        onClick={() => togglePopover(POPOVER_REVIEW)}
      >
        Add Reviewer
      </Button>
      <SessionBookmarkControl variant="toolbar" />
      <WorkspaceIconButton
        type="button"
        $muted
        $chevron
        aria-label="Previous session"
        disabled={recentSessions.loading || !recentSessions.previous}
        onClick={() => onNavigateSession(recentSessions.previous)}
        data-testid="behaviorlens-rail-prev"
      >
        <IconAngleLeft aria-hidden="true" />
      </WorkspaceIconButton>
      <WorkspaceIconButton
        type="button"
        $muted
        $chevron
        aria-label="Next session"
        disabled={recentSessions.loading || !recentSessions.next}
        onClick={() => onNavigateSession(recentSessions.next)}
        data-testid="behaviorlens-rail-next"
      >
        <IconAngleRight aria-hidden="true" />
      </WorkspaceIconButton>
      {positionLabel ? (
        <WorkspacePosition data-testid="behaviorlens-rail-position">{positionLabel}</WorkspacePosition>
      ) : (
        <WorkspacePosition data-testid="behaviorlens-rail-position-unavailable">
          {recentSessions.loading ? 'Loading…' : 'Not in list'}
        </WorkspacePosition>
      )}
      {openPopover === POPOVER_REVIEW && (
        <WorkspaceActionPopover
          id="behaviorlens-review-popover"
          role="dialog"
          aria-label="Add Reviewer"
          data-testid="behaviorlens-review-popover"
        >
          <WorkspaceActionPopoverHeader>
            <WorkspaceActionPopoverTitle>Add Reviewer</WorkspaceActionPopoverTitle>
            <WorkspaceActionPopoverClose
              type="button"
              aria-label="Close Add Reviewer"
              onClick={() => setOpenPopover(null)}
            >
              <IconXmark aria-hidden="true" />
            </WorkspaceActionPopoverClose>
          </WorkspaceActionPopoverHeader>
          <WorkspaceActionPopoverBody>
            <SessionReviewQueuePanel
              key={`review-queue-${sessionId}`}
              addReviewerMode
              bodyId="behaviorlens-review-body"
              sessionId={sessionId}
              expanded
              frameless
              onSave={() => setOpenPopover(null)}
              showHeader={false}
            />
          </WorkspaceActionPopoverBody>
        </WorkspaceActionPopover>
      )}
    </WorkspaceActionCluster>
  );
};

WorkspaceSessionActions.propTypes = {
  onNavigateSession: PropTypes.func.isRequired,
  recentSessions: PropTypes.object.isRequired,
  sessionId: PropTypes.string.isRequired
};

export default WorkspaceSessionActions;
