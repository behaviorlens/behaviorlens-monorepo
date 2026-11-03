import styled, { css } from 'styled-components';
import { Dropdown, InputNumber, UnstyledButton } from '../../ui';
import { SESSION_ROW_MIN_HEIGHT } from './behaviorLensSessionListPaging';
import { SHELL_COMPACT_MAX_WIDTH } from '../useCompactShellNav';

const focusRing = css`
  outline: 2px solid #4276ff;
  outline-offset: 2px;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

export const SearchWrap = styled.div`
  position: relative;
  flex: 0 1 345px;
  min-width: 220px;
  height: 32px;
  overflow: visible;

  > svg {
    position: absolute;
    top: 50%;
    left: 8px;
    width: 16px;
    height: 16px;
    color: #6f76a7;
    transform: translateY(-50%);
    pointer-events: none;
  }

  @media (max-width: 920px) {
    /* Tablet: the search absorbs the row width left over by the triggers. */
    flex: 1 1 240px;
  }

  @media (max-width: 720px) {
    flex: 0 0 100%;
    min-width: 0;
  }
`;

export const SearchInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 0 12px 0 30px;
  border: 1px solid #c7c9dc;
  border-radius: 4px;
  color: #0a1551;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  background: #ffffff;
  outline-width: 2px;
  outline-style: solid;
  outline-color: transparent;
  outline-offset: 0;
  transition: border-color 120ms ease, outline-color 120ms ease;

  &::placeholder {
    color: #6f76a7;
    font-size: inherit;
    font-weight: inherit;
    opacity: 1;
  }

  &:hover:not(:focus):not(:focus-visible) {
    border-color: #979dc6;
  }

  /* Magnet Input default (light, not ghost): border-blue-500 + outline-blue-200
     at 50%. Same highlight as Filters text values and dropdowns. */
  &:focus,
  &:focus-visible {
    border-color: #0075e3;
    outline-color: rgba(119, 207, 255, 0.5);
  }
`;

export const ToolbarTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid ${({ $open }) => ($open ? '#4276ff' : '#c7c9dc')};
  border-radius: 4px;
  color: #343c6a;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  background: ${({ $open }) => ($open ? '#ffffff' : '#fcfcfd')};
  cursor: pointer;
  transition: border-color 120ms ease, background-color 120ms ease;

  &:hover {
    border-color: #979dc6;
  }

  &:focus-visible {
    ${focusRing}
  }

  svg {
    width: 16px;
    height: 16px;
    color: #6f76a7;
  }

  /* The caret is the only icon on these triggers; flip it while the menu is open. */
  svg:last-of-type {
    transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
    transition: transform 120ms ease;
  }

  @media (max-width: 720px) {
    /* Mobile: Filters and Sort share the second row and stay easy to reach. */
    flex: 1 1 auto;
    justify-content: center;
  }
`;

export const ToolbarTriggerLabel = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
`;

export const ToolbarTriggerBadge = styled.span`
  display: inline-block;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  color: #0075e3;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  background: #edf8ff;
`;

/* Applied Filters-popover conditions under the toolbar. Magnet Tag
   supplies the chip look; the label opens Filters on that condition and
   the × is the only remove target. */
export const AppliedFilterRow = styled.div`
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  margin-top: 16px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
`;

export const AppliedFilterLabel = styled.span`
  flex: 0 0 auto;
  margin-right: 8px;
  color: #666f82;
  font-size: 12px;
  font-weight: 700;
  line-height: 28px;
  white-space: nowrap;
`;

export const AppliedFilterChip = styled.div`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  color: #475167;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;

  .bl-tag {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    height: 28px;
    min-height: 0;
    padding: 0 12px;
    overflow: visible;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    color: #475167;
    font-size: 12px !important;
    font-weight: 500;
    line-height: 1;
    background: #ffffff;
  }

  .bl-tag > span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 0;
    overflow: visible;
    line-height: 1;
  }
`;

export const AppliedFilterChipEdit = styled(UnstyledButton)`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  color: inherit;
  font: inherit;
  font-weight: inherit;
  line-height: 16px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border-radius: 2px;

  &:focus-visible {
    ${focusRing}
  }
`;

