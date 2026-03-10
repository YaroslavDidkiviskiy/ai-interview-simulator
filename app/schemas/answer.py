"""Answer schemas."""

from pydantic import BaseModel


class AnswerBase(BaseModel):
    content: str


class AnswerCreate(AnswerBase):
    question_id: int


class AnswerRead(AnswerBase):
    id: int
    question_id: int

    class Config:
        orm_mode = True

