from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.feedback import Feedback
from app.models.session import InterviewSession
from app.schemas.user import MeResponse
from app.schemas.session import SessionRead
from app.auth.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role.value}

@router.get("/me/sessions", response_model=list[SessionRead])
def get_my_sessions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * limit

    return (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.started_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.get("/me/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
    ).count()

    completed_sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    )

    avg_score = db.query(func.avg(Feedback.score)).join(
        InterviewSession, Feedback.session_id == InterviewSession.id
    ).filter(
        InterviewSession.user_id == current_user.id
    ).scalar()

    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "avg_score": round(float(avg_score), 1) if avg_score else None
    }
