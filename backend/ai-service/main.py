import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from backend.ai_service.config import settings

logger = logging.getLogger(__name__)


class IngestRequest(BaseModel):
    object_keys: list[str] | None = None


class IngestResponse(BaseModel):
    chunk_count: int
    ingested_documents: list[str]


class AskRequest(BaseModel):
    question: str
    user_roles: list[str] | None = None


class AskResponse(BaseModel):
    answer: str
    sources: list[dict]


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


@app.get("/health")
async def health_check():
    """Liveness probe for orchestrators."""
    return {"status": "ok"}


@app.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest):
    """Ingest documents from MinIO into the vector database.

    Args:
        request: Contains optional list of object_keys to ingest.
                 If omitted, all documents in the bucket are ingested.

    Returns:
        IngestResponse with chunk count and list of ingested document keys.
    """
    raise NotImplementedError("POST /ingest not implemented yet")


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """Ask a question and retrieve answers using RAG.

    Args:
        request: Contains the question and optional user_roles for permission filtering.

    Returns:
        AskResponse with the generated answer and source chunks.
    """
    raise NotImplementedError("POST /ask not implemented yet")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.ai_service.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.ENVIRONMENT == "development",
    )
