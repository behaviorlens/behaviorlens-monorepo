# Demo shop (`apps/demo-site`)

"Harbor & Pine" is a small, deterministic shop used as the target site for
recordings, task evaluation, persona runs and tests. It loads the BehaviorLens
recorder snippet and records every visit. It has switchable usability defects (`?defect=hidden-checkout`,
`?defect=silent-search`), off by default.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Page shell with the recorder snippet |
| `src/pages` | Home, catalog, product, cart, checkout and confirmation pages |
| `src/catalog.js` | Fixed product catalog |
| `src/defects.js` | Planted defects and the `?defect=` switch |
| `.env.development` | API URL and the demo project's public ingest key |

## How to run

From the repository root:

```bash
npm run dev:demo
```

Open http://localhost:5174. Recording needs the API running (`docker compose up`).
