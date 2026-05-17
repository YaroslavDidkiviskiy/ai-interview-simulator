import json

from app.services.evaluators.base import BaseEvaluator
from app.services.evaluators.prompts import get_interview_type_guidance, get_level_guidance
from app.clients.llm.gemini_client import GeminiClient


class GeminiEvaluator(BaseEvaluator):
    def __init__(self, client: GeminiClient | None = None) -> None:
        self.client = client or GeminiClient()

    def build_prompt(
        self,
        question_text: str,
        answer_text: str,
        topic: str,
        difficulty: int,
        level: str,
        interview_type: str,
    ) -> str:
        level_guidance = get_level_guidance(level)
        interview_type_guidance = get_interview_type_guidance(interview_type)

        return f"""
            You are a software engineer interview evaluator.

            Evaluate the candidate's answer strictly and fairly.

            Question topic: {topic}
            Difficulty: {difficulty}/5
            Candidate level: {level}
            Interview type: {interview_type}

            Evaluation calibration:
            - {level_guidance}
            - {interview_type_guidance}

            Question:
            {question_text}

            Candidate answer:
            {answer_text}

            Rules:
            - All score fields must be integers from 0 to 10
            - feedback_text must be 2-4 sentences, concise and actionable
            - missing_points: list of short strings with key missing concepts (empty list if none)
            - better_answer: list of 2-4 short sentences describing a stronger answer

            Language and tone rules:
            - Respond in the same language as the candidate answer
            - Address the candidate directly using "you"
            - Never refer to the candidate in third person
            - Keep feedback natural and conversational
            """.strip()

    async def evaluate(
        self,
        question_text: str,
        answer_text: str,
        topic: str,
        difficulty: int,
        level: str,
        interview_type: str,
    ) -> dict:
        prompt = self.build_prompt(
            question_text=question_text,
            answer_text=answer_text,
            topic=topic,
            difficulty=difficulty,
            level=level,
            interview_type=interview_type,
        )

        raw = await self.client.generate(prompt)
        result = json.loads(raw)

        required = ["score", "clarity_score", "correctness_score", "confidence_score",
                    "feedback_text", "missing_points", "better_answer"]
        for field in required:
            if field not in result:
                raise ValueError(f"Missing field in Gemini response: {field}")

        for score_field in ["score", "clarity_score", "correctness_score", "confidence_score"]:
            result[score_field] = max(0, min(10, int(result[score_field])))

        return result