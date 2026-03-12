FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "[ -z \"$(ls alembic/versions/*.py 2>/dev/null)\" ] && alembic revision --autogenerate -m 'initial'; alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
