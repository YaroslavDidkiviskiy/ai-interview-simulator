from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, cast, Float, distinct, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone

from app.db import get_db
from app.auth.security import verify_password, hash_password
from app.rate_limiter import rate_limit_send_verification_code
from app.schemas.user import ChangePasswordRequest, SetPasswordRequest, VerifyCodeRequest, DeleteAccountRequest
from app.models.feedback import Feedback
from app.models.question import Question
from app.models.session import InterviewSession
from app.schemas.user import MeResponse
from app.schemas.session import SessionRead
from app.auth.dependencies import get_current_user, require_verified_email
from app.auth.models import User
from app.repositories.email_verification import EmailVerificationRepository, get_email_verification_repo, get_account_delete_verification_repo
from app.tasks.email_tasks import send_verification_email, send_delete_verification_email
from app.logging import get_logger


logger = get_logger(__name__)


router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value,
        "auth_provider": current_user.auth_provider.value,
        "has_password": current_user.password is not None,
        "email_verified": current_user.email_verified,
    }


@router.put("/me/password")
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_verified_email),
):
    if current_user.password is None:
        raise HTTPException(
            status_code=400,
            detail="OAuth account has no password. Use /api/users/me/set-password",
        )
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from current password")

    current_user.password = hash_password(body.new_password)
    await db.commit()
    return {"ok": True}


@router.post("/me/set-password")
async def set_password(
    body: SetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.password is not None:
        raise HTTPException(
            status_code=400,
            detail="Use /api/users/me/password to change existing password",
        )
    current_user.password = hash_password(body.password)
    await db.commit()
    return {"ok": True}


@router.post("/me/send-verification-code", dependencies=[Depends(rate_limit_send_verification_code)])
async def send_verification_code(
    current_user: User = Depends(get_current_user),
    repo: EmailVerificationRepository = Depends(get_email_verification_repo),
):
    if current_user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    if current_user.auth_provider.value != "local":
        raise HTTPException(status_code=400, detail="OAuth accounts are verified automatically")

    code = repo.generate_code()
    await repo.save_code(current_user.id, code)
    send_verification_email.delay(current_user.email, code)

    logger.info("verification_code_sent", user_id=current_user.id)
    return {"ok": True}


@router.post("/me/verify-email")
async def verify_email(
    body: VerifyCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    repo: EmailVerificationRepository = Depends(get_email_verification_repo),
):
    if current_user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    stored_code = await repo.get_code(current_user.id)

    if not stored_code:
        raise HTTPException(status_code=400, detail="Code expired or not found. Request a new one")

    if stored_code != body.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    current_user.email_verified = True
    await db.commit()
    await repo.delete_code(current_user.id)

    logger.info("email_verified", user_id=current_user.id)
    return {"ok": True}


@router.post("/me/send-delete-account-verification")
async def send_delete_verification_code(
    current_user: User = Depends(get_current_user),
    repo: EmailVerificationRepository = Depends(get_account_delete_verification_repo),
):
    code = repo.generate_code()
    await repo.save_code(current_user.id, code)
    send_delete_verification_email.delay(current_user.email, code)

    logger.info("delete_verification_code_sent", user_id=current_user.id)
    return {"ok": True}


@router.post("/me/delete-account")
async def delete_account(
    body: DeleteAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    repo: EmailVerificationRepository = Depends(get_account_delete_verification_repo),
):
    stored_code = await repo.get_code(current_user.id)
    if not stored_code:
        raise HTTPException(
            status_code=400,
            detail="Code expired or not found. Request a new one",
        )
    if stored_code != body.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    await repo.delete_code(current_user.id)
    await db.delete(current_user)
    await db.commit()

    logger.info("account_deleted", user_id=current_user.id)
    return {"ok": True}


@router.get("/me/sessions", response_model=list[SessionRead])
async def get_my_sessions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.started_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/me/stats")
async def get_my_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id

    total_result = await db.execute(
        select(func.count(InterviewSession.id)).where(InterviewSession.user_id == uid)
    )
    total_sessions = total_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count(InterviewSession.id)).where(
            InterviewSession.user_id == uid,
            InterviewSession.status == "completed",
        )
    )
    completed_sessions = completed_result.scalar() or 0

    avg_score_result = await db.execute(
        select(cast(func.avg(Feedback.score), Float))
        .join(InterviewSession, Feedback.session_id == InterviewSession.id)
        .where(InterviewSession.user_id == uid)
    )
    avg_score = avg_score_result.scalar()

    role_stats_result = await db.execute(
        select(
            InterviewSession.role,
            func.count(InterviewSession.id).label("count"),
            cast(func.avg(InterviewSession.final_score), Float).label("avg_score"),
        )
        .where(
            InterviewSession.user_id == uid,
            InterviewSession.status == "completed",
        )
        .group_by(InterviewSession.role)
        .order_by(func.count(InterviewSession.id).desc())
    )
    role_stats = [
        {
            "role": r.role,
            "count": r.count,
            "avg_score": round(r.avg_score, 1) if r.avg_score is not None else 0.0,
        }
        for r in role_stats_result.all()
    ]

    weak_topics_result = await db.execute(
        select(
            Question.topic,
            cast(func.avg(Feedback.score), Float).label("avg_score"),
            func.count(Feedback.id).label("count"),
        )
        .join(Feedback, Feedback.question_id == Question.id)
        .join(InterviewSession, InterviewSession.id == Feedback.session_id)
        .where(InterviewSession.user_id == uid)
        .group_by(Question.topic)
        .having(func.count(Feedback.id) >= 2)
        .order_by("avg_score")
        .limit(5)
    )
    weak_topics = [
        {
            "topic": t.topic,
            "avg_score": round(t.avg_score, 1),
            "count": t.count,
        }
        for t in weak_topics_result.all()
    ]

    since_30d = datetime.now(timezone.utc) - timedelta(days=30)
    activity_result = await db.execute(
        select(
            func.date(InterviewSession.started_at).label("day"),
            func.count(InterviewSession.id).label("count"),
        )
        .where(
            InterviewSession.user_id == uid,
            InterviewSession.started_at >= since_30d,
        )
        .group_by(func.date(InterviewSession.started_at))
    )
    activity = {str(r.day): r.count for r in activity_result.all()}

    achievements = await _calc_achievements(db=db, user_id=uid, completed=completed_sessions)

    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "avg_score": round(avg_score, 1) if avg_score is not None else 0.0,
        "role_stats": role_stats,
        "weak_topics": weak_topics,
        "activity": activity,
        "achievements": achievements,
    }


