import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Textarea } from '../../ui';
import useScrollEdgeFades from '../shared/useScrollEdgeFades';

export const railComposerActions = css`
  margin-top: 0;
  gap: 8px;

  .bl-button {
    justify-content: center;
    width: max-content;
    height: auto;
    min-width: 0;
    min-height: 0;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 700;
  }

  .bl-button > span {
    padding: 0;
    font-size: 12px;
  }
`;

export const NoteComposerActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;

  ${({ $rail }) => $rail && railComposerActions}
`;

export const railComposerField = css`
  && {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 70px;
    min-height: 70px;
    padding: 0 !important;
    overflow: hidden;
    border-color: #e8e9ef;
    border-radius: 4px;
  }

  && .bl-textarea,
  && > textarea {
    box-sizing: border-box;
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    min-height: 0;
    margin: 0;
    padding: 8px 12px !important;
    color: #343c6a;
    font-family: inherit;
    font-size: 13px !important;
    font-weight: 400;
    line-height: normal;
    resize: none;
  }
`;

export const EditNoteForm = styled.form`
  ${({ $rail }) => $rail && css`
    display: grid;
    gap: 8px;
    width: 100%;
    min-width: 0;

    > * {
      width: 100%;
      min-width: 0;
    }
  `}
`;

export const EditNoteTextarea = styled(Textarea)`
  ${({ $rail }) => $rail && railComposerField}
`;

export const NoteComposer = styled.div`
  position: relative;

  ${({ $elevated }) => $elevated && css`
    z-index: 4;
  `}
`;

export const ComposerHighlight = styled.div`
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  padding: 12px;
  color: #283240;
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
  pointer-events: none;
  white-space: pre-wrap;

  ${({ $popover }) => $popover && css`
    padding: 12px 14px;
    color: #0a1551;
    font-size: 12px;
    line-height: normal;
  `}
`;

export const MentionTextarea = styled(Textarea)`
  position: relative;
  z-index: 1;
  background: transparent !important;
  caret-color: #283240;
  color: transparent !important;
  user-select: text;
  -webkit-user-select: text;

  &::selection {
    background: #b9d7ff;
    color: #0a1551 !important;
    -webkit-text-fill-color: #0a1551;
  }

  && > textarea {
    user-select: text;
    -webkit-user-select: text;
  }

  && > textarea::selection {
    background: #b9d7ff;
    color: #0a1551 !important;
    -webkit-text-fill-color: #0a1551;
  }

  ${({ $popover }) => $popover && css`
    && {
      box-sizing: border-box;
      width: 100%;
      height: 100px;
      min-height: 100px;
      padding: 0;
      resize: none;
      border: 1.5px solid #4276ff;
      border-radius: 4px;
    }

    && > textarea {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-height: 0;
      padding: 12px 14px;
      color: transparent !important;
      font-size: 12px;
      line-height: 16px;
    }

    && > textarea::placeholder {
      color: #979dc6;
      opacity: 1;
    }

    &&:focus,
    &&:focus-visible {
      border-color: #4276ff;
      outline: none;
      box-shadow: none;
    }
  `}
`;

export const MentionListSurface = styled.div`
  position: absolute;
  z-index: 2;
  right: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-height: ${({ $maxHeight }) => `${$maxHeight ?? 192}px`};
  overflow: hidden;
  border: 1px solid #c8d2e6;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(16, 24, 40, 0.14);
`;

export const MentionListScroller = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
`;

export const MentionListFade = styled.span`
  position: absolute;
  z-index: 3;
  right: 0;
  ${({ $edge }) => ($edge === 'top' ? 'top: 0;' : 'bottom: 0;')}
  left: 0;
  height: 10px;
  opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  -webkit-mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  transition: none;
`;

export const MentionList = React.forwardRef(({
  children, contentKey, ...props
}, externalRef) => {
  const { fadeBottom, fadeTop, scrollRef } = useScrollEdgeFades(contentKey);
  return (
    <MentionListSurface
      ref={externalRef}
      {...props}
    >
      <MentionListScroller ref={scrollRef}>
        {children}
      </MentionListScroller>
      <MentionListFade $edge="top" $opacity={fadeTop} aria-hidden="true" />
      <MentionListFade $edge="bottom" $opacity={fadeBottom} aria-hidden="true" />
    </MentionListSurface>
  );
});

MentionList.displayName = 'MentionList';

MentionList.propTypes = {
  children: PropTypes.node.isRequired,
  contentKey: PropTypes.string.isRequired
};

export const MentionOption = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  padding: 8px 10px;
  background: ${({ $active }) => ($active ? '#eaf2ff' : '#ffffff')};
  color: #283240;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  text-align: left;

  &:hover,
  &:focus-visible {
    background: #eaf2ff;
    outline: none;
  }
`;

export const MentionOptionName = styled.span`
  transform: translateY(1px);
`;

export const MentionEmpty = styled.div`
  padding: 8px 10px;
  color: #7b8493;
  font-size: 13px;
`;

export const NotesList = styled.div`
  margin-top: 14px;
  border-top: 1px solid #e9ebef;

  ${({ $rail }) => $rail && css`
    display: grid;
    gap: 16px;
    margin-top: 0;
    border-top: 0;
  `}
`;

export const SessionNotesRailListFrame = styled.div`
  width: 100%;
  min-width: 0;

  [aria-label='Session notes'] {
    gap: 16px;
    margin-top: 0;
    border-top: 0;
  }

  [data-testid='behaviorlens-session-note'] {
    padding: 20px;
    border: 1px solid #e0e2ea;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(13, 20, 51, 0.12);
  }

  ${({ $cardless }) => $cardless && css`
    [data-testid='behaviorlens-session-note'] {
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
  `}

  [data-testid='behaviorlens-session-note'] strong {
    color: #0a1551;
    font-size: 14px;
    font-weight: 500;
  }

  [data-testid='behaviorlens-session-note'] time,
  [data-note-date] {
    color: #9ca3b3;
    font-size: 12px;
  }

  [data-testid='behaviorlens-session-note'] p {
    color: #343c6a;
    font-size: 13px;
    line-height: normal;
  }

  [aria-label='Moment tags'] {
    margin-top: 6px;
  }

  ${({ $focused }) => $focused && css`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;

    [aria-label='Session notes'],
    [data-testid='behaviorlens-session-note'] {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    [data-testid='behaviorlens-session-note'] > div {
      display: flex;
      flex: 1 1 auto;
      align-items: stretch;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    [data-testid='behaviorlens-session-note'] > div > div:last-child {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  `}
`;
