import { describeSessionDevice } from './behaviorLensSessionRows';

const MAX_AUDIENCE_ROWS = 3;

const increment = (counts, label) => {
  counts.set(label, (counts.get(label) || 0) + 1);
};

const sortCounts = counts => [...counts.entries()]
  .sort(([leftLabel, leftCount], [rightLabel, rightCount]) => (
    rightCount - leftCount || leftLabel.localeCompare(rightLabel)
  ));

const compactCounts = counts => {
  const sorted = sortCounts(counts);
  if (sorted.length <= MAX_AUDIENCE_ROWS) {
    return sorted;
  }

  const leading = sorted.slice(0, MAX_AUDIENCE_ROWS - 1);
  const remainder = sorted.slice(MAX_AUDIENCE_ROWS - 1);
  return [
    ...leading,
    [
      remainder.map(([label]) => label).join(', '),
      remainder.reduce((total, [, count]) => total + count, 0)
    ]
  ];
};

const toRows = (counts, total) => compactCounts(counts).map(([label, count]) => ({
  count,
  label,
  percentage: total > 0 ? Math.round((count / total) * 100) : 0
}));

export const aggregateAudienceSnapshot = sessions => {
  const items = Array.isArray(sessions) ? sessions : [];
  const browserCounts = new Map();
  const deviceCounts = new Map();

  items.forEach(session => {
    const device = describeSessionDevice(session?.user_agent);
    const deviceLabel = [device.category, device.operatingSystem].filter(Boolean).join(' ')
      || 'Other';
    increment(deviceCounts, deviceLabel);
    increment(browserCounts, device.browser || 'Other');
  });

  return {
    browsers: toRows(browserCounts, items.length),
    devices: toRows(deviceCounts, items.length),
    total: items.length
  };
};
