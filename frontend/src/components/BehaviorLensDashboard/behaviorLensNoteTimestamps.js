const TIMESTAMP_PATTERN = new RegExp(
  '(?<![A-Za-z0-9:.])(?:(?<hours>\\d{1,2})(?<hourSeparator>[:.])(?<minutesWithHours>[0-5]\\d)'
    + '\\k<hourSeparator>(?<secondsWithHours>[0-5]\\d)|(?<minutes>[0-5]?\\d)[:.](?<seconds>[0-5]\\d))'
    + '(?![A-Za-z0-9:]|\\.\\d)',
  'g'
);

const toNumber = value => Number(value || 0);

export const formatReplayTimestamp = offsetMs => {
  const totalSeconds = Math.max(0, Math.floor(Number(offsetMs) / 1000) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`;
};

export const formatRelativeTime = value => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return '';
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 10) {
    return 'Just now';
  }
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  return `${Math.floor(elapsedHours / 24)}d ago`;
};

export const parseBehaviorLensNoteTimestamps = text => {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }

  const tokens = [];
  let index = 0;
  let match = TIMESTAMP_PATTERN.exec(text);

  while (match) {
    if (match.index > index) {
      tokens.push({ text: text.slice(index, match.index), type: 'text' });
    }

    const hours = toNumber(match.groups?.hours);
    const minutes = toNumber(match.groups?.minutesWithHours || match.groups?.minutes);
    const seconds = toNumber(match.groups?.secondsWithHours || match.groups?.seconds);
    tokens.push({
      offsetMs: ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000,
      text: match[0],
      type: 'timestamp'
    });
    index = match.index + match[0].length;
    match = TIMESTAMP_PATTERN.exec(text);
  }

  if (index < text.length) {
    tokens.push({ text: text.slice(index), type: 'text' });
  }

  return tokens;
};
