from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

try:
    REPO_ROOT = Path(__file__).resolve().parents[3]
    ENV_FILE = REPO_ROOT / "env" / ".env"
except IndexError:
    ENV_FILE = None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore"
    )

    # --- APP
    ai_service_port: int

    # --- DATABASE
    postgres_dsn: str

    # --- LLM PROVIDER
    llm_provider: Literal["ollama", "openrouter"] = "ollama"

    # --- OLLAMA
    ollama_host: str
    ollama_generation_model: str
    ollama_embedding_model: str
    ollama_vision_model: str

    # --- OPENROUTER
    openrouter_api_key: str | None = None
    openrouter_generation_model: str | None = None

    # --- MINIO
    minio_endpoint: str
    minio_port: str
    minio_use_ssl: bool
    minio_app_access_key: str
    minio_app_secret_key: str

    # --- CHUNKING
    chunk_size_chars: int
    chunk_overlap_chars: int

    # --- REDIS
    redis_host: str
    redis_port: int


settings = Settings()
