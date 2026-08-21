from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from uvicorn.logging import DefaultFormatter

import asyncpg

from src.config import settings

# LOGGER SETTINGS
handler = logging.StreamHandler()
handler.setFormatter(DefaultFormatter("%(levelprefix)s %(name)s: %(message)s"))
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger(__name__)

SQL_FILE = Path(__file__).resolve().parent / "ai_tables.sql"


async def run_db_migration() -> None:
    sql = SQL_FILE.read_text()

    for attempt in range(1, 11):
        conn = await asyncpg.connect(dsn=settings.postgres_dsn)
        try:
            await conn.execute(sql)
            logger.info("checked for ai tables")
            return
        except asyncpg.exceptions.UndefinedTableError:
            logger.info("nest migration not done yet, retry %s/10", attempt)
            await asyncio.sleep(3)
        finally:
            await conn.close()

    raise RuntimeError("ai db migration failed, tables are not ready")


if __name__ == "__main__":
    asyncio.run(run_db_migration())
