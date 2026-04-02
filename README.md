# AI Interview Simulator

Веб-застосунок для підготовки до технічних співбесід. Задає питання, оцінює відповіді через локальну LLM і дає детальний фідбек.

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Alembic, JWT Auth  
**Frontend:** React, TypeScript, Tailwind CSS  
**AI:** Ollama (локальна LLM, llama3.2)  
**Infra:** Docker, Docker Compose

## Features

- Сесії співбесід з вибором ролі (Python Backend), рівня (Junior/Mid/Senior) і типу (Technical/HR/Mixed)
- AI-оцінка відповідей: загальний скор, clarity, correctness, confidence
- Детальний фідбек: що пропустив, як відповісти краще
- JWT аутентифікація з refresh token rotation
- Захищені ендпоінти — сесії прив'язані до конкретного юзера

## Project Structure

```
app/
├── auth/               # JWT аутентифікація
│   ├── models.py       # User, RefreshToken
│   ├── schemas.py      # Pydantic схеми
│   ├── security.py     # bcrypt, JWT
│   ├── dependencies.py # get_current_user, require_role
│   └── router.py       # /auth endpoints
├── models/             # Основні моделі БД
│   ├── session.py      # InterviewSession
│   ├── question.py     # Question
│   ├── answer.py       # Answer
│   └── feedback.py     # Feedback
├── routers/            # API ендпоінти
│   ├── sessions.py     # /api/sessions
│   └── answers.py      # /api/sessions/{id}/answers
├── schemas/            # Pydantic схеми
├── services/
│   ├── interview_engine.py       # Логіка сесії
│   ├── question_selector.py      # Вибір питань з банку
│   └── evaluators/
│       └── ollama.py             # Оцінка відповідей через LLM
├── db.py               # SQLAlchemy engine + session
├── config.py           # Налаштування через pydantic-settings
└── main.py             # FastAPI app
frontend/               # React + TypeScript
alembic/                # Міграції БД
sample_data/            # Банк питань (JSON)
```

## Auth Architecture

Авторизація побудована на двох токенах:

- **Access token** — JWT, живе 30 хвилин, передається в `Authorization: Bearer` header
- **Refresh token** — random string (не JWT), живе 7 днів, зберігається в БД і в `httpOnly` cookie

При кожному `/auth/refresh` відбувається **token rotation**: старий refresh відкликається, видається новий. Якщо хтось вкраде refresh token і спробує використати його після rotation — він вже буде revoked.

```
POST /auth/register   — реєстрація
POST /auth/login      — логін, повертає access token + refresh cookie
POST /auth/refresh    — оновлення access token
POST /auth/logout     — revoke refresh token
GET  /auth/me         — дані поточного юзера
```

## API

```
POST   /api/sessions              — створити сесію
GET    /api/sessions/{id}         — деталі сесії з питаннями
POST   /api/sessions/{id}/answers — відправити відповідь + отримати feedback
```

Всі `/api/*` ендпоінти потребують валідного JWT токена.

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Ollama

### Run

```bash
# Clone repo
git clone https://github.com/YaroslavDidkiviskiy/ai-interview-simulator
cd ai-interview-simulator

cp .env.example .env

docker compose up --build

docker compose exec app alembic upgrade head
```

App available on: `http://localhost:8000`.  
Swagger UI: `http://localhost:8000/docs`

### Ollama Setup



```

### Environment Variables

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ai_interview_simulator
SECRET_KEY=your-secret-key-here
ACCESS_EXPIRE_MIN=30
REFRESH_EXPIRE_DAYS=7
EVALUATOR_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --reload

# New migrations for models change
alembic revision --autogenerate -m "description"
alembic upgrade head
```
