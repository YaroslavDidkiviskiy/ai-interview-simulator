from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.session import InterviewSession
from app.models.answer import Answer
from app.models.question_bank import QuestionBank

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    questions_result = await db.execute(select(func.count()).select_from(QuestionBank))
    sessions_result = await db.execute(select(func.count()).select_from(InterviewSession))
    answers_result = await db.execute(select(func.count()).select_from(Answer))

    return {
        "total_questions": questions_result.scalar(),
        "total_sessions":  sessions_result.scalar(),
        "total_answers":   answers_result.scalar(),
    }