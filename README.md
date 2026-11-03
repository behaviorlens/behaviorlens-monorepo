# BehaviorLens

A web-based UX research and behavioral analytics platform: session replay,
click and scroll maps, evidence-based task evaluation, AI persona testing and
UX recommendations. CS491/CS492 senior design project.

## Repository layout

| Path | What it is |
| --- | --- |
| `frontend` | Dashboard (React 18, Vite, Mantine via `src/ui`) |
| `backend` | API and background worker (Python 3.12, FastAPI, SQLAlchemy, Alembic, Celery) |
| `recorder` | The recorder: rrweb capture with a snippet loader (humans) and an init-script loader (agents) |
| `examples/demo-site` | Demo shop with switchable usability defects, recorded through the snippet; a test site, not part of the product |
| `scripts` | Seeding sessions, load testing, API client generation, forbidden-content scan |
| `tests/e2e` | End-to-end tests against the running stack |
| `infra` | Shared Docker images |

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend (dashboard) | React 18, Vite, Mantine 8 (through `src/ui`), styled-components, lucide-react icons, Highcharts, rrweb-player, React Router |
| Backend (API and worker) | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, Celery, boto3 |
| Recorder | rrweb, bundled with Vite into a snippet (`bl.js`) and a Playwright init script (`bl-agent.js`) |
| Demo shop | React 18, Vite, React Router |
| Data | PostgreSQL 16 (metadata), Redis 7 (task queue and rate limits), SeaweedFS (S3-compatible store for recordings) |
| Testing | Vitest, Testing Library, pytest, Playwright (end-to-end, agent runs and seeding) |
| Tooling | npm workspaces, TypeScript (type checking), ESLint, Ruff, Pyright, openapi-typescript (typed API client) |
| Infrastructure | Docker Compose for local development, GitHub Actions for CI |

## How to run

Requirements: Docker Desktop (with WSL 2 on Windows), Node.js 20+, Python 3.12.

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| Dashboard | http://localhost:5173/app |
| API (docs at `/docs`) | http://localhost:8000/health |
| Demo shop (every visit is recorded) | http://localhost:5174 |
| S3-compatible store (SeaweedFS) | http://localhost:8333 |

Browse the demo shop: the visit appears in the dashboard
as active within a few seconds, and is closed and processed after 10 minutes
without activity (or at once if the site calls `BehaviorLens.stop()`). To fill
the dashboard with scripted visits (12 human, 3 agent runs):

```bash
npm install
npx playwright install chromium
npm run seed:sessions
```

## Recording your own site

### Visitors

Add this tag to every page, inside the `<head>`:

```html
<script async src="http://localhost:8000/recorder/bl.js"
  data-project-key="pk_demo_shop_local"
  data-api="http://localhost:8000"></script>
```

Every visit is recorded from the moment the script loads.

Optional calls: `BehaviorLens.identify(name)` names the visitor,
`BehaviorLens.setTask(id)` links the visit to a study task, and
`BehaviorLens.stop()` ends the session. Text typed into fields is always
masked; add the class `bl-block` to anything that must not be recorded at all.

### AI agent runs

Agents load the same recorder through a Playwright init script, and their
events reach the API through the runner process, so persona sessions look
exactly like human ones:

```js
import { attachRecorder } from '@behaviorlens/recorder/node';

const recording = await attachRecorder(context, {
  apiUrl: 'http://localhost:8000',
  projectKey: 'pk_demo_shop_local',
  runId: 'run-001',      // optional: links the session to a persona run
  taskId: 'checkout'     // optional
});
const page = await context.newPage();
// ... drive the page ...
await recording.stop(page); // flushes, ends the session, waits for uploads
```

### Project settings

The local stack seeds one project (`backend/app/seed.py`):

| Setting | Value |
| --- | --- |
| Project | Demo Shop (`demo-shop`) |
| Ingest key | `pk_demo_shop_local` |
| Allowed origins | `http://localhost:5174`, `http://127.0.0.1:5174` |
| Retention | 90 days |

The ingest key is public by design; recordings are accepted only from the
allowed origins, so to record another site, add its origin to the project's
`allowed_origins`. `GET /api/v1/projects/demo-shop` returns these settings and
the snippet.
