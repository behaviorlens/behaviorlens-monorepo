from collections.abc import Iterator
from dataclasses import dataclass, field

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import get_db
from app.models import Base, Organization, Project
from app.ratelimit import AllowAllRateLimiter, get_rate_limiter
from app.session_lifecycle import get_enqueue
from app.storage import MemoryObjectStore, get_object_store

PROJECT_KEY = "pk_test_project"
PROJECT_ORIGIN = "http://shop.test"


@dataclass
class Harness:
    client: TestClient
    make_session: sessionmaker[Session]
    store: MemoryObjectStore
    project_id: str
    enqueued: list[str] = field(default_factory=list)


@pytest.fixture
def harness(monkeypatch: pytest.MonkeyPatch) -> Iterator[Harness]:
    """An app on in-memory SQLite and object storage, with one project."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    make_session = sessionmaker(bind=engine, expire_on_commit=False)
    with make_session() as db:
        organization = Organization(name="Test", slug="test")
        db.add(organization)
        db.flush()
        project = Project(
            organization_id=organization.id,
            name="Shop",
            slug="shop",
            site_url=PROJECT_ORIGIN,
            ingest_key=PROJECT_KEY,
            allowed_origins=[PROJECT_ORIGIN],
        )
        db.add(project)
        db.commit()
        project_id = str(project.id)

    from app import tasks
    from app.main import create_app

    store = MemoryObjectStore()
    app = create_app()
    harness = Harness(
        client=TestClient(app), make_session=make_session, store=store, project_id=project_id
    )

    def override_db() -> Iterator[Session]:
        with make_session() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_object_store] = lambda: store
    app.dependency_overrides[get_rate_limiter] = AllowAllRateLimiter
    app.dependency_overrides[get_enqueue] = lambda: harness.enqueued.append
    # Background jobs reach the same database and store.
    monkeypatch.setattr(tasks, "get_sessionmaker", lambda: make_session)
    monkeypatch.setattr(tasks, "get_object_store", lambda: store)
    yield harness
    engine.dispose()
