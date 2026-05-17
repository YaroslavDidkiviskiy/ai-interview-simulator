from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.db import get_db
from app.models.answer import Answer
from app.models.feedback import Feedback
from app.models.session import InterviewSession
from app.schemas.feedback import FeedbackRead
from app.schemas.session import QuestionRead, SessionCreateSchema, SessionDetailRead, SessionRead
from app.services.interview_engine import InterviewEngine

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/", response_model=SessionRead, status_code=201)
async def create_session(
    session_data: SessionCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    engine = InterviewEngine()
    try:
        created = await engine.create_session(db=db, session_data=session_data, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return created


@router.get("/{session_id}", response_model=SessionDetailRead)
async def session_detail(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InterviewSession)
        .options(selectinload(InterviewSession.questions))
        .where(InterviewSession.id == session_id)
    )
    session_obj = result.scalar_one_or_none()

    if session_obj is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    ordered_questions = sorted(session_obj.questions, key=lambda q: q.order_index)

    answered_result = await db.execute(
        select(Answer.question_id).where(Answer.session_id == session_id)
    )
    answered_ids = list(answered_result.scalars().all())

    current_question = None
    if 0 <= session_obj.current_question_index < len(ordered_questions):
        current_question = ordered_questions[session_obj.current_question_index]

    questions_read = [QuestionRead.model_validate(q, from_attributes=True) for q in ordered_questions]
    current_q_read = QuestionRead.model_validate(current_question, from_attributes=True) if current_question else None

    return SessionDetailRead(
        **{col.name: getattr(session_obj, col.name) for col in InterviewSession.__table__.columns},
        questions=questions_read,
        current_question=current_q_read,
        answered_question_ids=answered_ids,
    )


@router.get("/{session_id}/questions/{question_id}/feedback")
async def get_question_feedback(
    session_id: int,
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_obj = await db.get(InterviewSession, session_id)
    if session_obj is None:
        raise HTTPException(404, "Session not found")
    if session_obj.user_id != current_user.id:
        raise HTTPException(403, "Access denied")

    answer_result = await db.execute(
        select(Answer).where(
            Answer.session_id == session_id,
            Answer.question_id == question_id,
        )
    )
    answer = answer_result.scalar_one_or_none()
    if not answer:
        raise HTTPException(404, "Answer not found")

    feedback_result = await db.execute(
        select(Feedback).where(Feedback.answer_id == answer.id)
    )
    feedback = feedback_result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(404, "Feedback not found")

    return {
        "question_id": question_id,
        "answer_text": answer.text,
        "feedback": FeedbackRead.model_validate(feedback, from_attributes=True),
    }