import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  TimelineActivityCard,
  TimelineActivityChart
} from './ScBehaviorLensSessionTimeline';

const CHART_HEIGHT = 58;
const ACTIVITY_LINE_COLOR = '#2563eb';
const ACTIVITY_FILL_COLOR = '#dbeafe';
const PLAYHEAD_COLOR = '#4276ff';

const SessionActivityCard = ({ onSeek, options, seekEnabled }) => {
  const chartComponentRef = useRef(null);
  const chartMountRef = useRef(null);
  const interactiveOptions = useMemo(() => ({
    ...options,
    chart: {
      ...options?.chart,
      height: CHART_HEIGHT,
      // Keep the scrubber baseline fixed while giving the activity area more
      // vertical room above it.
      margin: [10, 0, 10, 0],
      spacing: [0, 0, 0, 0]
    },
    xAxis: {
      ...options?.xAxis,
      minPadding: 0,
      maxPadding: 0,
      startOnTick: false,
      endOnTick: false,
      crosshair: { color: PLAYHEAD_COLOR, width: 1 }
    },
    tooltip: {
      ...options?.tooltip,
      outside: true,
      style: {
        ...options?.tooltip?.style,
        zIndex: 1000
      }
    },
    plotOptions: {
      ...options?.plotOptions,
      area: {
        ...options?.plotOptions?.area,
        color: ACTIVITY_LINE_COLOR,
        fillColor: ACTIVITY_FILL_COLOR,
        fillOpacity: 1,
        lineWidth: 0.5,
        cursor: seekEnabled ? 'pointer' : 'default'
      }
    }
  }), [options, seekEnabled]);

  useEffect(() => {
    const chartMount = chartMountRef.current;
    if (!chartMount || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    let animationFrame = null;
    const resizeChart = entries => {
      const width = Math.round(entries[0]?.contentRect?.width || chartMount.clientWidth || 0);
      if (width <= 0) {
        return;
      }
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        const chart = chartComponentRef.current?.chart;
        if (chart && chart.chartWidth !== width) {
          chart.setSize(width, CHART_HEIGHT, false);
        }
      });
    };
    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(chartMount);

    return () => {
      resizeObserver.disconnect();
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [options]);

  const seekFromPointer = event => {
    if (!seekEnabled) {
      return;
    }
    const points = options?.series?.[0]?.data || [];
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!points.length || bounds.width <= 0) {
      return;
    }
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const bucketIndex = Math.round(ratio * (points.length - 1));
    const offsetMs = points[bucketIndex]?.custom?.seekOffsetMs;
    if (Number.isFinite(offsetMs)) {
      onSeek(offsetMs);
    }
  };

  if (!options) {
    return null;
  }

  return (
    <TimelineActivityCard
      aria-label={seekEnabled
        ? 'Session activity. Click the chart to seek the replay.'
        : 'Session activity'}
      data-testid="behaviorlens-timeline-activity"
    >
      <TimelineActivityChart
        ref={chartMountRef}
        $locked={!seekEnabled}
        onClick={seekEnabled ? seekFromPointer : undefined}
        title={seekEnabled ? 'Click to seek replay' : undefined}
      >
        <HighchartsReact
          ref={chartComponentRef}
          highcharts={Highcharts}
          options={interactiveOptions}
        />
      </TimelineActivityChart>
    </TimelineActivityCard>
  );
};

SessionActivityCard.propTypes = {
  onSeek: PropTypes.func,
  options: PropTypes.object,
  seekEnabled: PropTypes.bool
};

SessionActivityCard.defaultProps = {
  onSeek: () => {},
  options: null,
  seekEnabled: true
};

export default SessionActivityCard;
