import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question_bank import QuestionBank


class QuestionSelector:
    async def select_questions(
        self,
        db: AsyncSession,
        role: str,
        level: str,
        interview_type: str,
        total_questions: int,
    ) -> list[dict]:
        if interview_type == "hr":
            return await self._select_hr(db, total_questions)
        if interview_type == "mixed":
            return await self._select_mixed(db, role, level, total_questions)
        return await self._select_technical(db, role, level, interview_type, total_questions)

    async def _select_technical(
        self, db: AsyncSession, role: str, level: str,
        interview_type: str, total_questions: int,
    ) -> list[dict]:
        result = await db.execute(
            select(QuestionBank).where(
                QuestionBank.role == role,
                QuestionBank.level == level,
                QuestionBank.interview_type == interview_type,
                QuestionBank.is_active == True,
            )
        )
        questions = result.scalars().all()

        if len(questions) < total_questions:
            raise ValueError(
                f"Not enough questions. Requested: {total_questions}, Available: {len(questions)}"
            )

        return self._to_dict(random.sample(questions, total_questions))

    async def _select_hr(self, db: AsyncSession, total_questions: int) -> list[dict]:
        result = await db.execute(
            select(QuestionBank).where(
                QuestionBank.interview_type == "hr",
                QuestionBank.is_active == True,
            )
        )
        questions = result.scalars().all()

        if len(questions) < total_questions:
            raise ValueError(
                f"Not enough HR questions. Available: {len(questions)}"
            )

        return self._to_dict(random.sample(questions, total_questions))

    async def _select_mixed(
        self, db: AsyncSession, role: str, level: str, total_questions: int,
    ) -> list[dict]:
        tech_result = await db.execute(
            select(QuestionBank).where(
                QuestionBank.role == role,
                QuestionBank.level == level,
                QuestionBank.interview_type == "technical",
                QuestionBank.is_active == True,
            )
        )
        technical = tech_result.scalars().all()

        hr_result = await db.execute(
            select(QuestionBank).where(
                QuestionBank.interview_type == "hr",
                QuestionBank.is_active == True,
            )
        )
        hr = hr_result.scalars().all()

        hr_count = max(1, total_questions // 3)
        tech_count = total_questions - hr_count

        if len(technical) < tech_count or len(hr) < hr_count:
            raise ValueError(
                f"Not enough questions for mixed. "
                f"Technical: {len(technical)}/{tech_count}, HR: {len(hr)}/{hr_count}"
            )

        selected = random.sample(technical, tech_count) + random.sample(hr, hr_count)
        random.shuffle(selected)
        return self._to_dict(selected)

    @staticmethod
    def _to_dict(questions: list) -> list[dict]:
        return [
            {"topic": q.topic, "difficulty": q.difficulty, "question": q.text}
            for q in questions
        ]
