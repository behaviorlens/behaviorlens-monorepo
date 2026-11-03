import styled, { createGlobalStyle, css } from 'styled-components';
import { Dropdown, InputNumber } from '../../ui';
import { SESSION_TAG_PRESENTATION } from '../review/behaviorLensSessionTags';
import { WorkspaceActionPopoverClose } from '../workspace/ScBehaviorLensWorkspace';

const focusRing = css`
  outline: 2px solid #4276ff;
  outline-offset: 2px;
`;

export const PopoverAnchor = styled.div`
  position: relative;
`;

export const PopoverCard = styled.div`
  position: ${({ $fixed }) => ($fixed ? 'fixed' : 'absolute')};
  z-index: ${({ $fixed }) => ($fixed ? 400 : 30)};
  ${({
    $fixed, $top, $left, $align
  }) => ($fixed ? `
    top: ${$top}px;
    left: ${$left}px;
  ` : `
    top: calc(100% + 8px);
    ${$align === 'right' ? 'right: 0;' : 'left: 0;'}
  `)}
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: ${({ $width }) => `${$width}px`};
  max-width: ${({ $width, $menu }) => ($menu ? `${$width}px` : 'calc(100vw - 16px)')};
  max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : 'none')};
  overflow: hidden;
  border: 1px solid #e5e8f0;
  border-radius: 16px;
  background: #f8f9fe;
  box-shadow: 0 8px 24px rgba(13, 20, 51, 0.12);

  ${({ $menu, $width }) => $menu && css`
    min-width: ${$width}px;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(13, 20, 51, 0.12);
  `}

  &:focus-visible {
    ${focusRing}
  }
`;

export const PopoverClose = styled(WorkspaceActionPopoverClose)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
`;

export const PopoverBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const PopoverFooter = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex: 0 0 auto;
  padding: 16px 12px 16px 24px;
  border-top: 1px solid #e5e8f0;

  @media (max-width: 720px) {
    gap: 8px 10px;
    padding: 12px 16px;
  }
`;

