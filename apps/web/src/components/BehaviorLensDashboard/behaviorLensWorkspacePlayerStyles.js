import { css } from 'styled-components';

// Session Replay owns transport in React (`ReplayControlBar`) and the
// activity strip + notes row + scrubber in `SessionTimeline`. Hiding rrweb's
// entire controller removes the duplicate progress bar without changing
// embedded or AI-review players, which continue to use the stock controller.
export const behaviorLensWorkspacePlayerStyles = css`
  .behaviorlens-workspace-stage .rr-player,
  .behaviorlens-workspace-stage .rr-player__frame {
    background: #f5f9ff !important;
  }

  .behaviorlens-workspace-stage .rr-controller {
    display: none !important;
  }
`;
