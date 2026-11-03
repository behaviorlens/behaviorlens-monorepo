import styled, { css } from 'styled-components';
import {
  BookmarkedToggleLabel,
  PlaylistCard,
  PlaylistTitle,
  Toolbar
} from '../sessions/ScBehaviorLensSessionListPage';

export const SavedFilterToolbar = styled(Toolbar)``;

export const SavedFilterPlaylistCard = styled(PlaylistCard)`
  ${({ $savedFilterMode }) => $savedFilterMode && css`
    flex: 1 1 auto;
    align-self: stretch;
    height: 100%;
    min-height: 0;
    max-height: none;
    padding: 16px 16px 24px;
    border-color: #e5eaf5;
    box-shadow: 0 4px 8px rgba(13, 20, 51, 0.06);

    [data-session-row] {
      min-height: 64px;
      grid-template-columns: 88px minmax(0, 1fr) 24px;
      grid-template-areas: "tile identity bookmark";
      column-gap: 16px;
      padding: 11px 16px 11px 0;
    }

    [data-session-row-context] {
      display: none;
    }

    @media (max-width: 1120px) {
      flex: 0 0 auto;
      height: auto;
      min-height: ${64 * 3 + 150}px;
      max-height: min(740px, calc(100vh - 120px));
    }
  `}
`;

export const SavedFilterPlaylistTitle = styled(PlaylistTitle)``;

export const SavedFilterBookmarkedToggleLabel = styled(BookmarkedToggleLabel)`
  ${({ $savedFilterMode }) => $savedFilterMode && css`
    gap: 8px;
    font-size: 14px;
  `}
`;
