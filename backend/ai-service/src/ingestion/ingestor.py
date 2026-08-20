from __future__ import annotations

import logging
import asyncpg

from uuid import UUID

from src.storage.minio import MinioDocumentStore
from src.chunking.chunker import chunk_text
from src.embedding.embedder import embed

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


async def get_object_key(pool: asyncpg.Pool, doc_id: UUID) -> str | None:
    select = "select object_key from documents where id = $1 and deleted_at is null"
    return await pool.fetchval(select, doc_id)


async def ingest_doc(
    pool: asyncpg.Pool,
    minio: MinioDocumentStore,
    doc_id: UUID
) -> list[dict]:
    await update_db(pool, doc_id)

    obj_key = await get_object_key(pool, doc_id)
    if obj_key is None:
        raise ValueError(f"No object key found for doc_id {doc_id}") # TODO was passiert bei einem fehler? -> TESTEN!

    logger.info("start getting doc from minio")
    doc_text = await minio.GetDocumentText(obj_key)
    logger.info("finished getting doc from minio")
    logger.info("start chunking")
    chunks = chunk_text(doc_text)
    logger.info("finished chunking")

    results: list[dict] = []
    for index, content in enumerate(chunks):
        logger.info("start embedding")
        embedding = await embed(content)
        results.append({"chunk_index": index, "content": content, "embedding": embedding})
        logger.info("chunk %s embedded (%s chars, %s dimensions)", index, len(content), len(embedding))

    return results
