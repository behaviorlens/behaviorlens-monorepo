import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '../../ui';
import { IconPlayFilled } from '../../ui/icons';
import {
  BookmarkBlock,
  ContextBlock,
  ContextLabel,
  IdentityBlock,
  IdentityName,
  PathUrlContainer,
  PathUrlTooltipTrigger,
  PlayPill,
  RowMetaSlot,
  RowSubText,
  SessionRow,
  SkeletonBlock
} from './ScBehaviorLensSessionListPage';
import {
  VisitorContextLabel,
  VisitorContextLabels
} from './ScBehaviorLensSessionListVisitorContext';
import { SessionRowLink } from './ScBehaviorLensSessionNavigation';
import {
  SessionListBookmarkIndicator,
  SessionListReviewStatus,
  SessionListTagsSummary,
  useSessionListReviewMetadataContext
} from '../review/SessionListReviewMetadataSummary';
import {
  buildSessionMetaLine,
  formatSessionDuration,
  formatSessionDurationCompact,
  getSessionIdentity
} from './behaviorLensSessionRows';

const PathUrlTooltip = ({ url }) => {
  const visibleUrl = url.replace(/^https?:\/\/[^/]+(?=\/|$)/iu, '');

  return (
    <PathUrlContainer>
      <Tooltip
        as={PathUrlTooltipTrigger}
        tabIndex={0}
        title={url}
        tooltipStyle={{
          maxWidth: '320px',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal'
        }}
        usePortal
      >
        {visibleUrl}
      </Tooltip>
    </PathUrlContainer>
  );
};

PathUrlTooltip.propTypes = {
  url: PropTypes.string.isRequired
};

const SessionListRow = ({
  contextLabel = '',
  contextVariant = 'matches',
  country = '',
  detailLocation,
  entered = false,
  session,
  sessionId,
  showBookmark = true,
  showTags = true
}) => {
  const duration = formatSessionDuration(session.duration_s);
  const visitorContextLabels = contextVariant === 'visitor'
    ? contextLabel.split(' · ').filter(Boolean)
    : [];
  // The row itself is the visibility anchor so review metadata still loads
  // lazily when both the tags and the bookmark indicator are hidden.
  const { observeRef } = useSessionListReviewMetadataContext();

  return (
    <SessionRow $entered={entered} ref={observeRef}>
      <SessionRowLink
        to={detailLocation}
        aria-label={`Open session ${sessionId}, duration ${duration}`}
      />
      <PlayPill aria-hidden="true">
        <IconPlayFilled />
        {formatSessionDurationCompact(session.duration_s)}
      </PlayPill>

      <IdentityBlock>
        <IdentityName>
          <span>{getSessionIdentity(session, sessionId)}</span>
          <SessionListReviewStatus />
        </IdentityName>
        <RowSubText>{buildSessionMetaLine({ country, session })}</RowSubText>
        {showTags && (
          <RowMetaSlot>
            <SessionListTagsSummary />
          </RowMetaSlot>
        )}
      </IdentityBlock>

      <ContextBlock $variant={contextVariant}>
        {visitorContextLabels.length > 0 ? (
          <VisitorContextLabels>
            {visitorContextLabels.map(label => (
              <VisitorContextLabel key={label}>{label}</VisitorContextLabel>
            ))}
          </VisitorContextLabels>
        ) : (
          contextLabel && <ContextLabel $variant={contextVariant}>{contextLabel}</ContextLabel>
        )}
        <PathUrlTooltip url={session.url || '-'} />
      </ContextBlock>

      <BookmarkBlock>
        {showBookmark && <SessionListBookmarkIndicator />}
      </BookmarkBlock>
    </SessionRow>
  );
};

SessionListRow.propTypes = {
  contextLabel: PropTypes.string,
  contextVariant: PropTypes.string,
  country: PropTypes.string,
  detailLocation: PropTypes.object.isRequired,
  entered: PropTypes.bool,
  session: PropTypes.object.isRequired,
  sessionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  showBookmark: PropTypes.bool,
  showTags: PropTypes.bool
};

export const SessionListRowSkeleton = ({ showTags = true }) => (
  <SessionRow $skeleton>
    <PlayPill aria-hidden="true">
      <SkeletonBlock $width={40} $height={12} />
    </PlayPill>
    <IdentityBlock>
      <SkeletonBlock $width="45%" $height={15} />
      <SkeletonBlock $width="75%" $height={13} />
      {showTags && <SkeletonBlock $width={110} $height={18} />}
    </IdentityBlock>
    <ContextBlock>
      <SkeletonBlock $width="60%" $height={14} />
      <SkeletonBlock $width="90%" $height={13} />
    </ContextBlock>
    <BookmarkBlock>
      <SkeletonBlock $width={16} $height={16} />
    </BookmarkBlock>
  </SessionRow>
);

SessionListRowSkeleton.propTypes = {
  showTags: PropTypes.bool
};

export default SessionListRow;
