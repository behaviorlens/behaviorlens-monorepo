# BehaviorLens agent guide

## Project and scope

BehaviorLens is a UX research and session-replay platform for the CS491/CS492
senior design project. It records website visits, replays them, and supports
behavioral analysis; task evaluation, persona testing, and UX recommendations
are part of the broader project, not a promise that every endpoint exists.

- Apply this guide across the monorepo; follow verified imports before crossing packages.
- Keep changes scoped to the requested behavior and preserve unrelated work.
- Read the relevant package README and implementation before assuming a feature exists.

## Repository layout

- `apps/web`: React 18 + Vite dashboard; styled-components, Mantine 8 adapters,
  lucide-react icons, Highcharts, and rrweb-player.
- `apps/api`: Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Pydantic v2,
  Celery + Redis, and boto3 for SeaweedFS S3; persistent metadata uses Postgres 16.
- `apps/demo-site`: Harbor & Pine shop with deterministic products and optional defects.
- `packages/recorder`: shared rrweb core, human/agent loaders, HTTP/bridge transports.
- `scripts`: session seeding, ingest load testing, API generation, and content scanning.
- `tests/e2e`: Playwright tests against the full running stack.
- `infra`: shared Docker build support; `docker-compose.yml` defines local services.
- `.github/workflows/ci.yml`: validation jobs; inspect it before changing check commands.

## Run locally

- Run commands from the repository root unless a different directory is stated.
- Use Docker Desktop with WSL 2 on Windows, Node.js 20+, and Python 3.12.
- Start the full stack with `docker compose up --build`.
- The API reloads application code automatically; the worker does not. After changing
  Python settings or task code, run `docker compose restart worker`.
- Compose's `recorder` service watches source changes and rebuilds `packages/recorder/dist`
  automatically while running.
- Dashboard: http://localhost:5173/app.
- API health: http://localhost:8000/health; interactive API docs: http://localhost:8000/docs.
- Demo shop: http://localhost:5174; SeaweedFS S3 gateway: http://localhost:8333.
- Postgres and Redis expose local ports 5432 and 6379 respectively.
- For host-side JavaScript work, install locked dependencies with `npm ci`.
- Run the dashboard with `npm run dev:web`; run the shop with `npm run dev:demo`.
- Keep the API running for recording and dashboard data; front-end dev servers alone
  do not start the backend. Avoid running host dev servers on occupied Compose ports.
- The dashboard proxies API calls to `VITE_API_ORIGIN`, defaulting to http://localhost:8000.
- Install the seeding browser with `npx playwright install chromium`, then run
  `npm run seed:sessions` against the running stack to create scripted visits.
- Dashboard project selection uses `VITE_PROJECT`, defaulting to `demo-shop`.

## Check a change

- Choose checks for the changed parts; run cross-part checks when changing shared behavior.
- Web: `npm run lint --workspace apps/web` runs ESLint and TypeScript checking.
- Web tests: `npm test --workspace apps/web` runs Vitest.
- Recorder tests: `npm test --workspace packages/recorder` runs Vitest.
- Recorder build: `npm run build --workspace packages/recorder` builds both loaders.
- There is no recorder lint script; do not invent a lint command for that workspace.
- Demo build: `npm run build --workspace apps/demo-site`; it has no lint or unit-test script.
- All JavaScript unit tests: `npm test --workspaces --if-present`.
- All workspace builds: `npm run build`.
- In `apps/api`, use an activated Python 3.12 environment and install development
  dependencies with `pip install -e ".[dev]"`.
- In `apps/api`, run `pytest`, `ruff check .`, `ruff format --check .`, and `pyright`.
- For database changes, in `apps/api` with Postgres available, run
  `alembic upgrade head` and `alembic check`; seed locally with `python -m app.seed`.
- Run `npm run generate:api` after API schema changes; review the generated diff.
- Run `npm run test:e2e` with the full stack and Playwright Chromium available.
- Run `npm run scan` before handing off; it rejects forbidden vendor references and
  public IPv4 addresses. Passing it is not a substitute for reviewing sensitive data.
- For dashboard behavior changes, check the affected page in a browser as well as tests.
- Report checks actually run, failures, and any checks skipped because dependencies or
  services are unavailable; never describe an unrun check as passing.

## CI coverage

- `scan` runs the forbidden-content scanner.
- `web` installs with `npm ci`, lints the web workspace, tests all workspaces that
  have tests, and builds all workspaces. Its scope includes the demo and recorder.
- `api` installs Python development dependencies, runs Ruff lint/format checks,
  Pyright and pytest, then applies/checks migrations and seeds an empty Postgres database.
- `api-contract` regenerates the API schema and rejects diffs in
  `apps/api/openapi.json` and `apps/web/src/api/schema.d.ts`.
- `e2e` starts Compose, waits for the API, recorder bundle and both front ends,
  runs Playwright, then runs `npm run load:ingest -- 20 30`.

## Dashboard rules

- Route all dashboard HTTP through `apps/web/src/services/BehaviorLensService.js`.
  Keep endpoint construction and response handling out of pages.
- Use controls from `apps/web/src/ui` and icons through its adapters; pages must not
  import `@mantine/*` or `lucide-react` directly. Extend an adapter when necessary.
- Preserve the adapters' `bl-*` style hooks and reuse existing styled components.
- Use only GET, POST, PUT and DELETE for application API operations.
- Review endpoints for saved views, notes, tags/metadata, reviews, insights and users
  are planned for Phase 2 and currently fail; AI summary and entered-state helpers
  also lack backend routes. Do not mistake a service helper for an implemented API.
