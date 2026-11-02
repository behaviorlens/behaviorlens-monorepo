import styled, { css } from 'styled-components';
import { Button } from '../../ui';
import { RAIL_CARD_SHADOW } from './ScBehaviorLensInsightsRail';

// Styled primitives for the AI Summary rail view. The cards grow with their
// content while the containing panel owns the single scrolling surface.

const CARD_BORDER = '#e8e5fa';

export const AiSummaryStack = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const AiSummaryPanelScroll = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 2px 8px;
`;

export const AiSummaryPanelContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`;

export const AiSummaryCards = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`;

const cardBase = css`
  flex: 0 0 auto;
  border: 1px solid ${CARD_BORDER};
  border-radius: 8px;
  background: #ffffff;
  box-shadow: ${RAIL_CARD_SHADOW};
  color: #0a1551;
`;

export const AiSummaryCard = styled.section`
  ${cardBase};
  display: flex;
  flex-direction: column;
  min-width: 0;

  /* Empty/loading state is a single small action, so it stays a slim strip. */
  ${({ $compact }) => ($compact ? css`
    gap: 8px;
    align-items: center;
    padding: 14px;
    text-align: center;

    button {
      min-height: 0;
      padding: 5px 11px;
      font-size: 12px;
      line-height: 1.45;
    }

    [role='status'] {
      min-height: 0;
    }
  ` : css`
    position: relative;
    flex: 0 0 auto;
    min-height: 0;
    overflow: hidden;
  `)}
`;

export const AiSummaryCardContent = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

export const AiSummaryEmptyState = styled.section`
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-width: 0;
  min-height: 0;
  text-align: center;
`;

export const AiSummaryEmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
`;

export const AiSummaryEmptyIllustrationFrame = styled.div`
  position: relative;
  flex: 0 0 auto;
  width: 322px;
  max-width: 100%;
  height: 144px;
  overflow: hidden;
`;

export const AiSummaryEmptyIllustration = styled.img`
  position: absolute;
  top: -13.4%;
  left: 0;
  display: block;
  width: 100%;
  height: 128.46%;
  max-width: none;
  transform: rotate(-0.45deg);
`;

export const AiSummaryEmptyCopy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  overflow: hidden;
  text-align: center;
`;

export const AiSummaryEmptyTitle = styled.h3`
  margin: 0;
  color: #0a1551;
  font-size: 16px;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;
`;

export const AiSummaryEmptyDescription = styled.p`
  width: 320px;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  color: #6d7381;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
`;

export const AiSummaryGenerateButton = styled(Button)`
  && {
    min-width: 80px;
    height: 32px;
    min-height: 32px;
    border-radius: 4px;
    padding: 0 8px;
    background: #7c5cf6;
    color: #ffffff;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: -0.084px;
  }

  &&:hover:not(:disabled) {
    background: #6847e8;
  }

  &&:focus-visible {
    background: #7c5cf6;
  }

  svg {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
  }
`;

export const AiSummaryBottomFade = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 40px;
  opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
  border-radius: 0 0 8px 8px;
  background: rgba(255, 255, 255, 0.55);
  mask-image: linear-gradient(to bottom, transparent, #000 70%);
  backdrop-filter: blur(2px);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 70%);
  -webkit-backdrop-filter: blur(2px);
  transition: none;
  will-change: opacity;
`;

export const AiSummaryTopFade = styled(AiSummaryBottomFade)`
  top: 0;
  bottom: auto;
  border-radius: 8px 8px 0 0;
  mask-image: linear-gradient(to bottom, #000 30%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, #000 30%, transparent);
`;

export const AiSummaryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  & + & {
    margin-top: 0;
  }
`;

export const AiSummaryInsightBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const AiSummaryHeader = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;

  ${({ $stacked }) => $stacked && css`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  `}
`;

export const AiSummaryHeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $stacked }) => ($stacked ? 'center' : 'flex-end')};
  gap: 8px;
  min-width: 0;

  button {
    flex: 0 0 auto;
    min-height: 0;
    padding: 0;
    color: #7c5cf6;
    font-size: 16px;
    font-weight: 500;
    line-height: normal;
  }
`;

export const AiSummarySectionTitle = styled.h4`
  margin: 0;
  color: #837ab3;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.42px;
  line-height: normal;
  text-transform: uppercase;
