#!/bin/sh
set -e

python -m http.server ${PORT:-8080} &

echo "Starting Celery beat..."
exec celery -A app.celery_app.celery_app beat --loglevel=info