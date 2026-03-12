from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.question import Question
    from app.models.answer import Answer
    from app.models.feedback import Feedback


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    level: Mapped[str] = mapped_column(String(100), nullable=False)
    interview_type: Mapped[str] = mapped_column(String(100), nullable=False)
    
    status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    current_question_index: Mapped[int] = mapped_column(Integer, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    
    final_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    questions: Mapped[list["Question"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan"
    )
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan"
    )
    feedback_items: Mapped[list["Feedback"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan"
    )
