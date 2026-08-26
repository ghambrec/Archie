from __future__ import annotations

import asyncpg
from pgvector.asyncpg import register_vector

from src.config import settings


async def create_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(
        dsn=settings.postgres_dsn,
        min_size=1,
        max_size=5,
        init=register_vector
    )