- Isolate optional API failures: they must never hide the session list or replay.
  Preserve explicit loading, empty, error and oversized-replay states.
- Keep named routes ahead of the session-ID route and retain the shared Saved Filters
  provider across list navigation; session detail does not use the list shell.
- Keep list filters in the URL via `useSessionListSearchParams.js`; preserve `returnTo`
  when opening a session. Keep layout preferences out of the query string.
- Keep dashboard metrics and pagination based on the same complete filtered catalog,
  not just the visible page or an independently fetched statistics result.
- Read browser storage through `apps/web/src/lib/storage.js`; tolerate blocked storage.
- Tie player cleanup and resize observation to the actual player mount node, since
  workspace mode changes can replace the replay stage without unmounting the page.
- Preserve embedded playback behavior when changing the full-page workspace.
- Keep Page Insights scoped to this recording and selected page view; do not invent
  aggregate user counts, percentages, geolocation or console/network telemetry.
- Keep AI summary generation an explicit action, separate from replay loading.

## Dashboard file map

The following filenames are relative to `apps/web/src/components/BehaviorLensDashboard`.

- Routing and shell: `Main.js`, `BehaviorLensShell.js`.
- Session list: `SessionListPage.js`, `SessionListRow.js`.
- Filters and catalog: `useSessionListSearchParams.js`, `behaviorLensSessionFilters.js`,
  `behaviorLensSessionListCatalog.js`.
- Dashboard charts: `DashboardPage.js`; saved filters: `SavedFiltersNavigation.js`,
  `behaviorLensSavedViews.js`, `useBehaviorLensSavedViews.js`.
- Session workspace: `SessionDetailPage.js`, `useWorkspaceChrome.js`, `sessionDetailHooks.js`.
- Replay and transport: `SessionReplayPlayerStack.js`, `ReplayControlBar.js`,
  `useReplayTransport.js`; activity rail: `SessionEventRail.js`.
- Page Insights: `PageInsightsWorkspace.js`, `PageInsightsPlaybackStage.js`.
- Notes and inbox: `SessionNotesRail.js`, `SharedWithMePage.js`.
- AI summary: `SessionAiSummaryFeature.js`, `useSessionAiSummary.js`.
- Activity derivation: `behaviorLensEvents.js`; layout storage: `behaviorLensLayoutPreferences.js`.

## API and worker rules

- Add an Alembic migration under `apps/api/alembic/versions` for every model change
  in `apps/api/app/models.py`; keep schema and model definitions aligned.
- After any API schema change, regenerate with `npm run generate:api` and include
  the resulting schema changes. The generator uses `BL_PYTHON`, a local API virtual
  environment if available, or Python on PATH.
- Keep models portable: `apps/api/tests/conftest.py` uses in-memory SQLite and object
  storage; preserve dialect variants rather than introducing Postgres-only test failures.
- Keep metadata in Postgres and compressed recording chunks in object storage;
  `apps/api/app/storage.py` owns the storage abstraction.
- Put ingest behavior in `apps/api/app/ingest.py`, dashboard read endpoints in
  `apps/api/app/sessions_api.py`, and background processing in `apps/api/app/tasks.py`.

## Recorder rules

- Keep one core under `packages/recorder/src/core`; share it between loaders under
  `packages/recorder/src/loaders` and transports under `packages/recorder/src/transports`.
- Build output lives in `packages/recorder/dist`; the API serves the bundles at
  `/recorder/bl.js` and `/recorder/bl-agent.js` (and their source maps).
- Preserve human HTTP upload and agent bridge upload through `packages/recorder/node/attach.mjs`.
- Human and agent sessions must retain the same rrweb and `bl.interaction` event format.
- Always mask inputs for both loaders; preserve `maskAllInputs` and password masking
  in `packages/recorder/src/core/recorder.js`, plus the `bl-block` exclusion hook.
- Rebuild both loaders after core changes; do not patch generated bundles by hand.

## Demo shop rules

- Keep product data deterministic in `apps/demo-site/src/catalog.js`.
- Preserve stable, descriptive, hyphenated `data-testid` values for scripted interactions:
  `search-input`, `add-to-cart`, `checkout-button`, and `place-order` are existing examples.
- For repeated items, preserve ID-based patterns such as `product-link-${product.id}`
  and `cart-line-${product.id}`; update dependent scripts/tests if changing selectors.
- Defects in `apps/demo-site/src/defects.js` stay off by default; explicit `?defect=`
  enables them, persists them for the tab, and `?defect=none` clears them.

## Cross-part contracts

- Public session `event_count` means Activity Log activity, not raw rrweb event volume.
  Keep `apps/api/app/activity.py` aligned with `buildActivityInsights` in the dashboard's
  `behaviorLensEvents.js`; change both implementations and relevant tests together.
- The database's session `event_count` stores raw events; API responses expose it as
  `raw_event_count` and expose `activity_count` as public `event_count`.
- Keep idle timeouts equal: `session_idle_seconds` in `apps/api/app/config.py` is
  600 seconds; `SESSION_IDLE_MS` in `packages/recorder/src/core/session.js` is
  10 minutes in milliseconds. Update both sides together.
- Serialize session start times as ISO 8601 UTC with a trailing `Z`, as implemented
  in `apps/api/app/sessions_api.py`; never send ambiguous naive/local timestamps.

## Do not

- Do not manually edit `apps/web/src/api/schema.d.ts` or `apps/api/openapi.json`;
  regenerate them. `apps/web/src/api/client.ts` is handwritten code and may be edited.
- Do not commit secrets, real recordings, or real visitor data.
- Do not add PATCH endpoints or PATCH service calls.
- Do not change recorder capture as a side effect of dashboard-only review work.
