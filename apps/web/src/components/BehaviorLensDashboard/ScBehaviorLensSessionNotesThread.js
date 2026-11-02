import React, {
  useLayoutEffect, useRef, useState
} from 'react';
import PropTypes from 'prop-types';
import styled, { css, keyframes } from 'styled-components';
import { Avatar, Menu, Textarea } from '../../ui';
import {
  railComposerActions,
  railComposerField
} from './ScBehaviorLensSessionNotesComposer';

export const fadeNoteCardRevealHighlight = keyframes`
  from {
    background-color: #fff5d2;
    box-shadow:
      inset 0 0 0 2px #fff5d2,
      0 1px 3px rgba(13, 20, 51, 0.12);
  }

  to {
    background-color: #fff;
    box-shadow:
      inset 0 0 0 2px rgba(255, 245, 210, 0),
      0 1px 3px rgba(13, 20, 51, 0.12);
  }
`;

export const NoteItem = styled.article`
  padding: 14px 0;
  border-bottom: 1px solid #e9ebef;

  ${({ $highlighted, $rail }) => $highlighted && $rail && css`
    animation: ${fadeNoteCardRevealHighlight} 5s linear forwards;
  `}

  &:last-child {
    border-bottom: 0;
    padding-bottom: ${({ $rail }) => ($rail ? '20px' : '0')};
  }
`;

export const NoteEntry = styled.div`
  display: ${({ $rail }) => ($rail ? 'grid' : 'block')};
  grid-template-columns: ${({ $rail, $replyOnly }) => (
    $rail ? ($replyOnly ? 'minmax(0, 1fr)' : '32px minmax(0, 1fr)') : 'none'
  )};
  align-items: start;
  gap: ${({ $rail }) => ($rail ? '8px' : '0')};
`;

export const NoteAvatar = styled(Avatar)`
  &&,
  && > span {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
`;

export const alwaysVisibleCommentActions = css`
  > [data-comment-actions-menu] {
    opacity: 1;
    pointer-events: auto;
  }
`;

export const NoteBody = styled.div`
  position: relative;
  min-width: 0;
`;

/* Content-sized containing block for the reply spine. NoteBody can inherit
   leftover preview/rail height; pinning the line to that box ran it down to
   Go to Session. */
export const NoteThreadStack = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  height: fit-content;
`;

export const fadeNoteRevealHighlight = keyframes`
  from {
    background-color: #fff5d2;
    box-shadow: 0 0 0 8px rgba(255, 245, 210, 1);
  }

  to {
    background-color: rgba(255, 245, 210, 0);
    box-shadow: 0 0 0 8px rgba(255, 245, 210, 0);
  }
`;

export const noteRevealHighlight = css`
  border-radius: 4px;
  animation: ${fadeNoteRevealHighlight} 5s linear forwards;
`;

export const NoteHighlightSurface = styled.div`
  ${({ $highlighted }) => $highlighted && noteRevealHighlight}
`;

export const NotePrimaryContent = styled.div`
  position: relative;
  padding-right: ${({ $hasMenu }) => ($hasMenu ? '16px' : '0')};

  ${({ $hasMenu }) => $hasMenu && alwaysVisibleCommentActions}
`;

export const OverflowMenuPosition = styled.div.attrs({
  'data-comment-actions-menu': ''
})`
  position: absolute;
  z-index: 1;
  top: ${({ $rail }) => ($rail ? '0' : '-6px')};
  right: ${({ $rail }) => ($rail ? '-6px' : '0')};
`;

export const OverflowMenuTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #5b6577;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: #eef1f6;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }

  ${({ $rail }) => $rail && css`
    width: auto;
    height: auto;
    border: 0;
    border-radius: 0;
    color: #6c73a8;
    background: transparent;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover,
    &:focus-visible,
    &[aria-expanded='true'] {
      background: transparent;
      color: #0a1551;
    }
  `}
`;

export const CommentMenu = styled(Menu)`
  ${({ $rail }) => $rail && css`
    && {
      width: max-content;
      min-width: 0;
    }

    && .bl-menu-list {
      padding: 8px;
    }

    && .bl-menu-item {
      padding: 2px 0;
    }

    && .bl-menu-item-button {
      min-height: 0;
      padding: 8px 10px;
      gap: 4px;
      color: #6c73a8;
      font-size: 12px;
      font-weight: 700;
    }

    && .bl-menu-item-title {
      color: inherit;
      font-size: 12px;
      font-weight: inherit;
    }

    && .bl-menu-item-button svg {
      width: 12px;
      height: 12px;
      color: inherit;
    }

    && .bl-menu-item-button[data-color='error'] {
      color: #dc2626;
    }
  `}
`;

