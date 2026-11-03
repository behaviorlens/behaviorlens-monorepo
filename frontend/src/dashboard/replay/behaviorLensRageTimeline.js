import { RAGE_ZONE_MIN_MS } from '../shared/behaviorLensEvents';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const zoneOffsets = (zone, firstTimestamp, durationMs) => {
  const startOffset = clamp(zone.startTs - firstTimestamp, 0, durationMs);
  const rawEndOffset = clamp(zone.endTs - firstTimestamp, 0, durationMs);
  const endOffset = clamp(Math.max(rawEndOffset, startOffset + RAGE_ZONE_MIN_MS), 0, durationMs);
  return { endOffset, startOffset };
};

export const mountRageClickTimelineZones = ({
  durationMs,
  firstTimestamp,
  onSeek,
  progressEl,
  zones
}) => {
  if (!progressEl || !(durationMs > 0) || !Array.isArray(zones) || zones.length === 0) {
    return () => {};
  }

  const layer = document.createElement('div');
  layer.className = 'behaviorlens-rage-zones';
  layer.dataset.testid = 'behaviorlens-rage-zones';

  zones.forEach((zone, index) => {
    const { endOffset, startOffset } = zoneOffsets(zone, firstTimestamp, durationMs);
    const width = Math.max(0, endOffset - startOffset);
    if (!(width > 0)) {
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'behaviorlens-rage-zone';
    button.dataset.testid = 'behaviorlens-rage-zone';
    button.setAttribute('aria-label', 'behaviorlens-rage-clicks');
    button.style.left = `${(startOffset / durationMs) * 100}%`;
    button.style.width = `${(width / durationMs) * 100}%`;
    const seek = event => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onSeek === 'function') {
        onSeek(startOffset);
      }
    };
    const ignore = event => {
      event.preventDefault();
      event.stopPropagation();
    };
    button.addEventListener('mousedown', seek);
    button.addEventListener('click', ignore);
    button.dataset.zoneIndex = String(index);
    layer.appendChild(button);
  });

  progressEl.appendChild(layer);
  return () => {
    if (layer.parentNode) {
      layer.parentNode.removeChild(layer);
    }
  };
};
