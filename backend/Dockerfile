FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml ./
COPY app ./app
RUN pip install ".[dev]"

COPY alembic.ini ./
COPY alembic ./alembic
COPY tests ./tests

EXPOSE 8000

# Apply migrations and seed the demo project, then serve with auto-reload for development.
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app"]
