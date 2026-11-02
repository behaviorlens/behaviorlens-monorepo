import styled, { css } from 'styled-components';
import { ModalActions, ModalBody } from '../../ui';
import { SHELL_COMPACT_MAX_WIDTH } from './useCompactShellNav';

const focusRing = css`
  outline: 2px solid #4276ff;
  outline-offset: 2px;
`;

export const SavedFiltersNav = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  border-radius: 8px;
  background: transparent;

  @media (max-width: ${SHELL_COMPACT_MAX_WIDTH}px) {
    flex: 0 0 auto;
  }
`;

export const SavedFiltersToggle = styled.button`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  color: ${({ $selected }) => ($selected ? '#ffffff' : '#0a1551')};
  font-family: inherit;
  font-size: 16px;
  text-align: left;
  background: ${({ $selected }) => ($selected ? '#0075e3' : 'transparent')};
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;

  &:hover {
    background: ${({ $selected }) => ($selected ? '#0075e3' : '#f2f5fb')};
  }

  &:focus-visible {
    ${focusRing}
  }

  > svg:first-child {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    color: currentColor;
  }

`;

export const SavedFiltersBody = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;

  @media (max-width: ${SHELL_COMPACT_MAX_WIDTH}px) {
    flex: 0 0 auto;
  }
`;

// Stacked above the page the shell card must never scroll, so the list gives
// up its extra rows first. Saved Filters sits last under Mentions & Notes.
export const SAVED_FILTERS_COMPACT_VISIBLE_COUNT = 1;
const SAVED_FILTERS_ITEM_HEIGHT_PX = 28;

export const SavedFiltersListWrap = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;

  @media (max-width: ${SHELL_COMPACT_MAX_WIDTH}px) {
    flex: 0 0 auto;
    max-height: ${SAVED_FILTERS_COMPACT_VISIBLE_COUNT * SAVED_FILTERS_ITEM_HEIGHT_PX}px;
  }
`;

export const SavedFiltersListFade = styled.div`
  position: absolute;
  z-index: 3;
  right: 16px;
  left: 0;
  ${({ $edge }) => ($edge === 'top' ? 'top: 0;' : 'bottom: 0;')}
  height: 14px;
  opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(2px);
  mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  -webkit-backdrop-filter: blur(2px);
  -webkit-mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  transition: none;
`;

export const SavedFiltersList = styled.ul`
  margin: 0;
  padding: 4px 0 0;
  list-style: none;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;

  @media (max-width: ${SHELL_COMPACT_MAX_WIDTH}px) {
    flex: 0 0 auto;
    max-height: ${SAVED_FILTERS_COMPACT_VISIBLE_COUNT * SAVED_FILTERS_ITEM_HEIGHT_PX}px;
  }

`;

export const SavedFiltersItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 0 8px;
  border-radius: 8px;
  background: ${({ $selected }) => ($selected ? '#eef4ff' : 'transparent')};

  &:hover,
  &:has(:focus-visible) {
    background: ${({ $selected }) => ($selected ? '#eef4ff' : '#f2f5fb')};
  }
`;

export const SavedFiltersItemButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 6px 0 6px 20px;
  border: 0;
  color: #0a1551;
  font-family: inherit;
  font-size: 12px;
  font-weight: ${({ $selected }) => ($selected ? 700 : 500)};
  text-align: left;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    ${focusRing}
  }

  &::before {
    content: '';
    flex: 0 0 auto;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const SavedFiltersItemAction = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: #8a91b8;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease, color 120ms ease;

  svg {
    width: 13px;
    height: 13px;
    color: currentColor;
  }

  &:hover:not(:disabled) {
    color: #0a1551;
  }

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    opacity: 1;
    pointer-events: auto;
    ${focusRing}
  }

  ${SavedFiltersItem}:hover &,
  ${SavedFiltersItem}:has(:focus-visible) & {
    opacity: 1;
    pointer-events: auto;
  }
`;

export const SavedViewModalActions = styled(ModalActions)`
  && {
    flex-direction: row;
    justify-content: center;
  }

  && > * {
    width: auto;
  }
`;

export const SavedViewModalBody = styled(ModalBody)`
  && {
    padding-top: 36px;
    padding-bottom: 28px;
  }

  form,
  .bl-form-control,
  .bl-input-container {
    width: 100%;
  }

  .bl-input {
    min-width: 0;
    width: 100%;
  }
`;

export const SavedViewsMessage = styled.div`
  padding: ${({ $inset }) => ($inset ? '4px 8px 4px 20px' : '0')};
  font-size: 12px;
  line-height: 1.4;
  color: ${({ $error }) => ($error ? '#dc2626' : '#6f76a7')};
`;

export const SavedViewsStatus = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 8px 4px 20px;
`;
