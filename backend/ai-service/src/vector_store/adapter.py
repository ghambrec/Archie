"""Async pgvector-backed vector store adapter"""

from __future__ import annotations

import asyncpg
from pgvector.asyncpg import register_vector

from src.config import settings
from src.embedding.embedder import embed


async def test() -> None:
    conn = await asyncpg.connect(dsn=settings.postgres_dsn)
    await register_vector(conn)

    await conn.execute(
        """
                create table if not exists vector_test (id serial primary key, content text, embedding vector(1024));
                """
    )

    saetze = [
        "berlin is the capital from germany",
        "paris is the capital from france",
        "amsterdam is the capital from netherlands"
    ]
    for satz in saetze:
        vector = await embed(satz)
        await conn.execute(
            "insert into vector_test (content, embedding) values ($1, $2)",
            satz,
            vector
        )

    query_vector = await embed("what is the capital from germany?")
    rows = await conn.fetch(
        """
        select content, embedding <=> $1 as distance
        from vector_test
        order by distance asc
        """,
        query_vector
    )
    for row in rows:
        print(f"{row['distance']:.4f}  {row['content']}")

    # await conn.execute("drop table vector_test")
    await conn.close()

if __name__ == "__main__":
    import asyncio

    asyncio.run(test())

# uv run python -m src.vector_store.adapter