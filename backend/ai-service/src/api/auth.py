import secrets
from fastapi import Security, HTTPException, Header
from fastapi.security import APIKeyHeader
from uuid import UUID

from src.config import settings

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)


async def check_api_key(key: str | None = Security(api_key_header)) -> None:
    if key is None or not secrets.compare_digest(key, settings.ai_service_api_key):
        raise HTTPException(status_code=401, detail="invalid or missing api key")


async def get_user_id(user_id: UUID | None = Header(default=None, alias="X-User-Id")) -> UUID:
    if user_id is None:
        raise HTTPException(status_code=400, detail="missing X-User-Id header")
    return user_id
