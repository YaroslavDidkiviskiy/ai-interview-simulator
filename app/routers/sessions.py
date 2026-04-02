from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_user
from app.auth.models import User

from app.db import get_db
from app.models.session import InterviewSession
from app.schemas.session import QuestionRead, SessionCreateSchema, SessionDetailRead, SessionRead
from app.services.interview_engine import InterviewEngine

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/", response_model=SessionRead, status_code=201)
def create_session(
    session_data: SessionCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    engine = InterviewEngine()
    try:
        created = engine.create_session(db=db, session_data=session_data)
        created.user_id = current_user.id
        db.commit()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return created


@router.get("/{session_id}", response_model=SessionDetailRead)
def session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(InterviewSession)
        .options(selectinload(InterviewSession.questions))
        .where(InterviewSession.id == session_id)
    )
    session_obj = db.execute(stmt).scalar_one_or_none()

    if session_obj is None:
        raise HTTPException(status_code=404, detail="Session not found")

    ordered_questions = sorted(session_obj.questions, key=lambda q: q.order_index)

    current_question = None
    if 0 <= session_obj.current_question_index < len(ordered_questions):
        current_question = ordered_questions[session_obj.current_question_index]

    questions_read = [QuestionRead.model_validate(q, from_attributes=True) for q in ordered_questions]
    current_q_read = QuestionRead.model_validate(current_question, from_attributes=True) if current_question else None

    return SessionDetailRead(
        **{col.name: getattr(session_obj, col.name) for col in InterviewSession.__table__.columns},
        questions=questions_read,
        current_question=current_q_read,
    )
