"""API routes for the AI Service."""

from fastapi import APIRouter

from src.models import AskRequest, AskResponse, IngestRequest, IngestResponse

router = APIRouter()


@router.get("/health")
async def health_check():
    """Liveness probe for orchestrators."""
    return {"status": "ok"}


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
                 Retrieval uses creator-group intersection for access checks.

    Returns:
        AskResponse with the generated answer and source chunks.
    """
    raise NotImplementedError("POST /ask not implemented yet")
