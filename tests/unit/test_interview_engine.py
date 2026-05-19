"""InterviewEngine service tests."""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.answer import Answer
from app.models.feedback import Feedback
from app.models.question import Question
from app.models.session import InterviewSession
from app.schemas.session import SessionCreateSchema
from app.services.interview_engine import InterviewEngine
from tests.conftest import MOCK_EVALUATION
from tests.factories import make_question_bank_entry


class StubSelector:
    def __init__(self, count: int = 2):
        self._count = count

    async def select_questions(self, **kwargs):
        total = kwargs.get("total_questions", self._count)
        return [
            {"topic": "python", "difficulty": 2, "question": f"Question {i}?"}
            for i in range(total)
        ]


@pytest.mark.asyncio
class TestInterviewEngine:
    async def test_create_session(self, db_session: AsyncSession, registered_user, mock_evaluator):
        engine = InterviewEngine(question_selector=StubSelector())
        data = SessionCreateSchema(
            role="backend",
            level="junior",
            interview_type="technical",
            total_questions=2,
        )
        session = await engine.create_session(
            db=db_session,
            session_data=data,
            user_id=registered_user.id,
        )
        assert session.id is not None
        assert session.status == "active"
        assert session.total_questions == 2

        questions = (
            await db_session.execute(
                select(Question).where(Question.session_id == session.id)
            )
        ).scalars().all()
        assert len(questions) == 2

    async def test_submit_answer_and_complete_session(
        self, db_session: AsyncSession, registered_user, mock_evaluator
    ):
        engine = InterviewEngine(question_selector=StubSelector())
        session = await engine.create_session(
            db=db_session,
            session_data=SessionCreateSchema(
                role="backend",
                level="junior",
                interview_type="technical",
                total_questions=2,
            ),
            user_id=registered_user.id,
        )
        q1 = (
            await db_session.execute(
                select(Question).where(Question.session_id == session.id).order_by(Question.order_index)
            )
        ).scalars().first()

        answer, feedback, updated = await engine.submit_answer(
            db=db_session,
            session_id=session.id,
            question_id=q1.id,
            answer_text="The GIL is a mutex in CPython.",
        )
        assert answer.id is not None
        assert feedback.score == MOCK_EVALUATION["score"]
        assert updated.current_question_index == 1
        assert updated.status == "active"

        q2 = (
            await db_session.execute(
                select(Question)
                .where(Question.session_id == session.id, Question.id != q1.id)
            )
        ).scalars().first()
        await engine.submit_answer(
            db=db_session,
            session_id=session.id,
            question_id=q2.id,
            answer_text="An index speeds up lookups.",
        )
        completed = await db_session.get(InterviewSession, session.id)
        assert completed.status == "completed"
        assert completed.final_score is not None

    async def test_submit_duplicate_answer_raises(
        self, db_session: AsyncSession, registered_user, mock_evaluator
    ):
        engine = InterviewEngine(question_selector=StubSelector(count=1))
        session = await engine.create_session(
            db=db_session,
            session_data=SessionCreateSchema(
                role="backend",
                level="junior",
                interview_type="technical",
                total_questions=1,
            ),
            user_id=registered_user.id,
        )
        q = (
            await db_session.execute(
                select(Question)
                .where(Question.session_id == session.id)
                .order_by(Question.order_index)
            )
        ).scalars().first()

        await engine.submit_answer(
            db=db_session,
            session_id=session.id,
            question_id=q.id,
            answer_text="First answer",
        )
        with pytest.raises(ValueError, match="Already answered"):
            await engine.submit_answer(
                db=db_session,
                session_id=session.id,
                question_id=q.id,
                answer_text="Second answer",
            )

    async def test_submit_wrong_question_raises(
        self, db_session: AsyncSession, registered_user, mock_evaluator
    ):
        engine = InterviewEngine(question_selector=StubSelector())
        session = await engine.create_session(
            db=db_session,
            session_data=SessionCreateSchema(
                role="backend",
                level="junior",
                interview_type="technical",
                total_questions=1,
            ),
            user_id=registered_user.id,
        )
        with pytest.raises(ValueError, match="Question not found"):
            await engine.submit_answer(
                db=db_session,
                session_id=session.id,
                question_id=99999,
                answer_text="orphan",
            )

    async def test_submit_unknown_session_raises(self, db_session: AsyncSession, mock_evaluator):
        engine = InterviewEngine()
        with pytest.raises(ValueError, match="Session not found"):
            await engine.submit_answer(
                db=db_session,
                session_id=99999,
                question_id=1,
                answer_text="text",
            )