export const NoteHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;

  ${({ $rail }) => $rail && css`
    justify-content: flex-start;
    margin-bottom: 16px;
  `}
`;

export const NoteAuthor = styled.strong`
  min-width: 0;
  overflow: hidden;
  color: #374151;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${({ $rail }) => $rail && css`
    color: #0a1551;
    font-size: 14px;
    font-weight: 500;
  `}
`;

export const NoteDate = styled.span.attrs({
  'data-note-date': ''
})`
  flex: 0 0 auto;
  color: #8b93a1;
  font-size: 11px;

  ${({ $rail }) => $rail && css`
    color: #6c73a8;
    font-size: 12px;
  `}
`;

export const NoteText = styled.p`
  margin: 0;
  color: #283240;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;

  ${({ $rail }) => $rail && css`
    color: #343c6a;
    font-size: 13px;
    line-height: normal;
  `}
`;

export const NoteTimestampButton = styled.button`
  display: inline;
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: #1463ff;
  cursor: pointer;
  font: inherit;
  line-height: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  vertical-align: baseline;

  &:hover:not(:disabled),
  &:focus-visible {
    color: #0d4db8;
    text-decoration-thickness: 2px;
  }

  &:disabled {
    color: #8b93a1;
    cursor: not-allowed;
  }
`;

export const railQuietReply = css`
  gap: 8px;

  > .bl-button {
    justify-content: flex-start;
    width: max-content;
    height: auto;
    min-width: 0;
    min-height: 0;
    margin: 0;
    padding: 0;
    gap: 4px;
    background: transparent;
    box-shadow: none;
    color: #6c73a8;
    font-size: 12px;
    font-weight: 700;

    > span {
      padding: 0;
      color: inherit;
      font-size: 12px;
    }

    svg {
      flex: 0 0 auto;
      width: 12px;
      height: 12px;
    }

    &:hover:not(:disabled),
    &:focus-visible {
      background: transparent;
      box-shadow: none;
      color: #0a1551;
    }
  }

  > .bl-button[data-destructive='true'] {
    color: #dc2626;

    &:hover:not(:disabled),
    &:focus-visible {
      color: #b42318;
    }
  }
`;

export const railReplyActions = css`
  justify-content: flex-start;
  gap: 16px;
  margin-top: 8px;

  .bl-button {
    width: auto;
    min-width: 0;
    height: 32px;
    min-height: 32px;
    padding: 0;
    font-size: 12px;
  }
`;

export const NoteActions = styled.div.attrs({
  'data-note-actions': ''
})`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;

  ${({ $rail }) => ($rail ? css`
    ${railReplyActions}
    ${railQuietReply}
  ` : css`
    > .bl-button {
      background: transparent;
      color: #343c6a;
    }

    > .bl-button:hover:not(:disabled) {
      background: transparent;
      color: #0a1551;
    }
  `)}
`;

export const ReplyThreadFrame = styled.div`
  ${({ $scrollReplies }) => ($scrollReplies ? css`
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    width: 100%;
    min-height: 0;
    overflow: hidden;
  ` : css`
    display: contents;
  `)}
`;

export const ReplyThread = styled.div`
  display: grid;
  gap: 14px;
  margin-top: 4px;

  ${({ $activityOnly, $rail, $visible }) => $rail && css`
    display: ${$visible ? 'grid' : 'none'};
    gap: 16px;
    margin: ${$activityOnly ? '0' : '16px 0 0'};
  `}

  ${({ $scrollReplies }) => $scrollReplies && css`
    flex: 1 1 auto;
    min-height: 0;
    margin-top: 0;
    padding: 10px 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  `}
`;

export const ReplyThreadFade = styled.div`
  position: absolute;
  z-index: 2;
  right: 0;
  ${({ $edge }) => ($edge === 'top' ? 'top: 0;' : 'bottom: 0;')}
  left: 0;
  height: 24px;
  opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
  background: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0))'
    : 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.72))')};
  mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.72) 35%, rgba(0, 0, 0, 0.25) 72%, transparent 100%)'
    : 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.25) 28%, rgba(0, 0, 0, 0.72) 65%, #000 100%)')};
  backdrop-filter: blur(2px);
  -webkit-mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.72) 35%, rgba(0, 0, 0, 0.25) 72%, transparent 100%)'
    : 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.25) 28%, rgba(0, 0, 0, 0.72) 65%, #000 100%)')};
  -webkit-backdrop-filter: blur(2px);
  transition: none;
  will-change: opacity;
`;

