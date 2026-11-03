# BehaviorLens recorder (`recorder`)

Records website visits with rrweb and sends them to the BehaviorLens ingest API.
One shared core, two ways to load it, two ways to send events, so human and
agent sessions have the same format:

| Who | Loader | Transport |
| --- | --- | --- |
| Human visitors | Snippet `<script src=".../recorder/bl.js" data-project-key=...>` | HTTP to `/ingest/v1`, gzip, retries |
| AI agents | Playwright init script (`attachRecorder` from `./node`) | Bridge to the Node runner, which uploads |

Recording starts as soon as the loader runs. Inputs are always masked, and
every click, change and submit adds a
`bl.interaction` event describing the element (test id, role, name, selector).

## Layout

| Path | What it is |
| --- | --- |
| `src/core` | Recorder, batching, session identity, element descriptions |
| `src/transports` | HTTP and bridge transports |
| `src/loaders` | Snippet (`bl.js`) and agent (`bl-agent.js`) entry points |
| `node/attach.mjs` | `attachRecorder(context, options)` for Playwright agents |
| `tests` | Unit tests (vitest) |

## How to run

```bash
npm run build --workspace recorder   # writes dist/bl.js and dist/bl-agent.js
npm run dev --workspace recorder     # rebuilds on change (docker compose does this)
```

The API serves the built bundles at `/recorder/bl.js` and `/recorder/bl-agent.js`.
