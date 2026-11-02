// Load test for the ingest API: many recordings sending batches at once.
// Each simulated recording posts a gzip batch every 5 s (the recorder's
// default), built from a real recorded session's events.
//
// Usage: npm run load:ingest -- [recordings=50] [seconds=600]
// Targets (roadmap M1): ingest p95 under 200 ms, zero lost batches.
import { randomBytes } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { DEFAULTS } from './run-journey.mjs';

const recordings = Number(process.argv[2] || 50);
const seconds = Number(process.argv[3] || 600);
const INTERVAL_MS = 5000;
const { api } = DEFAULTS;
// The seeded load-test project, kept apart from the demo shop's sessions.
const key = process.env.BL_LOAD_KEY || 'pk_load_test_local';
const project = 'load-test';
const origin = DEFAULTS.site;

const percentile = (values, p) => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] || 0;
};

const templateEvents = async () => {
  // Pick by raw rrweb events: min_events and the event sorts use the Activity
  // Log count, which is far smaller and stays 0 until the worker counts it.
  const list = await (await fetch(`${api}/api/v1/projects/demo-shop/sessions?limit=50`)).json();
  const template = list.sessions
    .filter(session => session.raw_event_count >= 100)
    .sort((a, b) => b.raw_event_count - a.raw_event_count)[0];
  if (!template) throw new Error('Record some sessions first (npm run seed:sessions).');
  const replay = await (await fetch(`${api}/api/v1/projects/demo-shop/sessions/${template.id}/replay`)).json();
  return replay.events;
};

const main = async () => {
  const events = await templateEvents();
  // Batches of ~40 events, the size an active visitor produces in 5 seconds.
  const chunks = [];
  for (let index = 0; index < events.length; index += 40) chunks.push(events.slice(index, index + 40));
  console.log(`${recordings} recordings × ${seconds}s, a batch every ${INTERVAL_MS / 1000}s each, against ${api}`);

  const latencies = [];
  const failures = {};
  const sent = new Map();
  const deadline = Date.now() + seconds * 1000;

  const runRecording = async index => {
    const sessionId = randomBytes(18).toString('hex');
    let seq = 0;
    // Spread start times so batches do not all arrive in lockstep.
    await new Promise(resolve => { setTimeout(resolve, (index / recordings) * INTERVAL_MS); });
    while (Date.now() < deadline) {
      const batch = {
        seq,
        events: chunks[seq % chunks.length],
        meta: seq === 0 ? { url: `${origin}/load-test`, title: 'Load test', username: `load-${index}` } : undefined
      };
      const body = gzipSync(JSON.stringify(batch));
      const started = performance.now();
      let status = 0;
      try {
        const response = await fetch(`${api}/ingest/v1/sessions/${sessionId}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'X-BL-Project-Key': key,
            Origin: origin
          },
          body
        });
        status = response.status;
        await response.arrayBuffer();
      } catch (error) {
        status = 0;
      }
      latencies.push(performance.now() - started);
      if (status === 202) {
        sent.set(sessionId, (sent.get(sessionId) || 0) + batch.events.length);
      } else {
        failures[status] = (failures[status] || 0) + 1;
      }
      seq += 1;
      await new Promise(resolve => { setTimeout(resolve, INTERVAL_MS); });
    }
    await fetch(`${api}/ingest/v1/sessions/${sessionId}/end`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key })
    });
  };

  await Promise.all(Array.from({ length: recordings }, (_, index) => runRecording(index)));

  // Every accepted event must be stored: compare against the API's raw count
  // and the replay itself (event_count is the Activity Log count, not this).
  let lost = 0;
  for (const [sessionId, expected] of sent) {
    const replay = await (await fetch(`${api}/api/v1/projects/${project}/sessions/${sessionId}/replay`)).json();
    if (replay.raw_event_count !== expected || replay.events.length !== expected) lost += 1;
  }

  const p95 = percentile(latencies, 95);
  console.log(`batches: ${latencies.length}, failed: ${JSON.stringify(failures)}`);
  console.log(`latency ms  p50 ${percentile(latencies, 50).toFixed(1)}  p95 ${p95.toFixed(1)}  p99 ${percentile(latencies, 99).toFixed(1)}  max ${Math.max(...latencies).toFixed(1)}`);
  console.log(`sessions with missing events: ${lost} of ${sent.size}`);
  const ok = p95 < 200 && lost === 0 && Object.keys(failures).length === 0;
  console.log(ok ? 'PASS: p95 under 200 ms, nothing lost' : 'FAIL: see numbers above');
  process.exit(ok ? 0 : 1);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
