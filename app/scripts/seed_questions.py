import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import select, func
from app.db import AsyncSessionLocal
from app.models.question_bank import QuestionBank


async def seed():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(QuestionBank))
        existing = result.scalar()
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
        await db.commit()
        print(f"Seeded {len(rows)} questions.")


if __name__ == "__main__":
    asyncio.run(seed())