"""arq worker: get queued jobs from redis"""

import logging
from uvicorn.logging import DefaultFormatter

from uuid import UUID
from arq import func
from arq.connections import RedisSettings

from src.config import settings
from src.db import create_pool
from src.ingestion import ingestor
from src.storage.minio import MinioDocumentStore

# LOGGER SETTINGS
handler = logging.StreamHandler()
handler.setFormatter(DefaultFormatter("%(levelprefix)s %(name)s: %(message)s"))
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger(__name__)

# FUNCTIONS

async def ingest_job(ctx: dict, doc_id: UUID) -> None:
    await ingestor.ingest_doc(ctx["db_pool"], ctx["minio"], doc_id)


# ARQ SETTINGS

async def on_startup(ctx: dict) -> None:
    logger.info("AI Service Worker starting up")
    ctx["db_pool"] = await create_pool()
    ctx["minio"] = MinioDocumentStore(
        minio_endpoint=f"{settings.minio_endpoint}:{settings.minio_port}",
        minio_access_key=f"{settings.minio_app_access_key}",
        minio_secret_key=f"{settings.minio_app_secret_key}",
        minio_secure=False
    )


async def on_shutdown(ctx: dict) -> None:
    logger.info("AI Service Worker shutting down")
    await ctx["db_pool"].close()
    await ctx["minio"].Close()


class WorkerSettings:
    functions = [func(ingest_job, max_tries=1)]
    on_startup = on_startup
    on_shutdown = on_shutdown
    redis_settings = RedisSettings(
        host=settings.redis_host, port=settings.redis_port)
