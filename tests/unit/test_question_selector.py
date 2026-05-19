"""QuestionSelector service tests."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.question_selector import QuestionSelector
from tests.factories import make_question_bank_entry


@pytest.mark.asyncio
class TestQuestionSelector:
    async def test_select_technical_questions(self, db_session: AsyncSession):
        for i in range(3):
            db_session.add(
                make_question_bank_entry(
                    interview_type="technical",
                    text=f"Q{i}?",
                )
            )
        await db_session.commit()

        selector = QuestionSelector()
        result = await selector.select_questions(
            db=db_session,
            role="backend",
            level="junior",
            interview_type="technical",
            total_questions=2,
        )
        assert len(result) == 2
        assert all("topic" in q and "question" in q for q in result)

    async def test_not_enough_technical_questions_raises(self, db_session: AsyncSession):
        db_session.add(make_question_bank_entry())
        await db_session.commit()

        selector = QuestionSelector()
        with pytest.raises(ValueError, match="Not enough questions"):
            await selector.select_questions(
                db=db_session,
                role="backend",
                level="junior",
                interview_type="technical",
                total_questions=5,
            )

    async def test_select_hr_questions(self, db_session: AsyncSession):
        for i in range(2):
            db_session.add(
                make_question_bank_entry(
                    interview_type="hr",
                    role="any",
                    text=f"HR {i}?",
                )
            )
        await db_session.commit()

        selector = QuestionSelector()
        result = await selector.select_questions(
            db=db_session,
            role="backend",
            level="junior",
            interview_type="hr",
            total_questions=2,
        )
        assert len(result) == 2

    async def test_select_mixed_questions(self, db_session: AsyncSession):
        for i in range(4):
            db_session.add(
                make_question_bank_entry(
                    interview_type="technical",
                    text=f"Tech {i}?",
                )
            )
        for i in range(2):
            db_session.add(
                make_question_bank_entry(
                    interview_type="hr",
                    text=f"HR {i}?",
                )
            )
        await db_session.commit()

        selector = QuestionSelector()
        result = await selector.select_questions(
            db=db_session,
            role="backend",
            level="junior",
            interview_type="mixed",
            total_questions=3,
        )
        assert len(result) == 3

    async def test_to_dict_format(self):
        class FakeQ:
            topic = "sql"
            difficulty = 3
            text = "Explain indexes?"

        result = QuestionSelector._to_dict([FakeQ()])
        assert result == [{"topic": "sql", "difficulty": 3, "question": "Explain indexes?"}]
