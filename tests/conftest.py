"""Shared pytest fixtures."""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from fakeredis import aioredis as fakeredis_aioredis
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# Environment must be set before app modules read Settings / create engines.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only-32b")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("EVALUATOR_PROVIDER", "ollama")
os.environ.setdefault("GEMINI_API_KEY", "pytest-dummy-gemini-key")
os.environ.setdefault("DEBUG", "true")

from app.config import get_settings  # noqa: E402
from app.db import Base, get_db  # noqa: E402
from app.auth.models import RefreshToken, User  # noqa: E402
from app.models import (  # noqa: E402
    Answer,
    Feedback,
    InterviewSession,
    Question,
    QuestionBank,
)
from app.rate_limiter import (  # noqa: E402
    get_rate_limiter,
    rate_limit_answers,
    rate_limit_login,
    rate_limit_register,
)

get_settings.cache_clear()

MOCK_EVALUATION: dict[str, Any] = {
    "score": 8,
    "clarity_score": 8,
    "correctness_score": 7,
    "confidence_score": 8,
    "feedback_text": "Solid answer with room to improve.",
    "missing_points": ["edge cases"],
    "better_answer": ["mention trade-offs"],
}


class MockEvaluator:
    async def evaluate(self, **kwargs: Any) -> dict[str, Any]:
        return dict(MOCK_EVALUATION)


async def _noop_rate_limit() -> bool:
    return True


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(
        bind=db_engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def fake_redis():
    redis = fakeredis_aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()


@pytest.fixture
def mock_evaluator():
    with patch(
        "app.services.interview_engine.get_evaluator",
        return_value=MockEvaluator(),
    ):
        yield MockEvaluator()


@pytest_asyncio.fixture
async def registered_user(db_session: AsyncSession) -> User:
    from tests.factories import make_user

    user = make_user()
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(registered_user: User) -> dict[str, str]:
    from app.auth.security import create_access_token

    token = create_access_token({"sub": registered_user.id, "role": registered_user.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def seeded_questions(db_session: AsyncSession) -> list[QuestionBank]:
    from tests.factories import make_question_bank_entry

    entries = [
        make_question_bank_entry(
            role="backend",
            level="junior",
            interview_type="technical",
            topic="python",
            text=f"Technical question {i}?",
        )
        for i in range(5)
    ] + [
        make_question_bank_entry(
            role="backend",
            level="junior",
            interview_type="hr",
            topic="soft-skills",
            text=f"HR question {i}?",
        )
        for i in range(3)
    ]
    db_session.add_all(entries)
    await db_session.commit()
    for entry in entries:
        await db_session.refresh(entry)
    return entries


@pytest_asyncio.fixture
async def client(
    db_session: AsyncSession,
    fake_redis,
    mock_evaluator,
) -> AsyncGenerator[AsyncClient, None]:
    from app.main import app

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    def override_get_redis():
        return fake_redis

    @asynccontextmanager
    async def test_lifespan(_app):
        yield

    app.router.lifespan_context = test_lifespan
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[rate_limit_login] = _noop_rate_limit
    app.dependency_overrides[rate_limit_register] = _noop_rate_limit
    app.dependency_overrides[rate_limit_answers] = _noop_rate_limit

    get_rate_limiter.cache_clear()

    with patch("app.main.get_redis", override_get_redis), patch(
        "app.rate_limiter.get_redis", override_get_redis
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    app.dependency_overrides.clear()
    get_rate_limiter.cache_clear()
