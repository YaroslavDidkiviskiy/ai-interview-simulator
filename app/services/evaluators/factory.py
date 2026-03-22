from app.config import get_settings
from app.services.evaluators.base import BaseEvaluator
from app.services.evaluators.ollama import OllamaEvaluator


def get_evaluator() -> BaseEvaluator:
    settings = get_settings()

    if settings.evaluator_provider == "ollama":
        return OllamaEvaluator()

    raise ValueError(f"Unsupported evaluator provider: {settings.evaluator_provider}")