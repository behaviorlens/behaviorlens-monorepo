import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  BookmarkedToggleLabel, SearchWrap, SkeletonBlock
} from './ScBehaviorLensSessionListPage';
import { BEHAVIORLENS_SHELL_COLUMN_GAP } from './useCompactShellNav';

// List and preview share the shell's sidebar gutter so the two columns sit the
// same distance apart as the sidebar and this page. Taken from the shell rather
// than restated so a change moves them together.
export const COLUMN_GAP = BEHAVIORLENS_SHELL_COLUMN_GAP;
export const PANE_LIST_WIDTH = `calc((100% - ${COLUMN_GAP}px) * 2 / 3)`;
export const PANE_PREVIEW_WIDTH = `calc((100% - ${COLUMN_GAP}px) / 3)`;
// Same token as Sessions dashboard cards, the shell sidebar, and mention cards.
export const DASHBOARD_CARD_SHADOW = '0 2px 4px rgba(84, 95, 111, 0.16), 0 0 1px rgba(37, 45, 91, 0.04)';
export const PREVIEW_PLAYER_CARD_BACKGROUND = '#F9F9FF';
export const NOTIFICATION_SURFACE = '#ffffff';

// Fill the shell's page column. While a preview is open the list takes two
// thirds and the pane one third; with nothing selected the list uses the whole
// width.
export const SharedColumn = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-self: stretch;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  max-width: none;

  @media (max-width: 860px) {
    height: auto;
  }
`;

export const SharedIntro = styled.p`
  min-height: 16.8px;
  margin: -8px 0 0;
  color: #6f76a7;
  font-size: 14px;
  line-height: 1.2;
`;

// Facts that are carried by colour, weight or position alone still have to
// reach a reader who gets none of the three.
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  white-space: nowrap;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
`;

// The toolbar filters the list, so it is bounded by the list and not by the
// page. Stretched across the whole column with `space-between` the search box
// travelled to the far right and came to rest above the preview pane, which it
// does not search — the one control on the page that looked like it belonged
// to the other column.
export const SharedToolbar = styled.div`
  display: grid;
  flex: none;
  gap: 12px;
  margin-top: 16px;
  margin-bottom: 8px;
  max-width: ${({ $hasPane }) => ($hasPane ? PANE_LIST_WIDTH : 'none')};

  @media (max-width: 860px) {
    max-width: none;
  }
`;

export const SharedToolbarTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SharedFiltersRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const FlagFilterLabel = styled(BookmarkedToggleLabel)`
  > span:last-child {
    transform: translateY(1px);
  }
`;

export const SharedSearchWrap = styled(SearchWrap)``;

export const SourceNavRow = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;
  overflow-x: auto;
`;

export const SourceNavButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $active }) => ($active ? '#0075e3' : '#343c6a')};
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: calc(100% - 2px);
    height: 2px;
    transform: translateX(-50%);
    border-radius: 2px;
    background: ${({ $active }) => ($active ? '#0075e3' : 'transparent')};
  }

  &:hover {
    color: ${({ $active }) => ($active ? '#0066c3' : '#0a1551')};
  }

  &:hover::after {
    background: ${({ $active }) => ($active ? '#0066c3' : 'transparent')};
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

export const SharedList = styled.div`
  display: grid;
  gap: 8px;
  padding: 8px 6px;
`;

export const SharedSkeletonCard = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  min-height: 114px;
  padding: 14px;
  border-radius: 10px;
  background: ${NOTIFICATION_SURFACE};
`;

export const SharedSkeletonBlock = styled(SkeletonBlock)`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const SharedSkeletonAvatar = styled(SharedSkeletonBlock)`
  flex: 0 0 auto;
  border-radius: 50%;
