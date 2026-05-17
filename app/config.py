from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="AI Interview Simulator", alias="APP_NAME")
    debug: bool = Field(default=True, alias="DEBUG")

    database_url: str = Field(
        default="",
        alias="DATABASE_URL"
    )

    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    backend_url: str = Field(default="http://localhost:8000", alias="BACKEND_URL")
    frontend_url: str = Field(default="http://localhost", alias="FRONTEND_URL")
    
    evaluator_provider: str = Field(default="", alias="EVALUATOR_PROVIDER")
    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3.2:3b", alias="OLLAMA_MODEL")

    secret_key: str = Field(default="change-me-in-production", alias="SECRET_KEY")
    access_expire_min: int = Field(default=30, alias="ACCESS_EXPIRE_MIN")
    refresh_expire_days: int = Field(default=7, alias="REFRESH_EXPIRE_DAYS")

    gemini_api_key: str = Field(default="change-me-in-production", alias="GEMINI_API_KEY")

    github_client_secret: str = Field(default="change-me-in-production", alias="GITHUB_CLIENT_SECRET")
    google_client_secret: str = Field(default="change-me-in-production", alias="GOOGLE_CLIENT_SECRET")

    github_client_id: str = Field(default="", alias="GITHUB_CLIENT_ID")
    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