export const RepliesConnector = styled.span`
  position: absolute;
  z-index: 0;
  top: 31px;
  bottom: 16px;
  left: ${({ $activityRoot }) => ($activityRoot ? '16px' : '-24px')};
  width: 1px;
  background: #dfe3eb;
  pointer-events: none;
`;

export const RepliesToggleRow = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  width: max-content;
  margin-top: 8px;

  ${({ $rail, $threadEnd }) => $rail && css`
    margin-top: ${$threadEnd ? '-8px' : '8px'};

    &::before {
      position: absolute;
      z-index: -1;
      top: -8px;
      left: -24px;
      width: 24px;
      height: calc(50% + 8px);
      border-bottom: 1px solid #dfe3eb;
      border-left: 1px solid #dfe3eb;
      border-bottom-left-radius: 12px;
      content: '';
      pointer-events: none;
    }
  `}
`;

export const RepliesToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #343c6a;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
    color: #6f76a7;
    transition: transform 120ms ease;
  }

  &[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }

  &:hover {
    background: transparent;
    color: #0a1551;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }

  ${({ $rail }) => $rail && css`
    margin-top: 0;
    padding: 0;
    border-radius: 0;
    color: #343c6a;
    font-size: 12px;
    font-weight: 400;
    line-height: normal;

    svg {
      display: block;
      flex: 0 0 12px;
      width: 12px;
      height: 12px;
      color: inherit;
    }

    &:hover {
      color: #0a1551;
    }
  `}
`;

export const ReplyRow = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  margin-left: 18px;
  color: #4b5563;
  font-size: 12px;
  line-height: 1.45;

  ${({ $highlighted }) => $highlighted && noteRevealHighlight}

  ${({ $activityOnly, $rail }) => $rail && css`
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    grid-template-columns: 32px minmax(0, 1fr);
    gap: ${$activityOnly ? '8px' : '10px'};
    margin-right: 0;
    margin-left: ${$activityOnly ? '0' : '16px'};
    color: #0a1551;
    line-height: normal;

    &::before {
      display: ${$activityOnly ? 'none' : 'block'};
      position: absolute;
      z-index: -1;
      top: 0;
      left: -40px;
      width: 40px;
      height: 16px;
      border-bottom: 1px solid #dfe3eb;
      border-left: 1px solid #dfe3eb;
      border-bottom-left-radius: 12px;
      content: '';
      pointer-events: none;
    }
  `}

  ${({ $editing }) => $editing && css`
    position: relative;
    z-index: 3;
  `}

  ${({ $activityChild }) => $activityChild && css`
    margin-left: 56px;
  `}

  ${({ $lastActivityChild }) => $lastActivityChild && css`
    &::after {
      position: absolute;
      z-index: -1;
      top: 14px;
      bottom: -32px;
      left: -42px;
      width: 5px;
      background: #fff;
      content: '';
      pointer-events: none;
    }
  `}
`;

export const ReplyAvatar = styled(Avatar)`
  &&,
  && > span {
    width: 28px;
    height: 28px;
    min-width: 28px;
  }

  ${({ $rail }) => $rail && css`
    &&,
    && > span {
      width: 32px;
      height: 32px;
      min-width: 32px;
    }
  `}
`;

export const ReplyBody = styled.div`
  position: relative;
  min-width: 0;
  padding-right: ${({ $hasMenu }) => ($hasMenu ? '16px' : '0')};

  ${({ $hasMenu }) => $hasMenu && alwaysVisibleCommentActions}
`;

export const ReplyPrimaryContent = styled.div``;

export const ReplyHeader = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 2px;

  ${({ $activityOnly, $rail }) => $rail && css`
    align-items: ${$activityOnly ? 'baseline' : 'center'};
    gap: 8px;
    margin-bottom: 16px;
  `}
`;

export const ReplyMeta = styled.strong`
  color: #374151;

  ${({ $rail }) => $rail && css`
    color: #0a1551;
    font-size: 14px;
    font-weight: 500;
  `}
`;

export const ReplyDate = styled.time`
  color: #8b93a1;
  font-size: 10.5px;

  ${({ $rail }) => $rail && css`
    color: #6c73a8;
    font-size: 12px;
  `}
`;

