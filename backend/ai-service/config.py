from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
	model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", env_file_encoding="utf-8", extra="ignore")

	ollama_base_url: str
	ollama_generation_model: str
	ollama_embedding_model: str
	# ollama_vision_model: str
	postgres: str

settings = Settings()
