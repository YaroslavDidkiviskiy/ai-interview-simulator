from datetime import datetime

from pydantic import BaseModel, Field


class SessionCreateSchema(BaseModel):
    role: str = Field(..., min_length=1, max_length=100)
    level: str = Field(..., min_length=1, max_length=50)
    interview_type: str = Field(..., min_length=1, max_length=50)
    total_questions: int = Field(..., ge=1, le=50)


class QuestionRead(BaseModel):
    id: int
    topic: str
    difficulty: int
    text: str
    order_index: int

    model_config = {"from_attributes": True}


class SessionRead(BaseModel):
    id: int
    role: str
    level: str
    interview_type: str
    status: str | None
    current_question_index: int
    total_questions: int
    final_score: int | None
    summary: str | None
    started_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class SessionDetailRead(SessionRead):
    questions: list[QuestionRead] = []
    current_question: QuestionRead | None = None
