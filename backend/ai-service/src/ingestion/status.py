from __future__ import annotations

import logging
import asyncpg

from uuid import UUID

logger = logging.getLogger(__name__)


async def init_db_entry(pool: asyncpg.Pool, doc_id: UUID) -> None:
    upsert = """
                insert into ai_documents (id) values ($1)
                on conflict (id) do update set
                    status = 'PROCESSING', 
                    ai_summary = NULL, 
                    language = NULL, 
                    error_key = NULL, 
                    error_detail = NULL, 
                    retry_count = ai_documents.retry_count + 1, 
                    processed_at = NULL, 
                    updated_at = now()
                returning (xmax = 0) as inserted
            """

    row = await pool.fetchrow(upsert, doc_id)
    if row["inserted"]:
        logger.info("ai_documents row inserted: %s", doc_id)
    else:
        logger.info("ai_documents row resetted for reprocessing: %s", doc_id)


async def mark_as_finished(pool: asyncpg.Pool, doc_id: UUID) -> None:
    update = """
                update ai_documents set
                    status = 'FINISHED',
                    processed_at = now(),
                    updated_at = now()
                where
                    id = $1
            """

    await pool.execute(update, doc_id)


async def write_error(pool: asyncpg.Pool, doc_id: UUID, error_key: str, error_detail: str) -> None:
    update = """
                update ai_documents set
                    status = 'FAILED',
                    error_key = $2,
                    error_detail = $3,
                    updated_at = now()
                where
                    id = $1
            """

    await pool.execute(update, doc_id, "ais.error." + error_key, error_detail)
