import React from 'react';
import PropTypes from 'prop-types';
import { IconSliders } from '../../ui/icons';
import {
  ChromeBar,
  ChromeDevToolsButton
} from './ScBehaviorLensWorkspace';

// Stage chrome under the workspace tabs: Dev Tools stays anchored to the left
// in both Session Replay and Page Insights.
const ReplayContextChrome = ({
  devToolsOpen, disabled, onToggleDevTools
}) => (
  <ChromeBar data-testid="behaviorlens-replay-context-chrome">
    <ChromeDevToolsButton
      type="button"
      $active={devToolsOpen && !disabled}
      aria-pressed={devToolsOpen && !disabled}
      aria-label={disabled
        ? 'Dev Tools unavailable in Scroll Maps'
        : (devToolsOpen ? 'Close Dev Tools' : 'Open Dev Tools')}
      disabled={disabled}
      onClick={disabled ? undefined : onToggleDevTools}
      data-testid="behaviorlens-devtools-toggle"
    >
      <IconSliders aria-hidden="true" />
      <span>Dev Tools</span>
    </ChromeDevToolsButton>
  </ChromeBar>
);

ReplayContextChrome.defaultProps = {
  devToolsOpen: false,
  disabled: false
};

ReplayContextChrome.propTypes = {
  devToolsOpen: PropTypes.bool,
  disabled: PropTypes.bool,
  onToggleDevTools: PropTypes.func.isRequired
};

export default ReplayContextChrome;
