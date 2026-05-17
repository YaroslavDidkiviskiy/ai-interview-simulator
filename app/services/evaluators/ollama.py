import json
import re

from app.services.evaluators.base import BaseEvaluator
from app.services.evaluators.prompts import get_interview_type_guidance, get_level_guidance
from app.services.llm.ollama_client import OllamaClient


def _parse_evaluator_json(raw: str) -> dict:
    s = raw.strip().lstrip("\ufeff")
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", s, re.IGNORECASE)
    if fence:
        s = fence.group(1).strip()
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass
    start = s.find("{")
    if start == -1:
        raise ValueError(f"No JSON object in Ollama response: {raw[:500]!r}…")
    try:
        obj, _ = json.JSONDecoder().raw_decode(s[start:])
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    raise ValueError(f"Failed to parse Ollama response as JSON: {raw[:800]}")


class OllamaEvaluator(BaseEvaluator):
    def __init__(self, client: OllamaClient | None = None) -> None:
        self.client = client or OllamaClient()

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

            Evaluate the candidate's answer.

            Question topic: {topic}
            Difficulty: {difficulty}
            Candidate level: {level}
            Interview type: {interview_type}

            Evaluation calibration:
            - {level_guidance}
            - {interview_type_guidance}

            Question:
            {question_text}

            Candidate answer:
            {answer_text}

            Return ONLY valid JSON in this exact format:
            {{
            "score": 0,
            "clarity_score": 0,
            "correctness_score": 0,
            "confidence_score": 0,
            "feedback_text": "",
            "feedback_text": "",
            "missing_points": [],
            "better_answer": []
            }}

            Rules:
            - score fields must be integers from 0 to 10
            - feedback_text must be concise but useful
            - missing_points must contain short bullet-like strings
            - better_answer must contain 2-4 short sentences with a stronger answer
            - do not return markdown
            - do not return explanations outside JSON
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

        raw_response = await self.client.generate(prompt)
        return _parse_evaluator_json(raw_response)