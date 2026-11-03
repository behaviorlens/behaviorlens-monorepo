import {
  useCallback, useEffect, useMemo, useState
} from 'react';
import { buildActivityInsights } from '../shared/behaviorLensEvents';

const ACTIVITY_SPARKLINE_BUCKETS = 40;

const formatActivityOffset = value => {
  const totalSeconds = Math.max(0, Math.round(Number(value || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

const getFrustrationLevel = rageClickCount => {
  if (rageClickCount >= 3) {
    return { label: 'High', tone: 'high' };
  }

  if (rageClickCount >= 1) {
    return { label: 'Medium', tone: 'medium' };
  }

  return { label: 'Low', tone: 'low' };
};

// Small area chart of Activity Log density across the full replay timeline.
// Raw rrweb snapshots and DOM mutations are deliberately excluded: they can
// continue during visitor inactivity and would paint activity where the log
// has no interaction.
export const buildActivitySparklineOptions = (
  insights,
  { durationMs: replayDurationMs, firstTimestamp: replayFirstTimestamp } = {}
) => {
  const visibleInsights = Array.isArray(insights)
    ? insights.filter(insight => insight?.kind !== 'mouse')
    : [];
  if (visibleInsights.length === 0) {
    return null;
  }

  const firstTs = Number.isFinite(Number(replayFirstTimestamp))
    ? Number(replayFirstTimestamp)
    : Number(visibleInsights[0]?.timestamp || 0);
  const lastTs = Number(visibleInsights[visibleInsights.length - 1]?.timestamp || firstTs);
  const durationMs = Math.max(1, Number(replayDurationMs) || (lastTs - firstTs));
  const bucketSizeMs = durationMs / ACTIVITY_SPARKLINE_BUCKETS;
  const buckets = new Array(ACTIVITY_SPARKLINE_BUCKETS).fill(0);

  visibleInsights.forEach(insight => {
    const ts = Number(insight?.timestamp || 0);
    if (!ts) {
      return;
    }
    const bucketIndex = Math.min(ACTIVITY_SPARKLINE_BUCKETS - 1, Math.floor((ts - firstTs) / bucketSizeMs));
    buckets[bucketIndex] += 1;
  });

  const maxBucketCount = Math.max(...buckets, 1);
  const activityData = buckets.map((count, index) => {
    const startOffsetMs = index * bucketSizeMs;
    const endOffsetMs = Math.min(durationMs, (index + 1) * bucketSizeMs);
    const chartOffsetMs = (index / (ACTIVITY_SPARKLINE_BUCKETS - 1)) * durationMs;
    const ratio = count / maxBucketCount;
    const intensity = count === 0 ? 'No activity' : ratio >= 0.67 ? 'High activity' : ratio >= 0.34 ? 'Medium activity' : 'Low activity';
    return {
      y: count,
      custom: {
        eventLabel: `${count} event${count === 1 ? '' : 's'}`,
        intensity,
        seekOffsetMs: Math.round(chartOffsetMs),
        timeRange: `${formatActivityOffset(startOffsetMs)}–${formatActivityOffset(endOffsetMs)}`
      }
    };
  });

  return {
    chart: {
      type: 'area', height: 62, backgroundColor: 'transparent', margin: [4, 2, 4, 2]
    },
    title: { text: undefined },
    credits: { enabled: false },
    exporting: { enabled: false },
    navigation: { buttonOptions: { enabled: false } },
    legend: { enabled: false },
    xAxis: { visible: false, crosshair: { color: '#0075e3', width: 1 } },
    yAxis: { visible: false },
    tooltip: {
      enabled: true,
      animation: false,
      backgroundColor: '#111827',
      borderColor: '#111827',
      borderRadius: 7,
      padding: 8,
      shadow: false,
      style: { color: '#ffffff', fontSize: '11px' },
      useHTML: true,
      formatter() {
        const details = this.point?.custom || {};
        return `<strong>${details.timeRange || '-'}</strong><br/>${details.eventLabel || '0 events'} · ${details.intensity || 'No activity'}`;
      }
    },
    plotOptions: {
      area: {
        color: '#0075e3',
        fillOpacity: 0.16,
        lineWidth: 1.7,
        marker: { enabled: false, states: { hover: { enabled: true, radius: 3 } } },
        states: { hover: { lineWidth: 2 } }
      }
    },
    series: [{ data: activityData, name: 'Activity' }]
  };
};

// Bundles the Activity Timeline's local UI state (category/search/mouse-move
// visibility) with the derived data driven by that state and the payload.
export const useSessionInsightsPanel = (payload, sessionId, replayDurationMs) => {
  const [eventFilter, setEventFilter] = useState('');
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [showMouseMoves, setShowMouseMoves] = useState(false);

  useEffect(() => {
    setEventFilter('');
    setCategoryFilters([]);
    setShowMouseMoves(false);
  }, [sessionId]);

  const events = useMemo(() => (Array.isArray(payload?.events) ? payload.events : []), [payload]);
  const insights = useMemo(() => buildActivityInsights(events), [events]);
  const rageClickCount = useMemo(() => insights.filter(item => item.isRageClick).length, [insights]);
  const eventTypeCounts = useMemo(() => insights.reduce((counts, item) => {
    counts.all += 1;
    counts[item.kind] = (counts[item.kind] || 0) + 1;
    if (item.isRageClick) {
      counts.rage += 1;
    }
    return counts;
  }, {
    all: 0, click: 0, input: 0, mouse: 0, rage: 0, scroll: 0, selection: 0
  }), [insights]);
  const frustration = useMemo(() => getFrustrationLevel(rageClickCount), [rageClickCount]);
  const activitySparklineOptions = useMemo(() => buildActivitySparklineOptions(insights, {
    durationMs: replayDurationMs,
    firstTimestamp: Number(events[0]?.timestamp || 0)
  }), [events, insights, replayDurationMs]);

  // Mouse-move events dominate raw sessions, so they're hidden unless toggled
  // on; category chips are the primary filter, free-text search is secondary.
  const filteredInsights = useMemo(() => {
    const term = eventFilter.trim().toLowerCase();

    return insights
      .filter(item => showMouseMoves || item.kind !== 'mouse')
      .filter(item => {
        if (categoryFilters.length > 0) {
          return categoryFilters.some(category => (
            category === 'rage' ? item.isRageClick : item.kind === category
          ));
        }
        return true;
      })
      .filter(item => !term || [item.label, item.detail, item.kind, item.timeLabel]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(term)))
      .slice(0, 400);
  }, [insights, showMouseMoves, categoryFilters, eventFilter]);

  const categoryFilter = categoryFilters.length === 1 ? categoryFilters[0] : 'all';
  const setCategoryFilter = useCallback(
    value => setCategoryFilters(value === 'all' ? [] : [value]),
    []
  );

  return {
    eventFilter,
    setEventFilter,
    categoryFilter,
    setCategoryFilter,
    categoryFilters,
    setCategoryFilters,
    showMouseMoves,
    setShowMouseMoves,
    filteredInsights,
    insights,
    eventTypeCounts,
    rageClickCount,
    frustration,
    activitySparklineOptions
  };
};
