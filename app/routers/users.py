from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, cast, Float, distinct
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from app.db import get_db
from app.auth.security import verify_password, hash_password
from app.schemas.user import ChangePasswordRequest
from app.models.feedback import Feedback
from app.models.question import Question
from app.models.session import InterviewSession
from app.schemas.user import MeResponse
from app.schemas.session import SessionRead
from app.auth.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role.value}


@router.put("/me/password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from current password")

    current_user.password = hash_password(body.new_password)
    db.commit()
    return {"ok": True}


@router.get("/me/sessions", response_model=list[SessionRead])
def get_my_sessions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id

    total_sessions = db.query(func.count(InterviewSession.id)).filter(
        InterviewSession.user_id == uid,
    ).scalar() or 0

    completed_sessions = db.query(func.count(InterviewSession.id)).filter(
        InterviewSession.user_id == uid,
        InterviewSession.status == "completed",
    ).scalar() or 0

    avg_score = db.query(cast(func.avg(Feedback.score), Float)).join(
        InterviewSession, Feedback.session_id == InterviewSession.id
    ).filter(
        InterviewSession.user_id == uid,
    ).scalar()
    role_stats_raw = (
        db.query(
            InterviewSession.role,
            func.count(InterviewSession.id).label("count"),
            cast(func.avg(InterviewSession.final_score), Float).label("avg_score"),
        )
        .filter(
            InterviewSession.user_id == uid,
            InterviewSession.status == "completed",
        )     
        .group_by(InterviewSession.role)
        .order_by(func.count(InterviewSession.id).desc())
        .all()
    )
    role_stats = [
        {
            "role": r.role,
            "count": r.count,
            "avg_score": round(r.avg_score, 1) if r.avg_score is not None else 0.0,
        }
        for r in role_stats_raw
    ]

    weak_topics_raw = (
        db.query(
            Question.topic,
            cast(func.avg(Feedback.score), Float).label("avg_score"),
            func.count(Feedback.id).label("count"),
        )
        .join(Feedback, Feedback.question_id == Question.id)
        .join(InterviewSession, InterviewSession.id == Feedback.session_id)
        .filter(InterviewSession.user_id == uid)
        .group_by(Question.topic)
        .having(func.count(Feedback.id) >= 2)
        .order_by("avg_score")
        .limit(5)
        .all()
    )
    weak_topics = [
        {
            "topic": t.topic,
            "avg_score": round(t.avg_score, 1),
            "count": t.count,
        }
        for t in weak_topics_raw
    ]

    since_30d = datetime.now(timezone.utc) - timedelta(days=30)
    activity_raw = (
        db.query(
            func.date(InterviewSession.started_at).label("day"),
            func.count(InterviewSession.id).label("count"),
        )
        .filter(
            InterviewSession.user_id == uid,
            InterviewSession.started_at >= since_30d,
        )
        .group_by(func.date(InterviewSession.started_at))
        .all()
    )
    activity = {str(r.day): r.count for r in activity_raw}

    achievements = _calc_achievements(
        db=db,
        user_id=uid,
        completed=completed_sessions,
    )

    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "avg_score": round(avg_score, 1) if avg_score is not None else 0.0,
        "role_stats": role_stats,
        "weak_topics": weak_topics,
        "activity": activity,
        "achievements": achievements,
    }


def _calc_achievements(db: Session, user_id: str, completed: int) -> list[dict]:
    since_week = datetime.now(timezone.utc) - timedelta(days=7)

    distinct_roles = db.query(
        func.count(distinct(InterviewSession.role))
    ).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.status == "completed",
    ).scalar() or 0

    weekly_count = db.query(func.count(InterviewSession.id)).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.status == "completed",
        InterviewSession.started_at >= since_week,
    ).scalar() or 0

    has_perfect = db.query(InterviewSession.id).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.final_score == 10,
        InterviewSession.status == "completed",
    ).first() is not None

    has_senior_ready = db.query(InterviewSession.id).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.level == "senior",
        InterviewSession.final_score >= 8,
        InterviewSession.status == "completed",
    ).first() is not None

    return [
        {
            "id": "first_blood",
            "title": "First Blood",
            "desc": "Complete your first interview",
            "unlocked": completed >= 1,
            "icon": "first_blood",
        },
        {
            "id": "on_a_roll",
            "title": "On a Roll",
            "desc": "Complete 5 interviews",
            "unlocked": completed >= 5,
            "icon": "on_a_roll",
        },
        {
            "id": "perfectionist",
            "title": "Perfectionist",
            "desc": "Score 10/10 in a session",
            "unlocked": has_perfect,
            "icon": "perfectionist",
        },
        {
            "id": "polyglot",
            "title": "Polyglot",
            "desc": "Complete interviews in 3+ different roles",
            "unlocked": distinct_roles >= 3,
            "icon": "polyglot",
        },
        {
            "id": "senior_ready",
            "title": "Senior Ready",
            "desc": "Score 8+ in a Senior interview",
            "unlocked": has_senior_ready,
            "icon": "senior_ready",
        },
        {
            "id": "consistent",
            "title": "Consistent",
            "desc": "Complete 3 interviews in one week",
            "unlocked": weekly_count >= 3,
            "icon": "consistent",
        },
    ]
