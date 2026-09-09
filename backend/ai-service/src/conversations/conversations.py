from __future__ import annotations

import logging
import asyncpg
from asyncpg.exceptions import ForeignKeyViolationError

from uuid import UUID

logger = logging.getLogger(__name__)


class UserNotFoundError(Exception):
    """raised when given user not exist"""


class ConversationNotFoundError(Exception):
    """raised then given conversation not exist for given user"""


async def ask_question(pool: asyncpg.Pool, user_id: UUID, conv_id: UUID, question: str):
    select = """
                SELECT 1 FROM ai_conversations WHERE user_id = $1 AND id = $2
            """
    insert = """
                INSERT INTO ai_messages (conv_id, sender, content)
                VALUES ($1, $2, $3)
            """

    conv_exist = await pool.fetchval(select, user_id, conv_id)
    if conv_exist is None:
        logger.debug("conversation %s not found for user %s", conv_id, user_id)
        raise ConversationNotFoundError(str(conv_id))

    try:
        await pool.execute(insert, conv_id, "user", question)
    except ForeignKeyViolationError as e:
        logger.debug("create message failed, no user found for given id")
        raise UserNotFoundError(str(user_id)) from e

    # TODO: hier weiter mit retrieval pipeline (embedding etc)


async def get_messages(pool: asyncpg.Pool, user_id: UUID, conv_id: UUID):
    select = """
                SELECT 
                    am.sender, am."content" 
                FROM ai_messages AS am 
                LEFT JOIN ai_conversations AS ac 
                    ON ac.id  = am.conv_id 
                WHERE
                    am.conv_id = $1
                    AND ac.user_id = $2
                ORDER BY am.created_at ASC
            """

    rows = await pool.fetch(select, conv_id, user_id)
    return rows


async def create_conversation(pool: asyncpg.Pool, user_id: UUID) -> UUID:
    insert = """
                INSERT INTO ai_conversations (user_id) VALUES ($1)
                RETURNING id
            """
    try:
        conv_id = await pool.fetchval(insert, user_id)
        logger.debug("conversation '%s' created for user '%s'", conv_id, user_id)
        return conv_id
    except ForeignKeyViolationError as e:
        logger.debug("create conversation failed, no user found this given id")
        raise UserNotFoundError(str(user_id)) from e


async def get_conversations(pool: asyncpg.Pool, user_id: UUID):
    select = """
                SELECT id, title, updated_at FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC
            """
    rows = await pool.fetch(select, user_id)
    return rows


async def del_conversations(pool: asyncpg.Pool, user_id: UUID):
    delete = """
                DELETE FROM ai_conversations WHERE user_id = $1
            """
    await pool.execute(delete, user_id)


async def del_conversation(pool: asyncpg.Pool, user_id: UUID, conv_id: UUID):
    delete = """
                DELETE FROM ai_conversations WHERE user_id = $1 AND id = $2
            """
    await pool.execute(delete, user_id, conv_id)
