from sqlalchemy import Boolean,String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

class QuestionBank(Base):
    __tablename__ = "question_bank"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    interview_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(100), nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
