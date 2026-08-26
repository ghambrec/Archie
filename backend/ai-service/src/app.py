"""FastAPI application and route definitions."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from arq import create_pool as arq_create_pool
from arq.connections import RedisSettings

from src.config import settings
from src.db import create_pool

from src.api.health import router as health_router
from src.api.routes import router as api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup on app startup/shutdown."""
    logger.info("AI Service starting up")
    app.state.db_pool = await create_pool()
    app.state.arq_pool = await arq_create_pool(RedisSettings(host=settings.redis_host, port=settings.redis_port))
    try:
        yield
    finally:
        logger.info("AI Service shutting down")
        await app.state.db_pool.close()
        await app.state.arq_pool.aclose()


app = FastAPI(
    title="Archie AI Service",
    description="API documentation for the Documents System AI Service backend",
    lifespan=lifespan,
    swagger_ui_parameters={"defaultModelsExpandDepth": -1}
)

app.include_router(health_router)
app.include_router(api_router)
