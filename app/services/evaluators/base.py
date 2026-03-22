from abc import ABC, abstractmethod


class BaseEvaluator(ABC):
    @abstractmethod
    def evaluate(
        self,
        question_text: str,
        answer_text: str,
        topic: str,
        difficulty: int,
    ) -> dict:
        raise NotImplementedError