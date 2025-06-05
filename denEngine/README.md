poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 

<!-- docker run -d --name redis -p 6379:6379 redis  -->

docker compose up -d
docker compose down



poetry run celery -A celery_worker.celery worker --loglevel=info -Q recs