export const PopoverPrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  border: 1px solid #0075e3;
  border-radius: 4px;
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  background: #0075e3;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: #0066c3;
    background: #0066c3;
  }

  &:focus-visible {
    ${focusRing}
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (max-width: 560px) {
    flex: 1 1 auto;
  }
`;

export const PopoverGhostButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  border: 1px solid #d0d2de;
  border-radius: 4px;
  color: #343c6a;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  background: #e8e9f1;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: #bfc2d1;
    background: #d8dae5;
  }

  &:focus-visible {
    ${focusRing}
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (max-width: 560px) {
    flex: 1 1 auto;
  }
`;

export const FilterSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px;
  background: #ffffff;
  border-top: 1px solid #e0e2ea;

  &:first-child {
    border-top: 0;
  }

  @media (max-width: 720px) {
    padding: 16px;
  }
`;

export const FilterSectionTitle = styled.h3`
  display: flex;
  align-items: center;
  margin: 0 0 16px;
  color: #0a1551;
  font-size: ${({ $small }) => ($small ? '15px' : '16px')};
  font-weight: ${({ $small }) => ($small ? 600 : 700)};
  line-height: 1.25;

  /* Reserve the corner so long titles never run under the close button. */
  padding-right: 28px;
`;

export const FilterConditionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const filterConditionRow = css`
  display: grid;
  grid-template-columns: 44px 170px 130px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 8px;
`;

export const FilterCondition = styled.div`
  ${filterConditionRow}

  /* Tablet and mobile: the five condition fields reflow into two readable
     rows — "Where [field]" over "[operator] [value]" with the remove control
     pinned to the first row. */
  @media (max-width: 980px) {
    grid-template-columns: minmax(0, max-content) minmax(0, 1fr) 24px;
    grid-template-areas:
      'where field remove'
      'operator value value';
    align-items: start;
    row-gap: 10px;
  }
`;

export const FilterConditionWhere = styled.span`
  color: #6f76a7;
  font-size: 13px;
  font-weight: 500;

  @media (max-width: 980px) {
    grid-area: where;
    line-height: 36px;
  }
`;

const conditionField = css`
  box-sizing: border-box;
  width: 100%;
  height: 36px;
  padding: 0 11px;
  border: 1px solid #c7c9dc;
  border-radius: 4px;
  color: #0a1551;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;

  &:hover:not(:focus):not(:focus-visible) {
    border-color: #979dc6;
  }
`;

// Magnet Input default (light, not ghost): outline-2 / offset 0, idle
// transparent, hover navy-300 border, focus border-blue-500 + outline-blue-200
// at 50%. Same highlight as Filter dropdowns.
const inputHighlight = css`
  outline-width: 2px;
  outline-style: solid;
  outline-color: transparent;
  outline-offset: 0;

  &:focus,
  &:focus-visible {
    border-color: #0075e3;
    outline-color: rgba(119, 207, 255, 0.5);
  }
`;

// styled(Dropdown) lands on Magnet's trigger. Match the Filters/Sort
// toolbar triggers: 4px corners, 11px inset, label left / caret right.
// Leave Magnet's default focus-within outline/border (the blue highlight).
const conditionDropdown = css`
  && {
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: 36px;
    min-height: 36px;
    padding: 0 11px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    user-select: none;
    -webkit-user-select: none;
  }

  &&:not(:focus-within) {
    border: 1px solid #c7c9dc;
  }

  &&:hover:not(:focus-within) {
    border-color: #979dc6;
  }

  && > span:first-of-type {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0;
    text-align: left;
    user-select: none;
    -webkit-user-select: none;
  }

  && > :last-child {
    flex: 0 0 auto;
    margin-inline-start: 6px;
    padding: 0;
  }

  && svg {
    width: 16px;
    height: 16px;
  }
`;

export const FilterFieldSelect = styled(Dropdown).attrs({
  rounded: 'none'
})`
  ${conditionDropdown}

  && {
    color: #0a1551;
    background: #f9fafc;
  }

  @media (max-width: 980px) {
    grid-area: field;
  }
`;

export const FilterOperator = styled.span`
  ${conditionField}
  display: inline-flex;
  align-items: center;
  color: #343c6a;
  font-weight: 400;
  background: #f9fafc;
  user-select: none;
  -webkit-user-select: none;

  @media (max-width: 980px) {
    grid-area: operator;
    width: auto;
    white-space: nowrap;
  }
`;

export const FilterValueInput = styled.input`
  ${conditionField}
  ${inputHighlight}
  background: #ffffff;

  &::placeholder {
    color: #6f76a7;
    font-weight: 400;
  }

  @media (max-width: 980px) {
    grid-area: value;
  }
`;

export const FilterValueNumber = styled(InputNumber).attrs({
  hideStepButtons: true,
  rounded: 'none'
})`
  && {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: 36px;
    min-height: 36px;
    border-radius: 4px;
    background: #ffffff;
  }

  && > input {
    min-width: 0;
    padding: 0 11px;
    color: #0a1551;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
  }

  && > input::placeholder {
    color: #6f76a7;
    font-weight: 400;
  }

  @media (max-width: 980px) {
    grid-area: value;
  }
`;

export const FilterValueSelect = styled(Dropdown).attrs({
  rounded: 'none'
})`
  ${conditionDropdown}

  && {
    color: ${({ $placeholder }) => ($placeholder ? '#6f76a7' : '#0a1551')};
    font-weight: ${({ $placeholder }) => ($placeholder ? 400 : 500)};
    background: #ffffff;
  }

  /* Selected trigger tags match the dropdown pills: full round, white dot,
     and a close target that covers the whole chip so a click anywhere removes it. */
  ${({ $tagPills }) => $tagPills && css`
    && [data-dropdown-tag] .bl-tag {
      position: relative;
      box-sizing: border-box;
      height: 27px;
      padding: 0 22px 0 8px;
      border-radius: 999px;
      overflow: hidden;
      cursor: pointer;
    }

    && [data-dropdown-tag] .bl-tag > span {
      display: inline-flex;
      align-items: center;
      padding: 0;
      line-height: 1;
      pointer-events: none;
    }

    && [data-tag-option-pill] {
      height: auto;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
    }

    && [data-dropdown-tag] .bl-tag > button {
      position: absolute;
      inset: 0;
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      width: auto;
      height: auto;
      padding: 0 6px 0 0;
      margin: 0;
      line-height: 0;
      color: inherit;
      cursor: pointer;
    }

    && [data-dropdown-tag] .bl-tag > button svg {
      display: block;
      width: 12px;
      height: 12px;
    }
  `}

  @media (max-width: 980px) {
    grid-area: value;
  }
`;

// Tag options keep the filled pill look from the retired always-on tag row:
// solid tag color, white dot, white label.
export const TagOptionPill = styled.span.attrs({
  'data-tag-option-pill': ''
})`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  height: 22px;
  padding: 0 10px;
  border-radius: 11px;
  color: ${({ $color, $selected }) => ($selected === false ? $color : '#ffffff')};
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  background: ${({ $color, $selected }) => (
    $selected === false ? `${$color}1f` : $color
  )};
  box-shadow: ${({ $color, $selected }) => (
    $selected === false ? `inset 0 0 0 1px ${$color}` : 'none'
  )};

  &::before {
    content: '';
    flex: 0 0 auto;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $color, $selected }) => ($selected === false ? $color : '#ffffff')};
  }
