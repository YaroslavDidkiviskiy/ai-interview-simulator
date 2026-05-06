import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.db import SessionLocal
from app.models.question_bank import QuestionBank

def seed():
    db = SessionLocal()
    try:
        existing = db.query(QuestionBank).count()
        if existing > 0:
            print(f"Already seeded ({existing} questions), skipping.")
            return

        data = json.loads(Path("sample_data/question_bank.json").read_text())
        rows = [
            QuestionBank(
                role=q["role"],
                level=q["level"],
                interview_type=q["interview_type"],
                topic=q["topic"],
                difficulty=q["difficulty"],
                text=q["question"],
            )
            for q in data
        ]
        db.add_all(rows)
        db.commit()
        print(f"Seeded {len(rows)} questions.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
