export const CUSTOM_EVENT_TAG_COLORS = {
  'draw-mode-start': '#1463ff',
  'voice-recording-start': '#16a34a'
};

export const PLAYBACK_SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];

export const getListReturnPath = value => (
  typeof value === 'string' && (
    value === '/app'
    || value.startsWith('/app?')
    || value === '/app/mentions-and-notes'
    || value.startsWith('/app/mentions-and-notes?')
  )
    ? value
    : '/app'
);
