// TEST/DEV FIXTURE ONLY — never imported by product code.
// Compact events that keep Session Timeline unit tests independent of the
// multi-megabyte sessionReplayN recordings.

const START = 1700000000000;

const event = (type, offsetMs, data) => ({
  type,
  timestamp: START + offsetMs,
  data
});

const click = (offsetMs, id, x = 12, y = 18) => event(3, offsetMs, {
  source: 2, type: 2, x, y, id
});

export const CURATED_TIMELINE_DURATION_MS = 70000;

export const CURATED_TIMELINE_EVENTS = [
  event(4, 0, { href: 'http://localhost:5174/products/1', width: 1200, height: 800 }),
  event(2, 0, { node: { type: 0, id: 1, childNodes: [] } }),
  click(8000, 13, 400, 400),
  click(9200, 14, 400, 400),
  click(10400, 15, 400, 400),
  event(5, 11000, { tag: 'behaviorlens-page-start' }),
  click(14000, 19, 400, 400),
  event(5, 15000, { tag: 'behaviorlens-add-field' }),
  event(5, 18000, { tag: 'behaviorlens-advanced-settings' }),
  click(19000, 20, 400, 400),
  event(5, 22000, { tag: 'advanced-designer-opened' }),
  click(25000, 16, 400, 400),
  click(26200, 17, 400, 400),
  click(27400, 18, 400, 400),
  event(3, 30000, { source: 5, id: 90, text: 'x' }),
  event(3, 32000, { source: 3, y: 80 }),
  click(35000, 21, 400, 400),
  click(40000, 22, 400, 400),
  click(46000, 33335),
  click(46200, 33335),
  click(46400, 33335),
  click(46600, 33335),
  event(5, 50000, { tag: 'behaviorlens-preview-form' }),
  click(55000, 23, 400, 400),
  click(58000, 24, 400, 400),
  event(5, 60000, { tag: 'behaviorlens-page-result' }),
  click(64000, 25, 400, 400),
  event(3, CURATED_TIMELINE_DURATION_MS, {
    source: 2, type: 2, x: 400, y: 400, id: 26
  })
];
