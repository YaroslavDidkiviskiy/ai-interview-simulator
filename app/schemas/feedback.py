"""Feedback schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    question_id: int
    answer_id: int
    score: int
    clarity_score: int
    correctness_score: int
    confidence_score: int
    feedback_text: str
    missing_points: list[str]
    better_answer: list[str]
    created_at: datetime