`;

export const AiSummaryTakeaways = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const AiSummaryCopy = styled.p`
  margin: 0;
  color: #5c606f;
  font-size: 16px;
  font-weight: 400;
  line-height: normal;
  white-space: pre-wrap;
`;

export const AiSummaryHeadline = styled.h3`
  margin: 0;
  color: #0a1551;
  font-size: 16px;
  font-weight: 700;
  line-height: normal;
`;

export const AiSummaryConfidenceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: ${({ $stacked }) => ($stacked ? 'center' : 'flex-start')};
  gap: 10px;
  min-width: 0;
`;

export const AiSummaryConfidenceLabel = styled.span`
  flex: 0 0 auto;
  color: #0a1551;
  font-size: 16px;
  font-weight: 700;
`;

// Intern returns an enum (low | medium | high), never a percentage.
// The header shows the level pill only — never a bar and never "92%".
const CONFIDENCE_PILLS = {
  high: { background: '#e7f6ec', color: '#219652' },
  medium: { background: '#fff5ea', color: '#d08a0b' },
  low: { background: '#eef0f6', color: '#6f76a7' }
};

const confidencePill = level => CONFIDENCE_PILLS[level] || CONFIDENCE_PILLS.low;

export const AiSummaryConfidencePill = styled.span`
  flex: 0 0 auto;
  padding: 5px 12px;
  border-radius: 999px;
  background: ${({ $level }) => confidencePill($level).background};
  color: ${({ $level }) => confidencePill($level).color};
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
`;

export const AiSummarySignalRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 14px;
`;

// The three Figma chip palettes, cycled across the real intern observations.
const SIGNAL_PALETTES = [
  { background: '#fff5ea', color: '#d08a0b' },
  { background: '#f3e8ff', color: '#7c3aed' },
  { background: '#e7f6ec', color: '#219652' }
];

const signalPalette = index => SIGNAL_PALETTES[index % SIGNAL_PALETTES.length];

export const AiSummarySignal = styled.span`
  padding: 10px 16px;
  border-radius: 999px;
  background: ${({ $index }) => signalPalette($index).background};
  color: ${({ $index }) => signalPalette($index).color};
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
`;

export const AiSummaryDetectedBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const AiSummaryMoment = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ $first }) => ($first ? '8px' : '6px')};

  &:not(:last-child) {
    margin-bottom: 0;
  }
`;

export const AiSummaryIssueContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const AiSummaryMomentTitle = styled.span`
  color: #0a1551;
  font-size: 16px;
  font-weight: 700;
  line-height: normal;
`;

export const AiSummaryMomentCopy = styled.p`
  margin: 0;
  color: #5c606f;
  font-size: 16px;
  font-weight: 400;
  line-height: normal;
`;

export const AiSummaryCitation = styled.button`
  display: inline;
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: #7c3aed;
  font: inherit;
  font-weight: 700;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #7c3aed;
    outline-offset: 2px;
  }
`;

export const AiSummarySeekRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

const seekChipBase = css`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 31px;
  margin: 0;
  border: 0;
  border-radius: 999px;
  padding: 0 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
`;

export const AiSummarySeekChip = styled.button`
  ${seekChipBase};
  background: #f3e8ff;
  color: #7c3aed;

  svg {
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
  }

  &:hover {
    background: #e9d5ff;
  }

  &:focus-visible {
    outline: 2px solid #7c3aed;
    outline-offset: 2px;
  }
`;

export const AiSummarySeekMore = styled.button`
  ${seekChipBase};
  background: #eef0f6;
  color: #6f76a7;

  &:hover {
    background: #e4e6ef;
  }

  &:focus-visible {
    outline: 2px solid #7c3aed;
    outline-offset: 2px;
  }
`;

export const AiSummaryObservation = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ $first }) => ($first ? '8px' : '6px')};

  &:not(:last-child) {
    margin-bottom: 0;
  }
`;

export const AiSummaryInterpretation = styled.p`
  margin: 0;
  color: #5c606f;
  font-size: 16px;
  line-height: normal;
`;

export const AiSummaryStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  color: #5f6875;
  font-size: 13px;
`;

export const AiSummaryError = styled.p`
  margin: 0;
  color: #b42318;
  font-size: 12px;
`;
