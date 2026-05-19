"""Pydantic schema validation tests."""

import pytest
from pydantic import ValidationError

from app.schemas.answer import AnswerCreateSchema
from app.schemas.session import SessionCreateSchema


class TestSessionCreateSchema:
    def test_valid_session(self):
        s = SessionCreateSchema(
            role="backend",
            level="junior",
            interview_type="technical",
            total_questions=5,
        )
        assert s.total_questions == 5

    @pytest.mark.parametrize("total", [0, 51])
    def test_total_questions_out_of_range(self, total):
        with pytest.raises(ValidationError):
            SessionCreateSchema(
                role="backend",
                level="junior",
                interview_type="technical",
                total_questions=total,
            )

    def test_empty_role_rejected(self):
        with pytest.raises(ValidationError):
            SessionCreateSchema(
                role="",
                level="junior",
                interview_type="technical",
                total_questions=3,
            )


class TestAnswerCreateSchema:
    def test_valid_answer(self):
        a = AnswerCreateSchema(question_id=1, text="My detailed answer.")
        assert a.question_id == 1

    def test_empty_text_rejected(self):
        with pytest.raises(ValidationError):
            AnswerCreateSchema(question_id=1, text="")

    def test_text_too_long(self):
        with pytest.raises(ValidationError):
            AnswerCreateSchema(question_id=1, text="x" * 5001)
