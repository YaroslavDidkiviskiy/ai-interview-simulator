from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user

from app.db import get_db
from app.schemas.answer import AnswerCreateSchema
from app.schemas.feedback import FeedbackRead
from app.services.interview_engine import InterviewEngine

router = APIRouter(prefix="/api/sessions/{session_id}/answers", tags=["answers"])


@router.post("/", status_code=201)
def submit_answer(
    session_id: int,
    payload: AnswerCreateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    engine = InterviewEngine()

    try:
        answer, feedback, session_obj = engine.submit_answer(
            db=db,
            session_id=session_id,
            question_id=payload.question_id,
            answer_text=payload.text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "answer_id": answer.id,
        "feedback_id": feedback.id,
        "feedback": FeedbackRead.model_validate(feedback, from_attributes=True),
        "session_status": session_obj.status,
        "current_question_index": session_obj.current_question_index,
    }