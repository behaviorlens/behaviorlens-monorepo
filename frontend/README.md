# BehaviorLens dashboard (`frontend`)

React 18 + Vite dashboard for reviewing recorded sessions: session list and
charts, Session Replay, Page Insights (click maps, scroll maps, inspect),
Session Notes, Mentions & Notes, Saved Filters and the AI Summary card.

## Layout

| Path | What it is |
| --- | --- |
| `src/dashboard` | Dashboard routes and shell, with one folder per feature: `sessions`, `workspace`, `replay`, `page-insights`, `notes`, `saved-filters`, `ai-summary`, `review`, plus `shared` |
| `src/ui` | UI kit adapter over Mantine, lucide-react icons and generic controls |
| `src/services` | `BehaviorLensService.js` (the one HTTP client for the API), `httpClient.js` and the generated `schema.d.ts` |
| `src/contexts` | `UserContext` for the current reviewer |
| `src/lib` | General utilities (storage, message bus, prop defaults) |
| `src/styles` | Global styles (`base.css`, `app.css`) |

The dashboard is JavaScript and is not type-checked. `src/services/schema.d.ts` is
generated from the backend's OpenAPI spec (`npm run generate:api`) as a reference; nothing
imports it yet.

## How to run

From the repository root:

```bash
npm run dev:frontend
```

Open http://localhost:5173/app. The dev server proxies `/api` to
`VITE_API_ORIGIN` (default `http://localhost:8000`).
