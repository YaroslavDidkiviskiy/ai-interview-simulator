from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="AI Interview Simulator", alias="APP_NAME")
    debug: bool = Field(default=True, alias="DEBUG")

    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/ai_interview_simulator",
        alias="DATABASE_URL"
    )

    evaluator_provider: str = Field(default="fallback", alias="EVALUATOR_PROVIDER")
    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3.2:3b", alias="OLLAMA_MODEL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
        populatate_by_name=True
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