async def _calc_achievements(db: AsyncSession, user_id: str, completed: int) -> list[dict]:
    since_week = datetime.now(timezone.utc) - timedelta(days=7)

    distinct_result = await db.execute(
        select(func.count(distinct(InterviewSession.role))).where(
            InterviewSession.user_id == user_id,
            InterviewSession.status == "completed",
        )
    )
    distinct_roles = distinct_result.scalar() or 0

    weekly_result = await db.execute(
        select(func.count(InterviewSession.id)).where(
            InterviewSession.user_id == user_id,
            InterviewSession.status == "completed",
            InterviewSession.started_at >= since_week,
        )
    )
    weekly_count = weekly_result.scalar() or 0

    perfect_result = await db.execute(
        select(InterviewSession.id).where(
            InterviewSession.user_id == user_id,
            InterviewSession.final_score == 10,
            InterviewSession.status == "completed",
        ).limit(1)
    )
    has_perfect = perfect_result.scalar_one_or_none() is not None

    senior_result = await db.execute(
        select(InterviewSession.id).where(
            InterviewSession.user_id == user_id,
            InterviewSession.level == "senior",
            InterviewSession.final_score >= 8,
            InterviewSession.status == "completed",
        ).limit(1)
    )
    has_senior_ready = senior_result.scalar_one_or_none() is not None

    return [
        {"id": "first_blood", "title": "First Blood", "desc": "Complete your first interview", "unlocked": completed >= 1, "icon": "first_blood"},
        {"id": "on_a_roll", "title": "On a Roll", "desc": "Complete 5 interviews", "unlocked": completed >= 5, "icon": "on_a_roll"},
        {"id": "perfectionist", "title": "Perfectionist", "desc": "Score 10/10 in a session", "unlocked": has_perfect, "icon": "perfectionist"},
        {"id": "polyglot", "title": "Polyglot", "desc": "Complete interviews in 3+ different roles", "unlocked": distinct_roles >= 3, "icon": "polyglot"},
        {"id": "senior_ready", "title": "Senior Ready", "desc": "Score 8+ in a Senior interview", "unlocked": has_senior_ready, "icon": "senior_ready"},
        {"id": "consistent", "title": "Consistent", "desc": "Complete 3 interviews in one week", "unlocked": weekly_count >= 3, "icon": "consistent"},
    ]
