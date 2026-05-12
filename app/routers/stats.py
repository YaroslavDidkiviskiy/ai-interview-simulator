from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.session import InterviewSession
from app.models.answer import Answer
from app.models.question_bank import QuestionBank

router = APIRouter(prefix="/api", tags=["stats"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "total_questions": db.query(QuestionBank).count(),
        "total_sessions":  db.query(InterviewSession).count(),
        "total_answers":   db.query(Answer).count(),
    }
