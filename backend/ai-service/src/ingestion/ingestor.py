from __future__ import annotations

import logging
import asyncpg

from uuid import UUID

logger = logging.getLogger(__name__)


async def update_db(pool: asyncpg.Pool, doc_id: UUID) -> None:
    upsert = """
                insert into ai_documents (id) values ($1)
                on conflict (id) do update set
                    status = 'PENDING', 
                    ai_summary = NULL, 
                    language = NULL, 
                    error_msg = NULL, 
                    retry_count = ai_documents.retry_count + 1, 
                    processed_at = NULL, 
                    updated_at = now()
                returning (xmax = 0) as inserted
            """

    row = await pool.fetchrow(upsert, doc_id)
    if row["inserted"]:
        print("nicht vorhanden, insert")
        logger.info("ai_documents row inserted: %s", doc_id)
    else:
        logger.info("ai_documents row resetted for reprocessing: %s", doc_id)
