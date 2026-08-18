from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = REPO_ROOT / "env" / ".env"

class Settings(BaseSettings):
	model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

	# --- APP
	ai_service_port: int

	# --- DATABASE
	postgres_dsn: str

	# --- OLLAMA
	ollama_host: str
	ollama_generation_model: str
	ollama_embedding_model: str
	ollama_vision_model: str

settings = Settings()
