"""Test data helpers."""

from app.auth.models import User
from app.auth.security import hash_password
from app.models.question_bank import QuestionBank

VALID_PASSWORD = "TestPass1!"


def make_user(
    email: str = "user@example.com",
    password: str | None = VALID_PASSWORD,
    *,
    is_active: bool = True,
) -> User:
    return User(
        email=email,
        password=hash_password(password) if password else None,
        is_active=is_active,
    )


def make_question_bank_entry(
    *,
    role: str = "backend",
    level: str = "junior",
    interview_type: str = "technical",
    topic: str = "python",
    difficulty: int = 2,
    text: str = "What is a decorator?",
    is_active: bool = True,
) -> QuestionBank:
    return QuestionBank(
        role=role,
        level=level,
        interview_type=interview_type,
        topic=topic,
        difficulty=difficulty,
        text=text,
        is_active=is_active,
    )
