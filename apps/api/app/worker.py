from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "behaviorlens",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)
celery_app.conf.update(
    task_default_queue="default",
    # Agent runs (Phase 4) get their own queue so long browser jobs never block
    # session processing.
    task_routes={"app.tasks.agent.*": {"queue": "agent"}},
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "close-idle-sessions": {"task": "app.tasks.close_idle_sessions", "schedule": 60.0},
        "refresh-activity-counts": {
            "task": "app.tasks.refresh_activity_counts",
            "schedule": 30.0,
        },
        "apply-retention": {
            "task": "app.tasks.apply_retention",
            "schedule": crontab(hour=3, minute=0),
        },
    },
)


@celery_app.task(name="app.tasks.ping")
def ping() -> str:
    return "pong"
