"""FastAPI application and route definitions."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.routes import router as api_router
from src.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup on app startup/shutdown."""
    logger.info("🚀 AI Service starting up...")
    # TODO: Initialize vector store, MinIO client, services
    yield
    logger.info("🛑 AI Service shutting down...")
    # TODO: Cleanup


app = FastAPI(
    title="Archie AI Service",
    description="Document ingestion and retrieval-augmented generation service",
    lifespan=lifespan,
)

# Include routes
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.app:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.ENVIRONMENT == "development",
    )
