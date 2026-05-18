#!/bin/sh
set -e

echo "Running migrations..."
alembic upgrade head

echo "Seeding questions..."
python -m app.scripts.seed_questions

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000