export const ReplyText = styled.div`
  color: #283240;
  overflow-wrap: anywhere;
  white-space: pre-wrap;

  ${({ $rail }) => $rail && css`
    color: #0a1551;
    font-size: 13px;
  `}

`;

export const CollapsibleTextContent = styled.span`
  display: block;
  overflow-wrap: anywhere;
  word-break: break-all;

  ${({ $clamped }) => $clamped && css`
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  `}
`;

export const TextExpansionToggle = styled.button`
  display: inline;
  align-self: flex-start;
  margin: 2px 0 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $rail }) => ($rail ? '#343c6a' : '#283240')};
  font-family: inherit;
  font-size: ${({ $reply, $rail }) => ($reply || $rail ? '12px' : '13px')};
  line-height: ${({ $rail }) => ($rail ? 'normal' : '1.5')};
  text-align: left;
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: #0a1551;
  }

  &:focus-visible {
    border-radius: 2px;
    outline: 2px solid #0075e3;
    outline-offset: 2px;
  }
`;

export const CollapsibleSessionText = ({
  children, clamp, contentKey, rail, reply
}) => {
  const textRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const TextComponent = reply ? ReplyText : NoteText;
  const canClamp = clamp !== false && rail;

  useLayoutEffect(() => {
    const node = textRef.current;
    if (!canClamp || !node || expanded) return undefined;

    const measure = () => setCanExpand(node.scrollHeight > node.clientHeight + 1);
    measure();

    if (typeof window.ResizeObserver !== 'function') return undefined;
    const observer = new window.ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [canClamp, contentKey, expanded]);

  return (
    <>
      <TextComponent $rail={rail}>
        <CollapsibleTextContent ref={textRef} $clamped={canClamp && !expanded}>
          <span>{children}</span>
        </CollapsibleTextContent>
      </TextComponent>
      {canClamp && canExpand && (
        <TextExpansionToggle
          $rail={rail}
          $reply={reply}
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(current => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </TextExpansionToggle>
      )}
    </>
  );
};

CollapsibleSessionText.propTypes = {
  children: PropTypes.node.isRequired,
  clamp: PropTypes.bool,
  contentKey: PropTypes.string.isRequired,
  rail: PropTypes.bool,
  reply: PropTypes.bool
};

CollapsibleSessionText.defaultProps = {
  clamp: true,
  rail: false,
  reply: false
};

export const ReplyComposer = styled.form`
  display: grid;
  gap: 6px;
  margin: 8px 0 0 18px;

  ${({ $nested, $rail }) => $rail && css`
    gap: 8px;
    margin: ${$nested ? '0 0 0 58px' : '12px 0 0'};
  `}
`;

export const ReplyComposerTextarea = styled(Textarea)`
  ${({ $rail }) => $rail && railComposerField}
`;

export const ReplyActions = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 4px;
  margin-top: 4px;

  ${({ $rail }) => $rail && railReplyActions}
  ${({ $comment, $rail }) => $comment && $rail && railQuietReply}
  ${({ $rail, $comment }) => $rail && !$comment && css`
    justify-content: flex-end;
  `}
  ${({ $composer, $rail }) => $composer && $rail && railComposerActions}
`;

export const ReviewLoading = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: #7b8493;
  font-size: 12px;
`;

export const ReviewActionError = styled.div`
  margin-top: 8px;
  color: #b42318;
  font-size: 12px;
  line-height: 1.4;
`;

export const ComposerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $popover }) => ($popover ? 'space-between' : 'flex-end')};
  gap: 10px;
  margin-top: ${({ $popover }) => ($popover ? '8px' : '10px')};

  .bl-form-helper-text {
    margin: 0;
  }
`;

export const MomentTagsField = styled.fieldset`
  display: grid;
  gap: 8px;
  margin: 0 0 16px;
  border: 0;
  padding: 0;
`;

export const MomentTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  height: 62px;
  align-content: flex-start;
`;

export const MomentTimeLabel = styled.span`
  color: #0a1551;
  font-size: 12px;
  font-weight: 500;
  line-height: normal;
`;

export const MomentTagChip = styled.button`
  display: inline-flex;
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    border-radius: 999px;
    outline: 2px solid #4276ff;
    outline-offset: 2px;
  }
`;

export const NoteTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 6px;
  row-gap: 6px;
  width: 100%;
  margin-top: 6px;
  line-height: normal;
  white-space: normal;
`;
