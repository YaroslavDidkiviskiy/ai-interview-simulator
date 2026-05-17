import asyncio
from abc import ABC, abstractmethod


class BaseEvaluator(ABC):
    @abstractmethod
    def build_prompt(
        self,
        question_text: str,
        answer_text: str,
        topic: str,
        difficulty: int,
        level: str,
        interview_type: str,
    ) -> str:
        raise NotImplementedError

    @abstractmethod
    async def evaluate(
        self,
        question_text: str,
        answer_text: str,
        topic: str,
        difficulty: int,
        level: str,
        interview_type: str,
    ) -> dict:
        raise NotImplementedError
