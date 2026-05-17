from datetime import datetime, timezone

from sqlalchemy import func, cast, Float, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question
from app.models.session import InterviewSession
from app.models.answer import Answer
from app.models.feedback import Feedback
from app.schemas.session import SessionCreateSchema
from app.services.question_selector import QuestionSelector
from app.services.evaluators.factory import get_evaluator


class InterviewEngine:
    def __init__(self, question_selector: QuestionSelector | None = None) -> None:
        self.question_selector = question_selector or QuestionSelector()

    async def create_session(
        self,
        db: AsyncSession,
        session_data: SessionCreateSchema,
        user_id: str,
    ) -> InterviewSession:
        selected_questions = await self.question_selector.select_questions(
            db=db,
            role=session_data.role,
            level=session_data.level,
            interview_type=session_data.interview_type,
            total_questions=session_data.total_questions,
        )

        interview_session = InterviewSession(
            user_id=user_id,
            role=session_data.role,
            level=session_data.level,
            interview_type=session_data.interview_type,
            total_questions=session_data.total_questions,
            status="active",
            current_question_index=0,
        )

        db.add(interview_session)
        await db.flush()

        question_rows = [
            Question(
                session_id=interview_session.id,
                topic=question_data["topic"],
                difficulty=question_data["difficulty"],
                text=question_data["question"],
                order_index=index,
                generated_by_ai=False,
            )
            for index, question_data in enumerate(selected_questions)
        ]

        db.add_all(question_rows)
        await db.commit()
        await db.refresh(interview_session)
        return interview_session

    async def submit_answer(
        self,
        db: AsyncSession,
        session_id: int,
        question_id: int,
        answer_text: str,
    ) -> tuple[Answer, Feedback, InterviewSession]:
        session_obj = await db.get(InterviewSession, session_id)
        if session_obj is None:
            raise ValueError("Session not found")

        question = await db.get(Question, question_id)
        if question is None or question.session_id != session_id:
            raise ValueError("Question not found for this session")

        existing = await db.execute(
            select(Answer).where(
                Answer.session_id == session_id,
                Answer.question_id == question_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Already answered this question")

        answer = Answer(
            session_id=session_id,
            question_id=question_id,
            text=answer_text,
        )
        db.add(answer)
        await db.flush()

        evaluator = get_evaluator()
        evaluation = await evaluator.evaluate(
            question_text=question.text,
            answer_text=answer_text,
            topic=question.topic,
            difficulty=question.difficulty,
            level=session_obj.level,
            interview_type=session_obj.interview_type,
        )

        feedback = Feedback(
            session_id=session_id,
            question_id=question_id,
            answer_id=answer.id,
            score=evaluation["score"],
            clarity_score=evaluation["clarity_score"],
            correctness_score=evaluation["correctness_score"],
            confidence_score=evaluation["confidence_score"],
            feedback_text=evaluation["feedback_text"],
            missing_points=evaluation["missing_points"],
            better_answer=evaluation["better_answer"],
        )
        db.add(feedback)
        await db.flush()

        answered_count_result = await db.execute(
            select(func.count(Answer.id)).where(Answer.session_id == session_id)
        )
        answered_count = answered_count_result.scalar() or 0

        session_obj.current_question_index = answered_count

        if answered_count >= session_obj.total_questions:
            session_obj.status = "completed"
            session_obj.completed_at = datetime.now(timezone.utc)

            avg_result = await db.execute(
                select(cast(func.avg(Feedback.score), Float)).where(
                    Feedback.session_id == session_id
                )
            )
            avg = avg_result.scalar()
            session_obj.final_score = round(avg) if avg is not None else 0

        await db.commit()
        await db.refresh(answer)
        await db.refresh(feedback)
        await db.refresh(session_obj)

        return answer, feedback, session_obj