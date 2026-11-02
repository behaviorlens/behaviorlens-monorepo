import React from 'react';
import PropTypes from 'prop-types';
import { IconArrowsSwitchVertical, IconClockEllipsis } from '../../ui/icons';
import {
  InsightsSectionLabel,
  ScrollAttentionLegend,
  ScrollAttentionLegendBar,
  ScrollAttentionLegendLabels,
  ScrollMapCard,
  ScrollMapMetricRow,
  ScrollMapMetricRows,
  ScrollMapReached,
  ScrollOverviewFill,
  ScrollOverviewLabel,
  ScrollOverviewRow,
  ScrollOverviewRows,
  ScrollOverviewTrack,
  ScrollOverviewValue
} from './ScBehaviorLensPageInsights';
import {
  formatVisibleDuration,
  SCROLL_ATTENTION_LEGEND_GRADIENT
} from './behaviorLensScrollMap';

// Screens, not raw pixels: "about 14 screens tall" is a length a reviewer can
// picture; 9,031px is not. The fold and the depth probe live on the page
// itself, so the rail does not repeat them.
const formatPageLength = scrollMap => {
  const height = Number(scrollMap.documentHeight);
  const fold = Number(scrollMap.initialFoldPx);
  if (!(height > 0)) {
    return null;
  }
  const pixels = `${Math.round(height).toLocaleString('en-US')}px`;
  return fold > 0
    ? `${pixels} · about ${Math.max(1, Math.round(height / fold))} screens`
    : pixels;
};

const DEPTH_BREAKDOWN_ROWS = [
  'Initial view',
  '20% scrolled',
  '40% scrolled',
  '60% scrolled',
  '80% scrolled',
  '100% scrolled'
];

// Attention is measured in narrow page-depth bands. Group those bands into
// the six requested depth steps and use largest-remainder rounding so the displayed
// shares always add up to exactly 100%.
const buildDepthBreakdown = bands => {
  const totals = DEPTH_BREAKDOWN_ROWS.map(() => 0);
  (Array.isArray(bands) ? bands : []).forEach(band => {
    const midpoint = (Number(band.depthStartPercent) + Number(band.depthEndPercent)) / 2;
    if (!Number.isFinite(midpoint)) return;
    const index = Math.max(0, Math.min(
      totals.length - 1,
      Math.floor(midpoint / (100 / totals.length))
    ));
    totals[index] += Math.max(0, Number(band.visibleMs) || 0);
  });
  const total = totals.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) return totals;
  const exact = totals.map(value => (value / total) * 100);
  const rounded = exact.map(Math.floor);
  let remainder = 100 - rounded.reduce((sum, value) => sum + value, 0);
  exact
    .map((value, index) => ({ fraction: value - rounded[index], index }))
    .sort((left, right) => right.fraction - left.fraction)
    .forEach(item => {
      if (remainder > 0) {
        rounded[item.index] += 1;
        remainder -= 1;
      }
    });
  return rounded;
};

const ScrollMapRail = ({ scrollMap }) => {
  const reachPercent = Number.isFinite(Number(scrollMap.reachPercent))
    ? Math.round(Number(scrollMap.reachPercent))
    : 0;
  const displayedReachPercent = scrollMap.pageIsScrollable === false ? 100 : reachPercent;
  const mostViewedPercent = Number.isFinite(Number(scrollMap.attention?.mostViewedDepthPercent))
    ? Math.round(Number(scrollMap.attention.mostViewedDepthPercent))
    : 0;
  const visibleDuration = formatVisibleDuration(scrollMap.attention?.totalVisibleMs) || 'Unavailable';
  const pageLength = formatPageLength(scrollMap) || 'Unavailable';
  const depthBreakdown = buildDepthBreakdown(scrollMap.attention?.bands);

  return (
    <>
      <ScrollMapCard data-testid="behaviorlens-scroll-depth-overview">
        <InsightsSectionLabel>SCROLL MAP OVERVIEW</InsightsSectionLabel>
        <ScrollMapMetricRows>
          <ScrollMapReached>
            {'Reached '}
            <strong data-testid="behaviorlens-scroll-reach-value">
              {`${displayedReachPercent}%`}
            </strong>
            {' of the page'}
          </ScrollMapReached>
          <ScrollMapMetricRow>
            <IconArrowsSwitchVertical aria-hidden="true" />
            <span>Most time at</span>
            <strong>{`${mostViewedPercent}%`}</strong>
          </ScrollMapMetricRow>
          <ScrollMapMetricRow>
            <IconClockEllipsis aria-hidden="true" />
            <span>Time on page</span>
            <strong data-testid="behaviorlens-scroll-visible-time">{visibleDuration}</strong>
          </ScrollMapMetricRow>
          <ScrollMapMetricRow>
            <IconArrowsSwitchVertical aria-hidden="true" />
            <span>Page height</span>
            <strong>{pageLength}</strong>
          </ScrollMapMetricRow>
        </ScrollMapMetricRows>
        <ScrollAttentionLegend
          aria-label="Less time to more time"
          data-testid="behaviorlens-scroll-attention-legend"
        >
          <ScrollAttentionLegendBar
            $gradient={SCROLL_ATTENTION_LEGEND_GRADIENT}
            data-testid="behaviorlens-scroll-attention-legend-bar"
          />
          <ScrollAttentionLegendLabels>
            <span>Less time</span>
            <span>More time</span>
          </ScrollAttentionLegendLabels>
        </ScrollAttentionLegend>
      </ScrollMapCard>

      <ScrollMapCard data-testid="behaviorlens-scroll-depth-breakdown">
        <InsightsSectionLabel>SCROLL DEPTH BREAKDOWN</InsightsSectionLabel>
        <ScrollOverviewRows>
          {DEPTH_BREAKDOWN_ROWS.map((label, index) => (
            <ScrollOverviewRow key={label}>
              <ScrollOverviewLabel>{label}</ScrollOverviewLabel>
              <ScrollOverviewTrack>
                <ScrollOverviewFill
                  $percent={depthBreakdown[index]}
                  $scaled
                />
              </ScrollOverviewTrack>
              <ScrollOverviewValue $percent={depthBreakdown[index]} $scaled>
                {`${depthBreakdown[index]}%`}
              </ScrollOverviewValue>
            </ScrollOverviewRow>
          ))}
        </ScrollOverviewRows>
      </ScrollMapCard>
    </>
  );
};

ScrollMapRail.propTypes = {
  scrollMap: PropTypes.object.isRequired
};

export default ScrollMapRail;
