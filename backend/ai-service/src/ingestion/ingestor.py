from __future__ import annotations

from uuid import UUID

import asyncpg


async def update_db(pool: asyncpg.Pool, doc_id: UUID) -> None:
    select = "select count(*) from ai_documents where id = $1"
    insert = "insert into ai_documents (id) values ($1)"
    update = """
                update ai_documents 
                set 
                    status = 'PENDING', 
                    ai_summary = NULL, 
                    language = NULL, 
                    error_msg = NULL, 
                    retry_count = retry_count + 1, 
                    processed_at = NULL, 
                    updated_at = now()
                where id = $1
            """

    count = await pool.fetchval(select, doc_id)
    if count == 0:
        print("nicht vorhanden, insert")
        await pool.execute(insert, doc_id)
    else:
        print("schon vorhanden, update")
        await pool.execute(update, doc_id)
