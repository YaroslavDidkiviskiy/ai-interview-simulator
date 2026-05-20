import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.db import AsyncSessionLocal
from app.models.question_bank import QuestionBank


async def seed():
    async with AsyncSessionLocal() as db:
        data = json.loads(Path("sample_data/question_bank.json").read_text())

        existing_result = await db.execute(select(QuestionBank.text, QuestionBank.role, QuestionBank.topic))
        existing_keys = {(row[0], row[1], row[2]) for row in existing_result.fetchall()}

        new_rows = [
            QuestionBank(
                role=q["role"],
                level=q["level"],
                interview_type=q["interview_type"],
                topic=q["topic"],
                difficulty=q["difficulty"],
                text=q["question"],
            )
            for q in data
            if (q["question"], q["role"], q["topic"]) not in existing_keys
        ]

        if not new_rows:
            print(f"No new questions found ({len(existing_keys)} already in DB), skipping.")
            return

        db.add_all(new_rows)
        await db.commit()
        print(f"Seeded {len(new_rows)} new questions ({len(existing_keys)} already existed).")


if __name__ == "__main__":
    asyncio.run(seed())