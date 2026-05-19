"""Evaluator factory tests."""

import pytest

from app.config import get_settings
from app.services.evaluators.factory import get_evaluator
from app.services.evaluators.ollama import OllamaEvaluator
from app.services.evaluators.gemini import GeminiEvaluator


def test_get_ollama_evaluator(monkeypatch):
    monkeypatch.setenv("EVALUATOR_PROVIDER", "ollama")
    get_settings.cache_clear()
    evaluator = get_evaluator()
    assert isinstance(evaluator, OllamaEvaluator)


def test_get_gemini_evaluator(monkeypatch):
    monkeypatch.setenv("EVALUATOR_PROVIDER", "gemini")
    get_settings.cache_clear()
    evaluator = get_evaluator()
    assert isinstance(evaluator, GeminiEvaluator)


def test_unsupported_provider_raises(monkeypatch):
    monkeypatch.setenv("EVALUATOR_PROVIDER", "unknown")
    get_settings.cache_clear()
    with pytest.raises(ValueError, match="Unsupported evaluator provider"):
        get_evaluator()