export const AppliedFilterChipRemove = styled(UnstyledButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  margin: 0;
  padding: 0;
  overflow: visible;
  border: 0;
  color: #98a2b3;
  line-height: 0;
  cursor: pointer;
  background: transparent;
  border-radius: 2px;

  &:focus-visible {
    ${focusRing}
  }

  svg {
    width: 12px;
    height: 12px;
    transform-origin: center;
    transition: transform 0.12s ease, color 0.12s ease;
  }

  &:hover,
  &:focus-visible {
    color: #0a1551;

    svg {
      transform: scale(1.17);
    }
  }
`;

export const SessionListLayout = styled.div`
  display: flex;
  flex-direction: column;
  flex: ${({ $empty }) => ($empty ? '1 1 auto' : '0 0 auto')};
  min-height: 0;
  height: ${({ $empty }) => ($empty ? '100%' : 'auto')};
`;

export const SessionListEmptyState = styled.section`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  box-sizing: border-box;
  min-height: 320px;
  padding: 48px 16px;
  text-align: center;

  @media (max-width: 720px) {
    min-height: 360px;
    padding: 40px 16px;
  }
`;

export const SessionListEmptyIllustration = styled.div`
  flex: 0 0 auto;
  width: 226px;
  height: 98px;

  img {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const SessionListEmptyCopy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  word-break: break-word;
`;

export const SessionListEmptyTitle = styled.h2`
  margin: 0;
  color: #0a1551;
  font-size: 22px;
  font-weight: 700;
  line-height: normal;
`;

export const SessionListEmptyDescription = styled.p`
  width: min(364px, 100%);
  margin: 0;
  color: #6c73a8;
  font-size: 16px;
  font-weight: 400;
  line-height: normal;
`;

export const PlaylistCard = styled.section.attrs({
  'data-behaviorlens-playlist': ''
})`
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  height: auto;
  /* Let short result sets collapse with their rows, while keeping enough
     room for three sessions (plus header, spacing and pager chrome). */
  min-height: ${SESSION_ROW_MIN_HEIGHT * 3 + 158}px;
  max-height: min(720px, calc(100vh - 120px));
  box-sizing: border-box;
  overflow: hidden;
  padding: 24px 16px;
  border: 1px solid ${({ $savedFilterMode }) => (
    $savedFilterMode ? '#eaebf0' : '#e5eaf5'
  )};
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(13, 20, 51, 0.06);

  @media (max-width: 920px) {
    padding: 18px;
  }

  @media (max-width: 720px) {
    height: auto;
    padding: 14px;
  }
`;

export const PlaylistHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 720px) {
    gap: 8px 10px;
  }
`;

export const PlaylistTitle = styled.h2`
  margin: 0;
  color: #6c73a8;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  letter-spacing: -0.176px;
  text-transform: uppercase;
`;

export const BookmarkedToggleLabel = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #6f76a7;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
`;

// 28x16 pill with a 12x12 knob, drawn from the Figma "Bookmarked Toggle"
// component instead of a Magnet Toggle so the list header keeps its density.
export const BookmarkedToggleControl = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  box-sizing: border-box;
  width: 28px;
  height: 16px;
  padding: 2px;
  border-radius: 3px;
  background: ${({ $checked }) => ($checked ? '#4276ff' : '#979dc6')};
  transition: background-color 120ms ease;

  &::after {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 2px;
    background: #ffffff;
    box-shadow: 0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04);
    transform: translateX(${({ $checked }) => ($checked ? '12px' : '0')});
    transition: transform 120ms ease;
  }

  input:focus-visible + & {
    ${focusRing}
  }
`;

export const VisuallyHiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`;

export const SessionListPane = styled.div.attrs({
  'data-session-list-pane': ''
})`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 24px;

  @media (max-width: 720px) {
    margin-top: 14px;
  }
`;

export const SessionList = styled.ul`
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
  /* Reserve the track so bookmarks do not jump left when overflow starts. */
  scrollbar-gutter: stable;

  /* Stacked layouts put the navigation card, toolbar and filters above the
     list, so keep room for a session instead of collapsing to nothing. */
  @media (max-width: ${SHELL_COMPACT_MAX_WIDTH}px) {
    min-height: ${SESSION_ROW_MIN_HEIGHT}px;
  }
`;

export const SessionListScrollFrame = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
`;

export const SessionListFade = styled.div`
  position: absolute;
  z-index: 1;
  /* Keep the native scrollbar, including its arrow buttons, outside the blur. */
  right: 16px;
  ${({ $edge }) => ($edge === 'top' ? 'top: 0;' : 'bottom: 0;')}
  left: 0;
  height: 32px;
  opacity: ${({ $opacity }) => $opacity};
  pointer-events: none;
  background: rgba(255, 255, 255, 0.55);
  mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  backdrop-filter: blur(2px);
  -webkit-mask-image: ${({ $edge }) => ($edge === 'top'
    ? 'linear-gradient(to bottom, #000 30%, transparent)'
    : 'linear-gradient(to bottom, transparent, #000 70%)')};
  -webkit-backdrop-filter: blur(2px);
  transition: none;
  will-change: opacity;
`;

export const SessionListOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

const UNWATCHED_PLAY_PILL = {
  color: '#ffffff',
  background: '#0075e3',
  hoverColor: '#ffffff',
  hoverBackground: '#0066c3'
};

const WATCHED_PLAY_PILL = {
  color: '#0075e3',
  background: 'rgba(0, 117, 227, 0.1)',
  hoverColor: '#0066c3',
  hoverBackground: 'rgba(0, 117, 227, 0.18)'
};

// Below this width the visitor/URL column would wrap under the identity.
// Hide it instead so the row stays one line and auto-fit paging is stable.
export const SESSION_ROW_CONTEXT_COLLAPSE_MAX_WIDTH = 1180;

export const SessionRow = styled.li.attrs(({ $entered, $skeleton }) => ({
  'data-session-row': '',
  ...($entered ? { 'data-session-entered': '' } : {}),
  ...($skeleton ? { 'data-session-skeleton': '' } : {})
}))`
  position: relative;
  display: grid;
  grid-template-columns: 88px minmax(180px, 1fr) minmax(200px, 260px) 24px;
  grid-template-areas: "tile identity context bookmark";
  align-items: center;
  gap: 6px 24px;
  min-height: ${SESSION_ROW_MIN_HEIGHT}px;
  /* Right inset keeps the bookmark off the playlist scrollbar. */
  padding: 11px 16px 11px 12px;
  border-bottom: 1px solid #eef0f6;
  transition: background-color 120ms ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fbfcff;
  }

  /* Keyboard only. :focus-within would keep the row looking pressed after a
     mouse click on bookmark (or the URL tooltip). */
  &:has(:focus-visible) {
    background: #f6f9ff;
  }

  @media (max-width: ${SESSION_ROW_CONTEXT_COLLAPSE_MAX_WIDTH}px) {
    grid-template-columns: 88px minmax(0, 1fr) 24px;
    grid-template-areas: "tile identity bookmark";
    column-gap: 16px;
  }

  @media (max-width: 720px) {
    column-gap: 12px;
    padding: 10px 12px 10px 10px;
  }
`;

export const PlayPill = styled.span.attrs({
  'data-session-play-pill': ''
})`
  grid-area: tile;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 88px;
  height: 40px;
  border-radius: 4px;
  color: ${UNWATCHED_PLAY_PILL.color};
  font-size: 14px;
  font-weight: 600;
  background: ${UNWATCHED_PLAY_PILL.background};
  transition: background-color 120ms ease, color 120ms ease;

  svg {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
  }

  ${SessionRow}[data-session-entered] & {
    color: ${WATCHED_PLAY_PILL.color};
    background: ${WATCHED_PLAY_PILL.background};
  }

  ${SessionRow}:hover &,
  ${SessionRow}:has(:focus-visible) & {
    color: ${UNWATCHED_PLAY_PILL.hoverColor};
    background: ${UNWATCHED_PLAY_PILL.hoverBackground};
  }

  ${SessionRow}[data-session-entered]:hover &,
  ${SessionRow}[data-session-entered]:has(:focus-visible) & {
    color: ${WATCHED_PLAY_PILL.hoverColor};
    background: ${WATCHED_PLAY_PILL.hoverBackground};
  }

  ${SessionRow}[data-session-skeleton] &,
  ${SessionRow}[data-session-skeleton]:hover &,
  ${SessionRow}[data-session-skeleton]:has(:focus-visible) & {
    color: #eef0f3;
    background: #eef0f3;
  }
`;

export const RowBlock = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const IdentityBlock = styled(RowBlock)`
  grid-area: identity;
`;

export const ContextBlock = styled(RowBlock).attrs({
  'data-session-row-context': ''
})`
  grid-area: context;
  gap: ${({ $variant }) => ($variant === 'visitor' ? '6px' : '4px')};

  @media (max-width: ${SESSION_ROW_CONTEXT_COLLAPSE_MAX_WIDTH}px) {
    display: none;
  }
`;

export const BookmarkBlock = styled.div`
  grid-area: bookmark;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const IdentityName = styled.span`
  display: flex;
  align-items: center;
  color: #0a1551;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowSubText = styled.span`
  color: #6f76a7;
  font-size: 12px;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ContextLabel = styled.span`
  color: ${({ $variant }) => ($variant === 'visitor' ? '#8b5cf6' : '#4276ff')};
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PathUrlContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
`;

export const PathUrlTooltipTrigger = styled.span`
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  min-width: 0;
  margin: 0;
  color: #9ca3b3;
  font: inherit;
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-align: left;
  cursor: default;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:focus-visible {
    ${focusRing}
  }
`;

export const RowMetaSlot = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
`;

export const Pager = styled.nav.attrs({
  'data-session-pager': ''
})`
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 720px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-top: 16px;
  }
`;

/* Equal flexible sides keep the page cluster visually centered. */
export const PagerSizeControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1 1 0;
  min-width: 0;

  @media (max-width: 720px) {
    flex: 1 1 100%;
    justify-content: center;
  }
`;

/* styled(Dropdown) lands on Magnet's trigger. Keep playlist size/spacing;
   Magnet owns the default focus-within blue outline. */
export const PagerSizeSelect = styled(Dropdown).attrs({
  rounded: 'none'
})`
  && {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    width: auto;
    min-width: 0;
    height: 38px;
    min-height: 38px;
    padding: 0 11px;
    border-radius: 4px;
    color: #343c6a;
    font-size: 14px;
    font-weight: 500;
    background: #fcfcfd;
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
    flex: 0 1 auto;
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
    color: #6f76a7;
  }
`;

export const PagerCluster = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  gap: 24px;

  @media (max-width: 720px) {
    flex: 1 1 100%;
    justify-content: center;
    gap: 10px;
  }
`;

export const PagerPageGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 22px;
`;

export const PagerSpacer = styled.div.attrs({
  'aria-hidden': 'true'
})`
  flex: 1 1 0;

  @media (max-width: 720px) {
    display: none;
  }
`;

/* Same 22px row as the page field so "Page" / "of N" share the number's
   vertical center instead of sitting on a shorter text baseline. */
export const PagerLabel = styled.span`
  display: inline-flex;
  align-items: center;
  height: 22px;
  color: #6f76a7;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
`;

/* styled(InputNumber) lands on Magnet's container (or the mocked <input>).
   ghost drops Magnet's outline-2 / focus-within blue ring; we keep a quiet
   gray border and select-all, same as the old pager field. Magnet small is
   h-8; keep the box 22px and size the inner input to the content box so the
   digit does not overflow the border. */
export const PagerPageField = styled(InputNumber).attrs({
  hideStepButtons: true,
  ghost: true,
  rounded: 'none',
  size: 'small'
})`
  && {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    align-self: center;
    box-sizing: border-box;
    width: 28px;
    min-width: 28px;
    height: 22px !important;
    min-height: 22px !important;
    max-height: 22px !important;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid #c7c9dc;
    border-radius: 4px;
    color: #0a1551;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    text-align: center;
    background: #fcfcfd;
    box-shadow: none;
    outline: none;
    outline-width: 0;
    outline-color: transparent;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  &&:hover {
    border-color: #979dc6;
  }

  &&:focus,
  &&:focus-visible,
  &&:focus-within {
    border-color: #c7c9dc !important;
    background: #fcfcfd;
    box-shadow: none !important;
    outline: none !important;
    outline-width: 0 !important;
    outline-color: transparent !important;
  }

  &&:hover:focus,
  &&:hover:focus-visible,
  &&:hover:focus-within {
    border-color: #979dc6 !important;
  }

  && input {
    display: block;
    box-sizing: border-box;
    width: 100%;
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;
    margin: 0 !important;
    padding: 0 2px !important;
    border: 0 !important;
    color: inherit;
    font-family: inherit !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    line-height: 20px !important;
    text-align: center;
    background: transparent;
    appearance: textfield;
    -moz-appearance: textfield;
    box-shadow: none !important;
    outline: none !important;
    outline-width: 0 !important;
    outline-color: transparent !important;
  }

  && input:focus,
  && input:focus-visible {
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
    outline-width: 0 !important;
    outline-color: transparent !important;
  }

  &&::-webkit-inner-spin-button,
  &&::-webkit-outer-spin-button,
  && input[type='number']::-webkit-inner-spin-button,
  && input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const PagerButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: #343c6a;
  font-family: inherit;
  background: transparent;
  cursor: pointer;
  transition: color 120ms ease, background-color 120ms ease;

  &:hover:not(:disabled) {
    color: #4276ff;
    background: #e7edff;
  }

  &:disabled {
    color: #c7c9dc;
    cursor: default;
  }

  &:focus-visible {
    ${focusRing}
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export * from './ScBehaviorLensSessionListFeedback';
