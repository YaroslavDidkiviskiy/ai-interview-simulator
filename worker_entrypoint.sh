#!/bin/sh
set -e

python -m http.server ${PORT:-8080} &
HTTP_PID=$!

celery -A app.celery_app.celery_app worker --loglevel=info

kill $HTTP_PID