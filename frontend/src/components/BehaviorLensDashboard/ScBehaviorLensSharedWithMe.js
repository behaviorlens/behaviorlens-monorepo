import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { Modal, ModalBody } from '../../ui';
import {
  ControlIconButton, ControlPlayButton, WorkspaceActionPopoverClose
} from './ScBehaviorLensWorkspace';
import {
  COLUMN_GAP,
  DASHBOARD_CARD_SHADOW,
  NOTIFICATION_SURFACE,
  PANE_PREVIEW_WIDTH,
  PREVIEW_PLAYER_CARD_BACKGROUND,
  SenderAvatar,
  SharedSkeletonBlock
} from './ScBehaviorLensSharedList';

export * from './ScBehaviorLensSharedList';

export const SharedLayout = styled.div`
  display: grid;
  flex: 1 1 auto;
  align-self: stretch;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: ${COLUMN_GAP}px;
  align-items: stretch;
  width: 100%;
  min-height: 0;
  /* Visible so the preview pane's dashboard card shadow can paint into the
     column gap and shell padding. The list still clips inside SharedListScrollFrame. */
  overflow: visible;

  &[data-pane='true'] {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }

  @media (max-width: 860px) {
    overflow: visible;

    &[data-pane='true'] {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

export const SharedListColumn = styled.div`
  align-self: stretch;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-width: none;
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid #e8e9ef;
  border-radius: 12px;
  background: ${NOTIFICATION_SURFACE};

  @media (max-width: 860px) {
    overflow: visible;
  }
`;

export const SharedListScrollFrame = styled.div`
  position: relative;
  display: flex;
  align-self: stretch;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  max-width: none;
  max-height: 100%;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: ${DASHBOARD_CARD_SHADOW};

  > ${SharedListColumn} {
    align-self: stretch;
    flex: 1 1 auto;
    max-height: none;
  }

  @media (max-width: 860px) {
    align-self: start;
    height: auto;
    overflow: visible;

    > ${SharedListColumn} {
      align-self: start;
      flex: none;
      max-height: 100%;
    }
  }
`;

const ScrollEdgeFade = styled.div`
  position: absolute;
  z-index: 2;
  right: 0;
  ${({ $edge }) => ($edge === 'top' ? 'top: 0;' : 'bottom: 0;')}
  left: 0;
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

export const SharedListFade = styled(ScrollEdgeFade)`
  /* Blur only the notification field. Keep the list border, row gutters, and
    native scrollbar sharp instead of washing out the surrounding card. */
  right: 22px;
  ${({ $edge }) => ($edge === 'top' ? 'top: 1px;' : 'bottom: 1px;')}
  left: 7px;
  height: 32px;

  @media (max-width: 860px) {
    display: none;
  }
`;

// The details surface occupies the full page area, including the title row
// above this component. The grid still reserves its right-hand column, while
// absolute positioning lets the solid white pane run from the page's top edge
// to its bottom instead of beginning underneath the toolbar.
export const PreviewPane = styled.aside`
  position: absolute;
  z-index: 1;
  top: -40px;
  right: 0;
  bottom: 0;
  left: auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: ${PANE_PREVIEW_WIDTH};
  min-width: 0;
  min-height: 0;
  overflow: visible;
  border: 1px solid #e8e9ef;
  border-radius: 12px;
  background: ${NOTIFICATION_SURFACE};
  box-shadow: ${DASHBOARD_CARD_SHADOW};

  @media (max-width: 860px) {
    position: relative;
    top: 0;
    width: 100%;
    height: auto;
  }
`;

export const PreviewPaneBody = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  padding: 24px;
  border-radius: 12px;
`;

export const SharedSkeletonPreview = styled(PreviewPane)`
  pointer-events: none;
`;

export const SharedSkeletonPreviewBody = styled.div`
  display: grid;
  gap: 16px;
`;

export const SharedSkeletonMedia = styled(SharedSkeletonBlock)`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
`;

export const SharedSkeletonAction = styled(SharedSkeletonBlock)`
  align-self: stretch;
  width: 100%;
  margin-top: auto;
  border-radius: 4px;
`;

export const PaneHead = styled.div`
  flex: none;
`;

export const PaneTitle = styled.h2`
  margin: 0 0 8px;
  color: #0a1551;
  font-size: 16px;
  font-weight: 700;
  line-height: normal;
`;

export const PaneSessionMetaLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 8px;
  color: #6c73a8;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
`;

export const PaneByLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3b3;
  font-size: 12px;
`;

export const PaneAuthorAvatar = styled(SenderAvatar)`
  width: 20px;
  height: 20px;
  font-size: 8px;
`;

export const PaneAuthorName = styled.strong`
  color: #0a1551;
  font-size: 12px;
  font-weight: 500;
`;

export const PaneStill = styled.div`
  flex: none;
`;

export const PreviewNoteSlot = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

export const PaneNoteThread = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

export const PaneNoteScroller = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const PaneNoteFade = styled.div`
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
`;

export const PanePlayerShell = styled.div`
  display: grid;
  gap: 10px;

  ${({ $preview }) => $preview && css`
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 0;
    gap: 0;
    padding: 0 16px 8px;
    overflow: hidden;
    background: ${PREVIEW_PLAYER_CARD_BACKGROUND};

    > [data-shared-player-frame] {
      flex: 1 1 auto;
      align-self: center;
      width: calc(100% - 40px);
      min-height: 0;
      aspect-ratio: auto;
    }

    > [data-shared-player-transport='compact'] {
      display: none;
    }

    > [data-shared-player-transport='fullscreen'] {
      display: block;
    }
  `}
