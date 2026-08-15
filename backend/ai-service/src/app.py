"""FastAPI application and route definitions."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from langchain_anthropic import ChatAnthropic

from src.api.routes import router as api_router
from src.config import settings
from src.core.service import AIService
from src.generation.generator import GenerationService
from src.ingestion.service import DocumentIngestionService
from src.retrieval.service import RetrievalService
from src.storage.minio import MinioDocumentStore
from src.vector_store.adapter import VectorStoreAdapter

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup on app startup/shutdown."""
    logger.info("🚀 AI Service starting up...")
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is required to start ai-service because /ask uses Claude."
        )

    minio_store = MinioDocumentStore(
        minio_endpoint=settings.MINIO_ENDPOINT,
        minio_access_key=settings.MINIO_ACCESS_KEY,
        minio_secret_key=settings.MINIO_SECRET_KEY,
        minio_secure=settings.MINIO_SECURE,
        bucket=settings.MINIO_BUCKET,
    )
    vector_store = VectorStoreAdapter(
        host=settings.PGVECTOR_HOST,
        port=settings.PGVECTOR_PORT,
        user=settings.PGVECTOR_USER,
        password=settings.PGVECTOR_PASSWORD,
        database=settings.PGVECTOR_DB,
        default_collection=settings.PGVECTOR_COLLECTION,
        embedding_model=settings.EMBEDDING_MODEL,
    )
    ingestion_service = DocumentIngestionService(
        minio_store=minio_store,
        vector_store=vector_store,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        embedding_model=settings.EMBEDDING_MODEL,
    )
    retrieval_service = RetrievalService(vector_store=vector_store)
    generation_service = GenerationService(
        model_client=ChatAnthropic(
            model=settings.CLAUDE_MODEL,
            api_key=settings.ANTHROPIC_API_KEY,
            temperature=settings.CLAUDE_TEMPERATURE,
        )
    )
    ai_service = AIService(
        minio_store=minio_store,
        vector_store=vector_store,
        ingestion_service=ingestion_service,
        retrieval_service=retrieval_service,
        generator=generation_service,
    )

    await vector_store.connect()

    app.state.minio_store = minio_store
    app.state.vector_store = vector_store
    app.state.ingestion_service = ingestion_service
    app.state.retrieval_service = retrieval_service
    app.state.generation_service = generation_service
    app.state.ai_service = ai_service

    try:
        yield
    finally:
        logger.info("🛑 AI Service shutting down...")
        minio_store.close()
        await vector_store.close()


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
