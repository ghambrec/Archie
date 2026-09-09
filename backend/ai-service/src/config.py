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
    ai_service_api_key: str

    # --- LANGFUSE
    langfuse_enabled: bool = False
    langfuse_host: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None

    # --- DATABASE
    postgres_user: str
    postgres_password: str
    postgres_host: str
    postgres_port: int = 5432
    postgres_db: str

    @property
    def postgres_dsn(self) -> str:
        return (f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}")

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

    # --- ANALYZER
    analyzer_max_chars_ollama: int
    analyzer_max_chars_openrouter: int

    # --- CHUNKING
    chunk_size_chars: int
    chunk_overlap_chars: int

    # --- REDIS
    redis_url: str

    @property
    def redis_dsn(self) -> str:
            return (f"redis://{self.redis_url}")

    # --- OCR EXTRACTION
    ocr_min_chars: int = 20
    ocr_image_resultion_dpi: int = 200

settings = Settings()
