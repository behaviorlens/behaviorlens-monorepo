import React from 'react';
import PropTypes from 'prop-types';
import { buildSharedItemTarget } from './behaviorLensSharedWithMe';
import SessionDetailPage from './SessionDetailPage';
import SharedMentionBanner from './SharedMentionBanner';
import {
  SharedWorkspaceContent,
  SharedWorkspaceModal,
  SharedWorkspaceModalBody
} from './ScBehaviorLensSharedWithMe';

export const buildSharedWorkspaceLocation = item => {
  const target = buildSharedItemTarget(item);
  const queryIndex = target.indexOf('?');
  return {
    pathname: queryIndex >= 0 ? target.slice(0, queryIndex) : target,
    search: `${queryIndex >= 0 ? target.slice(queryIndex) : '?'}&workspaceOverlay=1`,
    state: null
  };
};

const SharedReplayWorkspaceModal = ({
  item = null, onClose, onDeleteNote, onDeleteReply, onEditNote, onEditReply, onReply,
  onRestoreReply, replies = []
}) => {
  if (!item) return null;

  return (
    <SharedWorkspaceModal
      open
      fitOnMobile
      size="xxlarge"
      ariaLabel={`Session workspace: ${item.title}`}
      onClose={onClose}
      data-testid="behaviorlens-shared-workspace-modal"
    >
      <SharedWorkspaceModalBody noPadding>
        <SharedWorkspaceContent data-testid="behaviorlens-shared-workspace-content">
          <SessionDetailPage
            workspaceOverlayBanner={(
              <SharedMentionBanner
                item={item}
                onDeleteNote={onDeleteNote}
                onDeleteReply={onDeleteReply}
                onEditNote={onEditNote}
                onEditReply={onEditReply}
                onReply={onReply}
                onRestoreReply={onRestoreReply}
                replies={replies}
              />
            )}
            onWorkspaceOverlayClose={onClose}
            sessionIdOverride={item.sessionId}
            locationOverride={buildSharedWorkspaceLocation(item)}
          />
        </SharedWorkspaceContent>
      </SharedWorkspaceModalBody>
    </SharedWorkspaceModal>
  );
};

SharedReplayWorkspaceModal.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    sessionId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  }),
  onClose: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onDeleteReply: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
  onEditReply: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
  onRestoreReply: PropTypes.func.isRequired,
  replies: PropTypes.array
};

export default SharedReplayWorkspaceModal;
