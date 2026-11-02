from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app import db
from app.config import get_settings


@pytest.fixture
def client_for(monkeypatch: pytest.MonkeyPatch) -> Iterator:
    """Builds a test client against a given database URL."""

    def build(database_url: str) -> TestClient:
        monkeypatch.setenv("BL_DATABASE_URL", database_url)
        get_settings.cache_clear()
        db.get_engine.cache_clear()
        db.get_sessionmaker.cache_clear()
        from app.main import create_app

        return TestClient(create_app())

    yield build
    get_settings.cache_clear()
    db.get_engine.cache_clear()
    db.get_sessionmaker.cache_clear()


@pytest.mark.parametrize("path", ["/health", "/api/v1/health"])
def test_health_is_ok_when_database_answers(client_for, path: str) -> None:
    client = client_for("sqlite+pysqlite:///:memory:")
    response = client.get(path)
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok", "environment": "development"}


def test_health_reports_unreachable_database(client_for) -> None:
    client = client_for("postgresql+psycopg://nobody:nothing@127.0.0.1:1/missing?connect_timeout=1")
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "degraded"
    assert response.json()["database"] == "unreachable"
