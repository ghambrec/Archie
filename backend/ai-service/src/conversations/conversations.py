from __future__ import annotations

import logging
import asyncpg
from src.retrieval .retrieval import retrieval
from asyncpg.exceptions import ForeignKeyViolationError

from src.generation.schemas import AnswerResponse, SourceCitation
from src.conversations.errors import ChatError

from uuid import UUID

logger = logging.getLogger(__name__)


class UserNotFoundError(Exception):
    """raised when given user not exist"""


class ConversationNotFoundError(Exception):
    """raised then given conversation not exist for given user"""


async def ask_question(pool: asyncpg.Pool, user_id: UUID, conv_id: UUID, question: str):
    # Reserve one connection, not a transaction, while the model is working.
    async with pool.acquire() as connection:
        exists = await connection.fetchval(
            "SELECT 1 FROM ai_conversations WHERE user_id = $1 AND id = $2", user_id, conv_id
        )
        if exists is None:
            raise ConversationNotFoundError(str(conv_id))
        lock_key = f"chat-generation:{conv_id}"
        acquired = await connection.fetchval(
            "SELECT pg_try_advisory_lock(hashtextextended($1, 0))", lock_key
        )
        if not acquired:
            raise ChatError('AI_CONVERSATION_BUSY', 409, True)
        try:
            await connection.execute(
                "INSERT INTO ai_messages (conv_id, sender, content) VALUES ($1, 'user', $2)",
                conv_id, question,
            )
            answer = await retrieval(user_id, conv_id, question, connection)
            await save_conversation(connection, question, answer, conv_id)
            return answer
        finally:
            await connection.execute(
                "SELECT pg_advisory_unlock(hashtextextended($1, 0))", lock_key
            )

async def get_messages(pool: asyncpg.Pool, user_id: UUID, conv_id: UUID):
    select = """
                SELECT 
                    am.id,
                    am.conv_id,
                    am.sender,
                    am."content",
                    am.created_at
                FROM ai_messages AS am 
                LEFT JOIN ai_conversations AS ac 
                    ON ac.id  = am.conv_id 
                WHERE
                    am.conv_id = $1
                    AND ac.user_id = $2
                ORDER BY am.created_at ASC
            """

    rows = await pool.fetch(select, conv_id, user_id)
    if not rows:
        return []

    # Re-check current document access when a saved conversation is reopened.
    source_rows = await pool.fetch(
        """
        SELECT ams.message_id, ch.id AS chunk_id,
               d.id AS document_id, d.filename AS document_name,
               ams.similiary_score AS similarity_score
        FROM ai_message_sources AS ams
        JOIN ai_messages AS am ON am.id = ams.message_id
        JOIN ai_conversations AS ac ON ac.id = am.conv_id
        JOIN ai_chunks AS ch ON ch.id = ams.chunk_id
        JOIN documents AS d ON d.id = ch.ai_document_id
        WHERE am.conv_id = $1 AND ac.user_id = $2
          AND d.deleted_at IS NULL
          AND EXISTS (
              SELECT 1
              FROM document_groups AS dg
              JOIN user_groups AS ug ON ug.group_id = dg.group_id
              JOIN user_permission AS up
                ON up.user_id = ug.user_id AND up.group_id = dg.group_id
              JOIN permissions AS p ON p.id = up.permission_id
              WHERE dg.document_id = d.id AND ug.user_id = $2
                AND p.perm_key = 'documents.read'
          )
        ORDER BY ams.message_id, d.filename, ch.id
        """,
        conv_id, user_id,
    )
    sources_by_message = {}
    for source in source_rows:
        sources_by_message.setdefault(source["message_id"], []).append(
            SourceCitation(
                chunk_Id=source["chunk_id"],
                document_id=source["document_id"],
                document_name=source["document_name"],
                similarity_score=source["similarity_score"],
            ).model_dump()
        )
    return [
        {**dict(row), "sources": sources_by_message.get(row["id"], [])}
        for row in rows
    ]


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


async def save_conversation(connection: asyncpg.Connection, question: str, answer: AnswerResponse, conv_id: UUID) -> UUID:
    try:
        async with connection.transaction():
            message_id = await connection.fetchval(
                "INSERT INTO ai_messages (conv_id, sender, content) VALUES ($1, 'llm', $2) RETURNING id",
                conv_id, answer.answer,
            )
            for source in answer.sources:
                await connection.execute(
                    "INSERT INTO ai_message_sources (chunk_id, message_id, similiary_score) VALUES ($1, $2, $3)",
                    source.chunk_Id, message_id, source.similarity_score,
                )
            return message_id
    except Exception as error:
        logger.exception("Saving chat answer and sources failed")
        raise ChatError('AI_SAVE_FAILED', 503, True) from error


async def patch_conversation(
    pool: asyncpg.Pool, user_id: UUID, conv_id: UUID, title: str
) -> dict:
    query = """
        UPDATE ai_conversations
        SET title = $3, updated_at = now()
        WHERE user_id = $1 AND id = $2
        RETURNING id, title, updated_at
    """
    try:
        row = await pool.fetchrow(query, user_id, conv_id, title)
    except Exception:
        logger.exception("updating conversation title failed")
        raise
    if row is None:
        raise ConversationNotFoundError(str(conv_id))
    return dict(row)
