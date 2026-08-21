from __future__ import annotations

import logging
import asyncpg

from uuid import UUID

from src.storage.minio import MinioDocumentStore
from src.chunking.chunker import chunk_text
from src.embedding.embedder import embed
from src.chunks_storage import ai_chunks
from src.ingestion import status

logger = logging.getLogger(__name__)


async def get_object_key(pool: asyncpg.Pool, doc_id: UUID) -> str | None:
    select = "select object_key from documents where id = $1 and deleted_at is null"
    return await pool.fetchval(select, doc_id)


async def ingest_doc(
    pool: asyncpg.Pool,
    minio: MinioDocumentStore,
    doc_id: UUID
) -> None:
    await status.init_db_entry(pool, doc_id)

    obj_key = await get_object_key(pool, doc_id)
    if obj_key is None:
        raise ValueError(f"No object key found for doc_id {doc_id}") # TODO was passiert bei einem fehler? -> TESTEN!

    doc_text = await minio.GetDocumentText(obj_key)
    chunks = chunk_text(doc_text)

    results: list[dict] = []
    for index, content in enumerate(chunks):
        embedding = await embed(content)
        results.append({
            "chunk_index": index,
            "content": content,
            "embedding": embedding
        })
        logger.info("chunk %s embedded (%s chars, %s dimensions)", index, len(content), len(embedding))

    await ai_chunks.save_chunks(pool, doc_id, results)
    await status.mark_as_finished(pool, doc_id)
