from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Interview Simulator"
    debug: bool = True

    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/ai_interview_simulator"
    )

    evaluator_provider: str = "fallback"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
