"""API routes for the AI Service."""

from fastapi import APIRouter, Depends

from src.models import (
    AskRequest,
    AskResponse,
    IngestRequest,
    IngestResponse,
    RetrieveRequest,
    RetrieveResponse,
    RetrievedChunk,
)
from src.retrieval.service import RetrievalService

router = APIRouter()


def get_retrieval_service() -> RetrievalService:
    """Wire the retrieval service for API usage.

    This is intentionally lightweight for now: the core service logic lives in
    the retrieval service object, while the concrete vector store is attached in
    the application composition layer later.
    """
    return RetrievalService(vector_store=None)


@router.get("/health")
async def health_check():
    """Liveness probe for orchestrators."""
    return {"status": "ok"}


@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve(
    request: RetrieveRequest,
    service: RetrievalService = Depends(get_retrieval_service),
):
    """Return the top-k authorized chunks for a user via the retrieval service.

    The route remains a thin HTTP adapter; all access-aware logic lives in the
    service layer and the vector-store adapter.
    """
    results = await service.retrieve(
        query=request.query,
        user_id=request.user_id,
        user_group_ids=request.user_group_ids,
        top_k=request.top_k,
    )

    return {
        "results": [
            RetrievedChunk(
                id=item["id"],
                content=item["content"],
                metadata=item.get("metadata", {}),
                distance=float(item.get("distance", 0.0)),
            )
            for item in results
        ],
        "count": len(results),
    }


@router.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest):
    """Ingest documents from MinIO into the vector database.

    Args:
        request: Contains optional list of object_keys to ingest.
                 If omitted, all documents in the bucket are ingested.

    Returns:
        IngestResponse with chunk count and list of ingested document keys.
    """
    raise NotImplementedError("POST /ingest not implemented yet")


@router.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """Ask a question and retrieve answers using RAG.

    Args:
        request: Contains question + querying user context (user_id, user_group_ids).
                 Retrieval allows creator access and assigned document-group access.

    Returns:
        AskResponse with the generated answer and source chunks.
    """
    raise NotImplementedError("POST /ask not implemented yet")
