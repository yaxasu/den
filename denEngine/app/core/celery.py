from celery import Celery
from app.core.config import settings

celery = Celery(
    "denengine",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.conf.task_routes = {
    "app.tasks.recs.*": {"queue": "recs"},
}

celery.autodiscover_tasks(["app.tasks"])
