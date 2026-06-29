#!/bin/sh
# start_worker.sh
# Starts the Celery worker inside the `api` container.
# Run from: backend/
#
# Usage:
#   docker compose exec api sh /app/start_worker.sh
#
# Or use the docker compose command directly (see README below).

exec celery \
  -A app.workers.celery_app.celery_app \
  worker \
  --loglevel=INFO \
  --concurrency=2 \
  --queues=celery \
  --hostname=leadforge-worker@%h
