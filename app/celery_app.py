from celery import Celery
from celery.schedules import crontab
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "prepario",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.email_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

celery_app.conf.beat_schedule = {
    'cleanup-unverified-users': {
        'task': 'cleanup_unverified_users',
        'schedule': crontab(hour=3, minute=0),
    },
}