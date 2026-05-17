#!/bin/sh
set -e

if [ -z "$(ls alembic/versions/*.py 2>/dev/null)" ]; then
    echo "No migrations found, generating..."
    alembic revision --autogenerate -m "initial"
fi

echo "Running migrations..."
alembic upgrade head

echo "Seeding questions..."
python -m app.scripts.seed_questions

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000