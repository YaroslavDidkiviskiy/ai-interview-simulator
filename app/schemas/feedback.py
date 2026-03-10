"""Feedback schemas."""

from pydantic import BaseModel


class FeedbackBase(BaseModel):
    comments: str
    score: int | None = None


class FeedbackCreate(FeedbackBase):
    answer_id: int


class FeedbackRead(FeedbackBase):
    id: int
    answer_id: int

    class Config:
        orm_mode = True

