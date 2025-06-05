from app.core.celery import celery

celery.autodiscover_tasks(["app.tasks"])
