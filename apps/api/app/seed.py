"""Create the demo organization and project if they do not exist yet.

Run with: python -m app.seed
"""

from sqlalchemy import select

from app.db import get_sessionmaker
from app.models import Organization, Project

DEMO_ORG_SLUG = "demo"
DEMO_PROJECT_SLUG = "demo-shop"
# Public ingest key the demo shop's snippet uses. Public by design (it sits in a
# script tag), so it is fine to commit.
DEMO_INGEST_KEY = "pk_demo_shop_local"
DEMO_ORIGINS = ["http://localhost:5174", "http://127.0.0.1:5174"]
# Separate project for `npm run load:ingest`, so load tests never fill the demo dashboard.
LOAD_TEST_SLUG = "load-test"
LOAD_TEST_KEY = "pk_load_test_local"


def seed() -> None:
    with get_sessionmaker()() as session:
        organization = session.scalar(
            select(Organization).where(Organization.slug == DEMO_ORG_SLUG)
        )
        if organization is None:
            organization = Organization(name="Demo Team", slug=DEMO_ORG_SLUG)
            session.add(organization)
            session.flush()

        project = session.scalar(
            select(Project).where(
                Project.organization_id == organization.id, Project.slug == DEMO_PROJECT_SLUG
            )
        )
        if project is None:
            project = Project(
                organization_id=organization.id,
                name="Demo Shop",
                slug=DEMO_PROJECT_SLUG,
                site_url="http://localhost:5174",
                ingest_key=DEMO_INGEST_KEY,
                allowed_origins=DEMO_ORIGINS,
            )
            session.add(project)
        else:
            project.ingest_key = DEMO_INGEST_KEY
            project.allowed_origins = DEMO_ORIGINS

        load_test = session.scalar(
            select(Project).where(
                Project.organization_id == organization.id, Project.slug == LOAD_TEST_SLUG
            )
        )
        if load_test is None:
            session.add(
                Project(
                    organization_id=organization.id,
                    name="Load Test",
                    slug=LOAD_TEST_SLUG,
                    site_url="http://localhost:5174",
                    ingest_key=LOAD_TEST_KEY,
                    allowed_origins=DEMO_ORIGINS,
                    retention_days=7,
                )
            )
        session.commit()


if __name__ == "__main__":
    seed()
    print("Seeded demo organization and project.")
