import secrets
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

from src.config import settings

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)


async def check_api_key(key: str | None = Security(api_key_header)) -> None:
    if key is None or not secrets.compare_digest(key, settings.ai_service_api_key):
        raise HTTPException(status_code=401, detail="invalid or missing api key")
