from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.logging import get_logger
from app.db import get_db
from app.models.session import InterviewSession
from app.schemas.answer import AnswerCreateSchema
from app.schemas.feedback import FeedbackRead
from app.services.interview_engine import InterviewEngine
from app.rate_limiter import rate_limit_answers


router = APIRouter(prefix="/api/sessions/{session_id}/answers", tags=["answers"])


logger = get_logger(__name__)


@router.post("/", status_code=201, dependencies=[Depends(rate_limit_answers)])
async def submit_answer(
    session_id: int,
    payload: AnswerCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    logger.info(
        "submit_answer_request",
        session_id=session_id,
        user_id=current_user.id,
        question_id=payload.question_id,
    )


    session_obj = await db.get(InterviewSession, session_id)

    if session_obj is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    engine = InterviewEngine()
    try:
        answer, feedback, session_obj = await engine.submit_answer(
            db=db,
            session_id=session_id,
            question_id=payload.question_id,
            answer_text=payload.text,
        )
    except ValueError as exc:
        logger.warning(
            "submit_answer_validation_failed",
            session_id=session_id,
            user_id=current_user.id,
            question_id=payload.question_id,
            error=str(exc),
        )


        raise HTTPException(status_code=400, detail=str(exc))

    logger.info(
        "submit_answer_success",
        session_id=session_id,
        user_id=current_user.id,
        question_id=payload.question_id,
        answer_id=answer.id,
        feedback_id=feedback.id,
        session_status=session_obj.status,
        current_question_index=session_obj.current_question_index,
    )


    return {
        "answer_id": answer.id,
        "feedback_id": feedback.id,
        "feedback": FeedbackRead.model_validate(feedback, from_attributes=True),
        "session_status": session_obj.status,
        "current_question_index": session_obj.current_question_index,
    }