import React from 'react';
import PropTypes from 'prop-types';
import {
  IconArrowsUpDown,
  IconArrowPointerClickFilled,
  IconMagnifyingGlassPlus
} from '../../ui/icons';
import {
  InsightsModeTab,
  InsightsModeTabList
} from './ScBehaviorLensPageInsights';

export const INSIGHTS_MODE_CLICK_MAPS = 'clickMaps';
export const INSIGHTS_MODE_SCROLL_MAPS = 'scrollMaps';
export const INSIGHTS_MODE_INSPECT = 'inspect';

export const INSIGHTS_MODES = [
  {
    id: INSIGHTS_MODE_CLICK_MAPS,
    label: 'Click Maps',
    icon: IconArrowPointerClickFilled
  },
  {
    id: INSIGHTS_MODE_SCROLL_MAPS,
    label: 'Scroll Maps',
    icon: IconArrowsUpDown
  },
  {
    id: INSIGHTS_MODE_INSPECT,
    label: 'Inspect Mode',
    icon: IconMagnifyingGlassPlus
  }
];

const InsightsModeTabs = ({ activeAccent, activeMode, onModeChange }) => (
  <InsightsModeTabList role="tablist" aria-label="Page Insights mode">
    {INSIGHTS_MODES.map(mode => {
      const Icon = mode.icon;
      return (
        <InsightsModeTab
          key={mode.id}
          type="button"
          role="tab"
          aria-selected={activeMode === mode.id}
          $active={activeMode === mode.id}
          $accent={activeMode === mode.id ? activeAccent : undefined}
          $view={mode.id}
          data-testid={`behaviorlens-insights-mode-${mode.id}`}
          onClick={() => onModeChange(mode.id)}
        >
          <Icon aria-hidden="true" />
          {mode.label}
        </InsightsModeTab>
      );
    })}
  </InsightsModeTabList>
);

InsightsModeTabs.propTypes = {
  activeAccent: PropTypes.string,
  activeMode: PropTypes.string.isRequired,
  onModeChange: PropTypes.func.isRequired
};

InsightsModeTabs.defaultProps = {
  activeAccent: undefined
};

export default InsightsModeTabs;
