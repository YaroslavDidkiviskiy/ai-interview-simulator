# AI Interview Simulator

A web application for preparing for technical interviews. Asks questions, evaluates answers via local LLM, and provides detailed feedback.

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Alembic, JWT Auth  
**Frontend:** React, TypeScript, Tailwind CSS  
**AI:** Ollama (локальна LLM, llama3.2)  
**Infra:** Docker, Docker Compose

## Features

- Interview sessions with choice of role (Python Backend), level (Junior/Mid/Senior) and type (Technical/HR/Mixed)
- AI-assessment of answers: overall score, clarity, correctness, confidence
- Detailed feedback: what did you miss, how to answer better
- JWT authentication with refresh token rotation
- Secure endpoints — sessions are tied to a specific user

## Project Structure

```
app/
├── auth/ # JWT authentication
│ ├── models.py # User, RefreshToken
│ ├── schemas.py # Pydantic schemas
│ ├── security.py # bcrypt, JWT
│ ├── dependencies.py # get_current_user, require_role
│ └── router.py # /auth endpoints
├── models/ # Basic DB models
│ ├── session.py # InterviewSession
│ ├── question.py # Question
│ ├── answer.py # Answer
│ └── feedback.py # Feedback
├── routers/ # API endpoints
│ ├── sessions.py # /api/sessions
│ └── answers.py # /api/sessions/{id}/answers
├── schemas/ # Pydantic schemas
├── services/
│ ├── interview_engine.py # Session logic
│ ├── question_selector.py # Question selection from the bank
│ └── evaluators/
│ └── ollama.py # Evaluation of answers via LLM
├── db.py # SQLAlchemy engine + session
├── config.py # Settings via pydantic-settings
└── main.py # FastAPI app
frontend/ # React + TypeScript
alembic/ # Database migrations
sample_data/ # Question bank (JSON)
```

## Auth Architecture

Authorization is based on two tokens:

- **Access token** — JWT, lives for 30 minutes, transmitted in `Authorization: Bearer` header

- **Refresh token** — random string (not JWT), lives for 7 days, stored in the database and in `httpOnly` cookie

With each `/auth/refresh`, **token rotation** occurs: the old refresh is revoked, a new one is issued. If someone steals the refresh token and tries to use it after rotation — it will already be revoked.

```
POST /auth/register — registration
POST /auth/login — login, returns access token + refresh cookie
POST /auth/refresh — update access token
POST /auth/logout — revoke refresh token
GET /auth/me — current user data
```

## API

```
POST /api/sessions — create session
GET /api/sessions/{id} — session details with questions
POST /api/sessions/{id}/answers — send answer + get feedback
```

All `/api/*` endpoints require a valid JWT token.

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
