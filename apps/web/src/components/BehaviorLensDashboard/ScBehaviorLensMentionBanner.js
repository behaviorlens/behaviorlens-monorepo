import styled from 'styled-components';

/* ------------------------------------------------------------------------ *
 * The mention strip inside the expanded workspace
 *
 * Expanding a mention used to lose the mention: the overlay opened on a
 * generic session workspace whose title was the page name, and the question
 * the reviewer came to answer existed only in their memory. This strip is the
 * reason the overlay is a modal at all rather than a navigation — it carries
 * the inbox in with it.
 * ------------------------------------------------------------------------ */

export const MentionBanner = styled.section`
  flex: none;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 4px 11px;
  padding: 11px 20px;
  border-bottom: 1px solid #e2e9f5;
  background: #f7faff;
`;

export const MentionBannerBody = styled.div`
  min-width: 0;
`;

export const MentionBannerAvatar = styled.span`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f3e8ff;
  color: #6b21a8;
  font-size: 11px;
  font-weight: 750;
`;

export const MentionBannerLead = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: #5b6577;
  font-size: 12px;
`;

export const MentionBannerAuthor = styled.strong`
  color: #172033;
  font-size: 13px;
  font-weight: 750;
`;

// Where the note was left. The overlay already opens in that mode, but nothing
// on screen said why — the reviewer landed in Click Maps with no idea it was
// the author's choice rather than a default.
export const MentionBannerSurface = styled.span`
  padding: 2px 7px;
  border-radius: 5px;
  background: #e8f0ff;
  color: #17408f;
  font-size: 11px;
  font-weight: 700;
`;

export const MentionBannerMoment = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 5px;
  background: #e8f0ff;
  color: #17408f;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  svg {
    width: 10px;
    height: 10px;
  }
`;

export const MentionBannerAge = styled.time`
  color: #78839a;
  font-size: 11.5px;
`;

// A message that runs the full width of the modal is a 160-character line.
export const MentionBannerMessage = styled.p`
  max-width: 92ch;
  margin: 3px 0 0;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.45;
`;

export const MentionBannerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const MentionBannerComposer = styled.div`
  grid-column: 1 / -1;
  margin-top: 2px;
`;

export const MentionBannerThread = styled.ol`
  grid-column: 1 / -1;
  display: grid;
  gap: 14px;
  margin: 8px 0 0;
  padding: 0 0 0 40px;
  border-left: 2px solid #d8e2f4;
  list-style: none;
`;

export const MentionBannerReply = styled.li`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  color: #344054;
  font-size: 13px;
  line-height: 1.45;
`;

export const MentionBannerReplyAvatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e8eefb;
  color: #40558a;
  font-size: 9px;
  font-weight: 750;
`;

export const MentionBannerReplyBody = styled.div`
  min-width: 0;
`;

export const MentionBannerReplyHeader = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
`;

export const MentionBannerReplyText = styled.div`
  margin-top: 2px;
  color: #1e293b;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

export const MentionBannerReplyContext = styled.div`
  margin-bottom: 5px;
  padding: 5px 8px;
  border-left: 2px solid #cdd7e8;
  color: #6b7280;
  font-size: 11px;
`;

export const MentionBannerReplyMeta = styled.span`
  margin-right: 6px;
  color: #5b6577;
  font-size: 11.5px;
  font-weight: 700;
`;

export const MentionComposerTextarea = styled.textarea`
  width: 100%;
  min-height: 68px;
  padding: 9px 11px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #172033;
  font: inherit;
  font-size: 13.5px;
  line-height: 1.45;
  resize: vertical;

  &::placeholder {
    color: #5b6577;
  }

  &:focus-visible {
    outline: 2px solid #85aaff;
    outline-offset: 1px;
    border-color: #85aaff;
  }
`;

export const MentionComposerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

export const MentionComposerHint = styled.span`
  margin-left: auto;
  color: #5b6577;
  font-size: 11.5px;
`;

export const MentionSendButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid #1463ff;
  border-radius: 8px;
  background: #1463ff;
  color: #ffffff;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;

  svg {
    width: 12px;
    height: 12px;
  }

  &:disabled {
    border-color: #c3d4f2;
    background: #c3d4f2;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #0b52dc;
    border-color: #0b52dc;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

// A reply's own controls. Quiet until the thread is hovered or focused, but
// never hidden from a keyboard or a touch device — the same rule the list row
// learned the hard way.
export const MentionBannerReplyRow = styled.div`
  display: block;
`;

export const MentionBannerReplyActions = styled.span`
  display: inline-flex;
  gap: 2px;
  margin-top: 3px;
`;

export const MentionBannerReplyAction = styled.button`
  padding: 2px 6px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: ${({ $danger }) => ($danger ? '#b42318' : '#5b6577')};
  font: inherit;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fef3f2' : '#eef1f6')};
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 1px;
  }
`;

export const MentionBannerReplyEdited = styled.span`
  color: #8b93a5;
  font-size: 11px;
`;

// Deleting the only reply otherwise left the strip identical to one that had
// never been answered, so the reviewer could not tell their click from a
// no-op. This says what happened and offers the way back.
export const MentionBannerUndo = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  padding: 7px 11px;
  border: 1px solid #e2e9f5;
  border-radius: 8px;
  background: #ffffff;
  color: #5b6577;
  font-size: 12.5px;
`;

export const MentionBannerUndoAction = styled.button`
  margin-left: auto;
  padding: 3px 9px;
  border: 1px solid #cfe0ff;
  border-radius: 6px;
  background: #f2f7ff;
  color: #17408f;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #e4eeff;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;