`;

export const PanePlayerFrame = styled.div`
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 1px solid #e8e9ef;
  border-radius: 12px;
  background: ${PREVIEW_PLAYER_CARD_BACKGROUND};
  box-shadow: ${DASHBOARD_CARD_SHADOW};
`;

export const PanePlayerMount = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: ${PREVIEW_PLAYER_CARD_BACKGROUND};

  .rr-player,
  .rr-player__frame {
    background: ${PREVIEW_PLAYER_CARD_BACKGROUND} !important;
  }

  .rr-player {
    transform-origin: top left;
  }
`;

export const PanePlayerStatus = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: ${PREVIEW_PLAYER_CARD_BACKGROUND};
  color: #5b6577;
  font-size: 12px;
  text-align: center;
`;

export const PanePlayerTransport = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto 20px;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0;
  background: #ffffff;
`;

export const PanePlayerPlayButton = styled(ControlPlayButton)`
  && {
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    height: 32px;
    min-height: 32px;
    max-height: 32px;
  }

  && svg,
  && svg.behaviorlens-transport-glyph {
    width: 12px;
    height: 12px;
  }
`;

export const PanePlayerExpandButton = styled(ControlIconButton)`
  && {
    width: 20px;
    height: 20px;
  }

  && svg {
    width: 20px;
    height: 20px;
  }
`;

export const PanePlayerFullscreenTransport = styled.div`
  display: none;
  flex: 0 0 auto;
`;

export const SharedPlayerPreviewSurface = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding-top: 44px;
  overflow: hidden;
  background: ${PREVIEW_PLAYER_CARD_BACKGROUND};
`;

export const SharedPlayerPreviewClose = styled(WorkspaceActionPopoverClose)`
  position: absolute;
  z-index: 2;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const PanePlayerRange = styled.input`
  width: 100%;
  min-width: 0;
  height: 4px;
  accent-color: #0a1551;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;

export const PanePlayerTime = styled.span`
  color: #0c154e;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

/* The full workspace is still a modal rather than a route transition: the
   inbox remains mounted underneath it, including its filter, scroll and
   selected-row state. Magnet owns focus trapping, Escape and focus return;
   this sizing only gives the existing workspace enough room to be useful. */
export const SharedWorkspaceModal = styled(Modal)`
  && {
    width: calc(100vw - 48px);
    max-width: none;
    height: calc(100vh - 64px);
    max-height: none;
    overflow: hidden;
  }

  @media (max-width: 640px) {
    && {
      width: 100%;
      height: 100%;
      border-radius: 0;
    }
  }
`;

export const SharedPlayerPreviewModal = styled(SharedWorkspaceModal)`
  && {
    width: calc(100vw - 80px);
    height: calc(100vh - 80px);
  }

  @media (max-width: 640px) {
    && {
      width: 100%;
      height: 100%;
    }
  }
`;

export const SharedWorkspaceModalBody = styled(ModalBody)`
  && {
    /* Magnet's desktop xs:grow-0 utility otherwise collapses this body to
       its zero-height child. The panel has an explicit height, so the body
       must own all space left below ModalHeader. */
    flex: 1 1 0 !important;
    width: 100%;
    min-height: 0;
    overflow: hidden;
  }
`;

export const SharedWorkspaceContent = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f7f9fc;

  > [data-testid='behaviorlens-workspace'] {
    height: 100%;
    min-height: 0;
  }
`;

// The list keeps its message as plain prose; here there is room to mark who
// the note is addressed to without crowding the row.
export const PaneMentionChip = styled.span`
  padding: 1px 4px;
  border-radius: 4px;
  background: #eaf1ff;
  color: #17408f;
  font-weight: 650;
  white-space: nowrap;
`;

// Full-width so the preview CTA is the whole bottom row, not a chip on the right.
export const PaneFoot = styled.div`
  flex: none;
  display: flex;
  align-items: stretch;
  width: 100%;
  margin-top: auto;
`;

export const PanePrimary = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  padding: 0 12px;
  white-space: nowrap;
  border-radius: 4px;
  background: #0075e3;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: #0066c3;
  }

  &:focus-visible {
    outline: 2px solid #9ac7f2;
    outline-offset: 2px;
  }
`;

export const PaneGhost = styled.button`
  flex: none;
  min-height: 34px;
  padding: 0 12px;
  white-space: nowrap;
  border: 1px solid #d5dbe6;
  border-radius: 8px;
  background: #ffffff;
  color: #475467;
  font: inherit;
  font-size: 12.5px;
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

// ↑ / ↓ / Enter still work; they are no longer advertised on the pane. Printed
// under the buttons the legend was a permanent line of instructions for a
// shortcut a reviewer learns once.

// A reply is written in the workspace but it belongs to the note, so the row
// carries it too. Without this the reviewer answers a question and the list
// still reads as if nobody had.
