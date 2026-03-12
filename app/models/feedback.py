from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


if TYPE_CHECKING:
    from app.models.answer import Answer
    from app.models.question import Question
    from app.models.session import InterviewSession


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    answer_id: Mapped[int] = mapped_column(
        ForeignKey("answers.id", ondelete="CASCADE"),
        nullable=False,
    )

    score: Mapped[int] = mapped_column(Integer, nullable=False)
    clarity_score: Mapped[int] = mapped_column(Integer, nullable=False)
    correctness_score: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=False)

    feedback_text: Mapped[str] = mapped_column(Text, nullable=False)
    missing_points: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    better_answer: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    session: Mapped["InterviewSession"] = relationship(back_populates="feedback_items")
    question: Mapped["Question"] = relationship(back_populates="feedback_items")
    answer: Mapped["Answer"] = relationship(back_populates="feedback_items")