`;

export const NOTE_TAG_PRESENTATION = SESSION_TAG_PRESENTATION;

export const MomentTagPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  height: 27px;
  padding: 0 12px;
  border: 1px solid ${({ $presentation, $selected }) => (
    $selected ? $presentation.color : $presentation.border
  )};
  border-radius: 999px;
  color: ${({ $presentation }) => $presentation.color};
  background: ${({ $presentation }) => $presentation.background};
  font-size: 12px;
  font-weight: 500;
  line-height: normal;
  white-space: nowrap;

  &::before {
    content: '';
    flex: 0 0 auto;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $presentation }) => $presentation.color};
  }
`;

export const SavedNoteTagPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  box-sizing: border-box;
  height: 19px;
  padding: 0 8px;
  border: 1px solid ${({ $presentation }) => $presentation.color};
  border-radius: 999px;
  color: ${({ $presentation }) => $presentation.color};
  background: ${({ $presentation }) => $presentation.background};
  font-size: 10px;
  font-weight: 500;
  line-height: normal;
  white-space: nowrap;

  &::before {
    content: '';
    flex: 0 0 auto;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: ${({ $presentation }) => $presentation.color};
  }
`;

// The option list is portaled to document.body, so the per-tag checkbox
// colors ride a CSS variable set on each option row. Magnet draws a 2px
// focus outline on top of the 2px border — kill that outline so weight
// stays one 2px stroke in every state. Row hover/selected keep Magnet's
// default blue highlight. Same class is used on the session-detail Tags picker.
export const TagOptionMenuStyle = createGlobalStyle`
  label.behaviorlens-tag-option {
    user-select: none;
    -webkit-user-select: none;
  }

  .behaviorlens-tag-option input[type='checkbox'],
  .behaviorlens-tag-option input[type='checkbox']:hover,
  .behaviorlens-tag-option input[type='checkbox']:focus,
  .behaviorlens-tag-option input[type='checkbox']:focus-visible,
  .behaviorlens-tag-option input[type='checkbox']:active,
  .behaviorlens-tag-option input[type='checkbox']:checked {
    border-width: 1px;
    border-style: solid;
    border-color: var(--behaviorlens-tag-border);
    outline: none;
    box-shadow: none;
  }

  .behaviorlens-tag-option input[type='checkbox']:checked {
    border-color: var(--behaviorlens-tag-color);
    background-color: var(--behaviorlens-tag-color);
  }
`;

const filterRemoveHover = css`
  &:hover {
    color: #0a1551;
    background: #eef0f6;
  }
`;

export const FilterConditionRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: #6f76a7;
  font-family: inherit;
  font-size: 16px;
  line-height: 1;
  background: transparent;
  cursor: pointer;
  ${filterRemoveHover}

  &:focus-visible {
    ${focusRing}
  }

  @media (max-width: 980px) {
    grid-area: remove;
  }
`;

/* Same stack as the conditions so "+ Add condition" keeps its 16px title-like
   gap. Flex row: add left, trash "Clear all" right — icon + hover label, no ×. */
export const FilterConditionActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const FilterAddCondition = styled.button`
  padding: 4px 0;
  border: 0;
  color: #0075e3;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: transparent;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: #0066c3;
  }

  &:focus-visible {
    ${focusRing}
  }

  &:disabled {
    color: #979dc6;
    cursor: default;
  }
`;

export const FilterClearAll = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: #6f76a7;
  background: transparent;
  cursor: pointer;
  ${filterRemoveHover}

  svg {
    display: block;
    width: 16px;
    height: 16px;
    pointer-events: none;
  }

  &:focus-visible {
    ${focusRing}
  }
`;

export const FilterHint = styled.p`
  margin: 16px 0 0;
  color: #6f76a7;
  font-size: 12px;
  line-height: 1.45;
`;

export const SortList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  min-height: 0;
  padding: 4px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const SortOptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 8px 12px;
  border: 0;
  border-radius: 6px;
  color: #0a1551;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
  background: ${({ $selected }) => ($selected ? '#e7edff' : 'transparent')};
  cursor: pointer;

  span {
    flex: 0 0 auto;
  }

  &:hover {
    background: ${({ $selected }) => ($selected ? '#e7edff' : '#f2f5fb')};
  }

  &:focus-visible {
    ${focusRing}
    outline-offset: -2px;
  }

  svg {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    color: currentColor;
  }
`;
