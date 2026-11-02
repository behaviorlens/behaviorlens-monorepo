# BehaviorLens dashboard (`apps/web`)

React 18 + Vite dashboard for reviewing recorded sessions: session list and
charts, Session Replay, Page Insights (click maps, scroll maps, inspect),
Session Notes, Mentions & Notes, Saved Filters and the AI Summary card.

## Layout

| Path | What it is |
| --- | --- |
| `src/components/BehaviorLensDashboard` | Dashboard pages and components |
| `src/ui` | UI kit adapter over Mantine, with lucide-react icons |
| `src/services/BehaviorLensService.js` | The one HTTP client for the API |
| `src/api` | Typed API client generated from the backend's OpenAPI spec |

## How to run

From the repository root:

```bash
npm run dev:web
```

Open http://localhost:5173/app. The dev server proxies `/api` to
`VITE_API_ORIGIN` (default `http://localhost:8000`).