`;

export const SharedSkeletonBody = styled.div`
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
`;

export const SharedSkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// A container, not a link. Wrapping the whole card in an anchor gave screen
// readers one enormous link whose name was the title, the by-line, the message
// and every chip read out together; the title owns the link now and stretches
// over the card so the pointer target is unchanged.
export const SharedCard = styled.article`
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  border: 0;
  border-radius: 10px;
  background: ${NOTIFICATION_SURFACE};
  color: inherit;
  /* The title's stretched link covers the card, so the pointer has to say the
     whole card is clickable — losing this made the target invisible. */
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover [data-card-action],
  &:focus-within [data-card-action] {
    opacity: 1;
  }

  &:hover {
    background: #eef4ff;
  }

  /* Flag clicks focus the button inside the card. :focus-within alone must not
     paint that card like the open selection. */

  /* Resting fill matches the preview pane. Hover and selected fills stay the
     Activity Log blues. Unread remains a separate dot. */
  ${({ $selected }) => $selected && css`
    &,
    &:focus-within {
      background: #eef4ff;
    }

    &:hover {
      background: #eaf1ff;
    }
  `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// Anything the reviewer can click on its own — the read toggle — has to sit
// above the stretched link or it becomes unreachable. It lives at the end of
// the context row rather than out at the card's far corner, and stays quiet
// until the row is pointed at or focused. Devices without hover keep it on,
// since there is no way to reveal it there.
export const SharedFlagButton = styled.button`
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $flagged }) => ($flagged ? '#2563eb' : '#6f76a7')};
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
    color: ${({ $flagged }) => ($flagged ? '#1d4ed8' : '#343c6a')};
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
    pointer-events: none;
  }
`;

// A teammate gets their initials, the reviewer's own note a pen. Per-person
// avatar tints were tried and dropped: at 38px the pastels a small palette can
// afford are too close to tell apart, so the colour named nobody while adding
// a third unrelated hue to a card that already carries a blue state and a warm
// badge. The initials do that job; colour on a card is left to state.
export const SenderAvatar = styled.span`
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ $isCurrentUser }) => ($isCurrentUser ? '#ecedf1' : '#f3e8ff')};
  color: ${({ $isCurrentUser }) => ($isCurrentUser ? '#343c6a' : '#6b21a8')};
  font-size: 12px;
  font-weight: 750;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const SharedContent = styled.div`
  min-width: 0;
`;

export const SharedTopLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
`;

// A mark, not a surface: unread is carried by a small object on the card so it
// cannot be mistaken for the card-wide treatment that means "selected". It sits
// in the card's own top-left corner, outside every column. Set inline ahead of
// the title it read as part of the link — a bullet belonging to that sentence
// rather than a state belonging to the card — and it indented one title past
// its neighbours, which cost the column its scannability.
// It lives midway between the card edge and the avatar, on the same horizontal
// centre line as the avatar initials.
export const UnreadDot = styled.span`
  position: absolute;
  top: 30px;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1463ff;
`;

export const SharedTitle = styled.h3`
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: ${({ $unread }) => ($unread ? '700' : '600')};
  line-height: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SharedTitleLink = styled(Link)`
  color: #0a1551;
  text-decoration: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 11px;
  }

  &:focus-visible {
    outline: 2px solid #85aaff;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

// The badge says the row wants something from the reviewer, so it is the one
// warm thing on the card. It used to be purple — the same purple the avatar
// wore, which made one colour mean both "who wrote this" and "why is this
// here" — and it competed with the blue the unread bar and the replay chip
// already speak.
export const MentionTagBadge = styled.span`
  padding: 3px 8px;
  border-radius: 999px;
  background: ${({ $variant }) => {
    if ($variant === 'youMentioned') return '#eff8ff';
    if ($variant === 'privateNote') return '#ecfdf5';
    return '#fef3c7';
  }};
  color: ${({ $variant }) => {
    if ($variant === 'youMentioned') return '#175cd3';
    if ($variant === 'privateNote') return '#047857';
    return '#92400e';
  }};
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
`;

// #7a8497 measured 3.8:1 on white — under the 4.5:1 floor for 12px text.
export const SharedByLine = styled.div`
  margin-top: 2px;
  color: #6d7381;
  font-size: 12px;
`;

export const SharedMessageBlock = styled.div`
  margin: 10px 0 16px;
`;

export const SharedMessage = styled.p`
  margin: 0;
  color: #0a1551;
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  word-break: break-word;

  ${({ $expanded }) => !$expanded && css`
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  `}
`;

export const SharedContext = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  min-width: 0;
  color: #9ca3b3;
  font-size: 12px;
`;

// The timestamp leads into the URL and keeps the regular session play pill's
// internal proportions at the compact size used by note rows.
export const ContextTimeChip = styled(Link)`
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  width: 60px;
  height: 25px;
  padding: 0 4px;
  border-radius: 4px;
  background: #0075e3;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;

  svg {
    flex: 0 0 auto;
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: #0066c3;
    color: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid #9ac7f2;
    outline-offset: 2px;
  }
`;

export const HighlightMark = styled.mark`
  padding: 1px 3px;
  border-radius: 3px;
  background: #fef08a;
  color: #713f12;
  font-weight: inherit;
`;

export const SharedPathSlot = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

// #78839a measured 3.8:1 on white, under the 4.5:1 floor — and this is the
// smallest text on the card. Grow into leftover row space; ellipsis only when
// the path still cannot fit.
export const SharedPath = styled.span`
  && {
    display: block;
  }

  position: relative;
  z-index: 2;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  color: #9ca3b3;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;

  &:focus-visible {
    outline: 2px solid #9ac7f2;
    outline-offset: 2px;
  }
`;

export const SharedEmptyAction = styled.button`
  margin-top: 14px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  background: #ffffff;
  color: #344054;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }

  &:focus-visible {
    outline: 2px solid #2e6fdb;
    outline-offset: 2px;
  }
`;

export const SharedEmpty = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  min-height: 0;
  padding: 32px 8px;
  border: 1px solid #e8e9ef;
  border-radius: 12px;
  background: #ffffff;
  color: #6f76a7;
  font-size: 14px;
  font-weight: 400;
  text-align: center;

  strong {
    display: block;
    margin-bottom: 6px;
    color: #26334d;
    font-size: 16px;
  }

  strong:only-child {
    margin-bottom: 0;
  }

  @media (max-width: 720px) {
    padding: 20px 4px;
    font-size: 13px;
  }
`;

export const SharedInboxEmpty = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  box-sizing: border-box;
  width: 100%;
  min-height: 0;
  padding: 32px 8px;
  text-align: center;

  @media (max-width: 720px) {
    padding: 28px 4px;
  }
`;

export const SharedInboxEmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: min(361px, 100%);
`;

export const SharedInboxEmptyIllustration = styled.div`
  flex: 0 0 auto;
  width: min(170px, 100%);
  aspect-ratio: 170 / 100.155;

  img {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const SharedInboxEmptyCopy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: min(360px, 100%);
  min-height: ${({ $stabilizeHeight }) => ($stabilizeHeight ? '71px' : 'auto')};
  word-break: break-word;
`;

export const SharedInboxEmptyTitle = styled.h2`
  margin: 0;
  color: #0a1551;
  font-size: 22px;
  font-weight: 700;
  line-height: normal;
`;

export const SharedInboxEmptyDescription = styled.p`
  margin: 0;
  color: #6c73a8;
  font-size: 16px;
  font-weight: 400;
  line-height: normal;
`;

/* ------------------------------------------------------------------------ *
 * Preview pane
 *
 * Open notes split the page 2/3 list, 1/3 preview, with the shell gutter
 * between them. With nothing selected the list takes the whole width.
 * ------------------------------------------------------------------------ */
