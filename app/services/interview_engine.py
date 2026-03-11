from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.session import InterviewSession
from app.schemas.session import SessionCreateSchema
from app.services.question_selector import QuestionSelector


class InterviewEngine:
    def __init__(self, question_selector: QuestionSelector | None = None) -> None:
        self.question_selector = question_selector or QuestionSelector()

    def create_session(self, db: Session, session_data: SessionCreateSchema) -> InterviewSession:
        selected_questions = self.question_selector.select_questions(
            role=session_data.role,
            level=session_data.level,
            interview_type=session_data.interview_type,
            total_questions=session_data.total_questions,
        )

        interview_session = InterviewSession(
            role=session_data.role,
            level=session_data.level,
            interview_type=session_data.interview_type,
            total_questions=session_data.total_questions,
            status="active",
            current_question_index=0,
        )

        db.add(interview_session)
        db.flush()

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
        db.commit()
        db.refresh(interview_session)

        return interview_session
