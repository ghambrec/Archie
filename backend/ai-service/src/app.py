"""FastAPI application and route definitions."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.routes import router as api_router
from src.db import create_pool

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup on app startup/shutdown."""
    logger.info("AI Service starting up")
    app.state.db_pool = await create_pool()
    try:
        yield
    finally:
        logger.info("AI Service shutting down")
        await app.state.db_pool.close()


app = FastAPI(
    title="Archie AI Service",
    description="API documentation for the Documents System AI Service backend",
    lifespan=lifespan,
)

app.include_router(api_router)
