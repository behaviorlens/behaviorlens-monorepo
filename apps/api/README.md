# BehaviorLens API (`apps/api`)

FastAPI service and Celery worker. It receives recordings from the recorder,
stores event chunks in S3-compatible storage and session details in Postgres,
closes idle sessions and computes their stats, and serves the session list,
stats and replays to the dashboard.

## Layout

| Path | What it is |
| --- | --- |
| `app/main.py` | FastAPI application, CORS for ingest, recorder bundle route |
| `app/ingest.py` | `POST /ingest/v1/sessions/{id}/events` and `/end` |
| `app/sessions_api.py` | `/api/v1/projects/{project}`: project, sessions, stats, replay |
| `app/models.py` | SQLAlchemy models (projects, sessions, chunks, stats) |
| `app/storage.py` | Object storage (S3 or in-memory) |
| `app/tasks.py`, `app/worker.py` | Celery jobs: close idle sessions, process sessions, retention |
| `app/seed.py` | Creates the demo and load-test projects |
| `alembic/` | Database migrations |
| `tests/` | pytest tests |

## How to run

With Docker, from the repository root: `docker compose up --build`. The API
serves http://localhost:8000 (interactive docs at `/docs`).

Without Docker:

```bash
cd apps/api
python -m venv .venv                 # Python 3.12
source .venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head                 # needs Postgres: docker compose up postgres
python -m app.seed
uvicorn app.main:app --reload
```
