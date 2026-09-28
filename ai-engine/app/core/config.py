import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_engine_port: int = 8000
    client_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:5000"
    
    # Primary Gemini configuration
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    
    # Secondary / Alternative provider configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    groq_model: str = "qwen/qwen3.8-27b"
    
    # Active LLM provider: "gemini" | "openai" | "groq" | "auto"
    llm_provider: str = "auto"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    # Check fallback environment variables if not loaded from .env
    if not settings.gemini_api_key:
        settings.gemini_api_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
    if not settings.openai_api_key:
        settings.openai_api_key = os.environ.get("OPENAI_API_KEY", "") or os.environ.get("GROQ_API_KEY", "")

    # Auto detect provider if set to auto or misconfigured
    if settings.llm_provider in ("auto", "gemini") and not settings.gemini_api_key:
        if settings.openai_api_key:
            if settings.openai_api_key.startswith("gsk_"):
                settings.llm_provider = "groq"
            else:
                settings.llm_provider = "openai"
        else:
            settings.llm_provider = "fallback"
    elif settings.gemini_api_key and settings.llm_provider == "auto":
        settings.llm_provider = "gemini"

    return settings

