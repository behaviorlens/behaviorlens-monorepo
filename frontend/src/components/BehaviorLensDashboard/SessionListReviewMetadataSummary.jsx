import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { UnstyledButton } from '../../ui';
import { IconBookmarkFilled } from '../../ui/icons';
import useSessionListReviewMetadata from './useSessionListReviewMetadata';
import { SESSION_TAG_PRESENTATION } from './behaviorLensSessionTags';

const VISIBLE_TAG_LIMIT = 4;
const FALLBACK_TAG_COLOR = '#6f76a7';

const ReviewMetadataContext = createContext(null);

const BOOKMARKED_COLOR = '#2563eb';
const BOOKMARKED_HOVER_COLOR = '#1d4ed8';
const UNBOOKMARKED_COLOR = '#6f76a7';
const UNBOOKMARKED_HOVER_COLOR = '#343c6a';

const BookmarkState = styled(UnstyledButton)`
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $bookmarked }) => ($bookmarked ? BOOKMARKED_COLOR : UNBOOKMARKED_COLOR)};
  cursor: pointer;
  user-select: none;
  transition: color 120ms ease;

  &:hover,
  &:focus,
  &:active {
    cursor: pointer;
  }

  &:hover,
  &:active {
    color: ${({ $bookmarked }) => ($bookmarked ? BOOKMARKED_HOVER_COLOR : UNBOOKMARKED_HOVER_COLOR)};
  }

  &:focus-visible {
    outline: 2px solid ${BOOKMARKED_COLOR};
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
    pointer-events: none;
  }
`;

const TagList = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
`;

// Compact version of the Figma tag pill so review tags read as the same family
// as the tag filter row without competing with the session identity.
const SessionListTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 18px;
  padding: 0 8px;
  border: 1px solid ${({ $color, $presentation }) => (
    $presentation?.color || $color
  )};
  border-radius: 9px;
  color: ${({ $color, $presentation }) => $presentation?.color || $color};
  background: ${({ $presentation }) => $presentation?.background || 'transparent'};
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
`;

const ReviewStatus = styled.span`
  color: ${({ $unavailable }) => ($unavailable ? '#9b3d32' : '#979dc6')};
  font-size: 11px;
  line-height: 1.35;
  white-space: nowrap;
`;

const IdentityReviewStatus = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${({ $status }) => ({
    in_review: '#f9a400',
    loading: '#979dc6',
    resolved: '#64b200',
    unreviewed: '#c90909'
  }[$status] || '#979dc6')};

  &::before {
    content: '·';
    margin: 0 4px;
  }

  > * + * {
    margin-left: 4px;
  }
`;

export const SessionListReviewMetadataProvider = ({
  children, onMetadataChange, revalidate = true, sessionId
}) => {
  const reviewMetadata = useSessionListReviewMetadata(sessionId, revalidate, onMetadataChange);

  return (
    <ReviewMetadataContext.Provider value={reviewMetadata}>
      {children}
    </ReviewMetadataContext.Provider>
  );
};

SessionListReviewMetadataProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onMetadataChange: PropTypes.func,
  revalidate: PropTypes.bool,
  sessionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

export const useSessionListReviewMetadataContext = () => useContext(ReviewMetadataContext);

const useReviewMetadataContext = useSessionListReviewMetadataContext;

export const SessionListReviewStatus = () => {
  const { review, reviewStatus } = useReviewMetadataContext();

  if (reviewStatus === 'unavailable') {
    return null;
  }
  if (reviewStatus !== 'ready') {
    return <IdentityReviewStatus $status="loading">Loading review...</IdentityReviewStatus>;
  }

  const status = review?.review_status || 'unreviewed';
  const reviewerName = typeof review?.reviewer_name === 'string'
    ? review.reviewer_name.trim()
    : '';
  const labels = {
    in_review: 'in review',
    resolved: reviewerName ? `reviewed by ${reviewerName}` : 'Reviewed',
    unreviewed: 'unreviewed'
  };
  const label = labels[status];

  if (!label) {
    return null;
  }

  return <IdentityReviewStatus $status={status}>{label}</IdentityReviewStatus>;
};

export const SessionListBookmarkIndicator = () => {
  const { bookmarkPending, metadata, toggleBookmark } = useReviewMetadataContext();

  if (!metadata) {
    return null;
  }

  const label = metadata.bookmarked ? 'Remove session bookmark' : 'Bookmark session';

  const handleClick = event => {
    event.preventDefault();
    event.stopPropagation();
    toggleBookmark();
  };

  return (
    <BookmarkState
      type="button"
      $bookmarked={metadata.bookmarked}
      aria-busy={bookmarkPending}
      aria-label={label}
      aria-pressed={metadata.bookmarked}
      onClick={handleClick}
    >
      <IconBookmarkFilled aria-hidden="true" />
    </BookmarkState>
  );
};

export const SessionListTagsSummary = () => {
  const { metadata, status } = useReviewMetadataContext();

  if (!metadata) {
    return (
      <ReviewStatus $unavailable={status === 'unavailable'}>
        {status === 'unavailable' ? 'Review unavailable' : 'Loading review...'}
      </ReviewStatus>
    );
  }

  const visibleTags = metadata.tags.slice(0, VISIBLE_TAG_LIMIT);
  const hiddenTagCount = metadata.tags.length - visibleTags.length;

  return (
    <>
      {metadata.tags.length ? (
        <TagList aria-label="Session tags" title={metadata.tags.join(', ')}>
          {visibleTags.map(tag => (
            <SessionListTag
              key={tag}
              $color={SESSION_TAG_PRESENTATION[tag]?.color || FALLBACK_TAG_COLOR}
              $presentation={SESSION_TAG_PRESENTATION[tag]}
            >
              {SESSION_TAG_PRESENTATION[tag]?.label || tag}
            </SessionListTag>
          ))}
          {hiddenTagCount > 0 && (
            <SessionListTag $color={FALLBACK_TAG_COLOR}>{`+${hiddenTagCount}`}</SessionListTag>
          )}
        </TagList>
      ) : <ReviewStatus>No Tags</ReviewStatus>}
      {status === 'unavailable' && (
        <ReviewStatus $unavailable>Refresh unavailable</ReviewStatus>
      )}
    </>
  );
};
