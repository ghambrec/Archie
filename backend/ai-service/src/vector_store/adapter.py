"""stores vectors in ai_chunks"""

from __future__ import annotations

import asyncpg

from uuid import UUID


async def save_chunks(pool: asyncpg.Pool, doc_id: UUID, chunks: list[dict]):

    delete = "delete from ai_chunks where ai_document_id = $1"
    insert = """
                insert into ai_chunks (ai_document_id, chunk_index, content, embedding, token_count)
                values ($1, $2, $3, $4, $5)
            """

    rows = [
        (
            doc_id,
            chunk["chunk_index"],
            chunk["content"],
            chunk["embedding"],
            len(chunk["content"]) // 4      # 4 chars ~ 1 token
        )
        for chunk in chunks
    ]

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(delete, doc_id)
            await conn.executemany(insert, rows)
