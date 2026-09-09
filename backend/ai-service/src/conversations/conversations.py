from __future__ import annotations

import logging
import asyncpg

from uuid import UUID

logger = logging.getLogger(__name__)


async def create_conversation(pool: asyncpg.Pool, user_id: UUID) -> UUID:
    insert = """
                INSERT INTO ai_conversations (user_id) VALUES ($1)
                RETURNING id
            """
    conv_id = await pool.fetchval(insert, user_id)
    logger.debug("conversation '%s' created for user '%s'", conv_id, user_id)
    return conv_id


async def get_conversations(pool: asyncpg.Pool, user_id: UUID):
    select = """
                SELECT id, title, updated_at FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC
            """
    rows = await pool.fetch(select, user_id)
    return rows
