import json
import random
from pathlib import Path
from typing import Any


class QuestionSelector:
    def __init__(self, file_path: str = "sample_data/question_bank.json") -> None:
        self.file_path = Path(file_path)

    def load_questions(self) -> list[dict[str, Any]]:
        if not self.file_path.exists():
            raise FileNotFoundError(f"Question bank file not found: {self.file_path}")

        with self.file_path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            raise ValueError("Question bank must contain a list of questions")

        return data
    
    def select_questions(
        self,
        role: str,
        level: str,
        interview_type: str,
        total_questions: int,
    ) -> list[dict[str, Any]]:
        questions = self.load_questions()
        
        filtered_questions = [
            question
            for question in questions
            if question["role"] == role
            and question["level"] == level
            and question["interview_type"] == interview_type
        ]

        if len(filtered_questions) < total_questions:
            raise ValueError(f"Not enough questions found for the given criteria. Requested: {total_questions}, Available: {len(filtered_questions)}")

        random.shuffle(filtered_questions)
        return filtered_questions[:total_questions]
