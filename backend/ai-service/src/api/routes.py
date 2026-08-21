"""API routes for the AI Service."""

from fastapi import APIRouter, HTTPException, Request

from src.ingestion import ingestor
from src.storage.minio import MinioDocumentStore
from src.config import settings

# , Depends, Request

# from src.core.service import AIService
# from src.models import (
#     AskRequest,
#     AskResponse,
#     IngestRequest,
#     IngestResponse,
#     RetrieveRequest,
#     RetrieveResponse,
#     RetrievedChunk,
# )
# from src.retrieval.service import RetrievalService

router = APIRouter()


@router.get("/health")
async def health_check():
    """health check - checks for server running"""
    return {"status": "ok"}


@router.get("/ready")
async def ready_check(request: Request):
    """ready check - checks for connection to database ready"""
    pool = request.app.state.db_pool
    try:
        await pool.fetchval("SELECT 1")
    except Exception as ex:
        raise HTTPException(status_code=503, detail="database unavailable") from ex
    return {"status": "ok"}


@router.post("/ingest")
async def ingest(request: Request):
    """start ingestion pipeline"""
    pool = request.app.state.db_pool
    minio = MinioDocumentStore(
        minio_endpoint=f"{settings.minio_endpoint}:{settings.minio_port}",
        minio_access_key=f"{settings.minio_app_access_key}",
        minio_secret_key=f"{settings.minio_app_secret_key}",
        minio_secure=False
    )
    await ingestor.ingest_doc(pool, minio, "ca7017c6-5be9-4a85-a270-4f0b3dc7ecda")


# def GetAIService(request: Request) -> AIService:
#     """Return the shared AI service composed at application startup."""
#     return request.app.state.ai_service


# def GetRetrievalService(request: Request) -> RetrievalService:
#     """Return the shared retrieval service composed at application startup."""
#     return request.app.state.retrieval_service


# @router.get("/health")
# async def HealthCheck():
#     """Liveness probe for orchestrators."""
#     return {"status": "ok"}


# @router.post("/retrieve", response_model=RetrieveResponse)
# async def Retrieve(
#     request: RetrieveRequest,
#     service: RetrievalService = Depends(GetRetrievalService),
# ):
#     """Return the top-k authorized chunks for a user via the retrieval service.

#     The route remains a thin HTTP adapter; all access-aware logic lives in the
#     service layer and the vector-store adapter.
#     """
#     results = await service.Retrieve(
#         query=request.query,
#         user_id=request.user_id,
#         user_group_ids=request.user_group_ids,
#     )

#     return {
#         "results": [
#             RetrievedChunk(
#                 id=item["id"],
#                 content=item["content"],
#                 metadata=item.get("metadata", {}),
#                 distance=float(item.get("distance", 0.0)),
#             )
#             for item in results
#         ],
#         "count": len(results),
#     }


# @router.post("/ingest", response_model=IngestResponse)
# async def Ingest(
#     request: IngestRequest,
#     service: AIService = Depends(GetAIService),
# ):
#     """Ingest documents from MinIO into the vector database.

#     Args:
#         request: Contains optional list of object_keys to ingest.
#                  If omitted, all documents in the bucket are ingested.

#     Returns:
#         IngestResponse with chunk count and list of ingested document keys.
#     """
#     object_keys = request.object_keys or await service.minio_store.ListDocuments()
#     chunk_ids = await service.IngestDocuments(object_keys)
#     return {
#         "chunk_count": len(chunk_ids),
#         "ingested_documents": object_keys,
#     }


# @router.post("/ask", response_model=AskResponse)
# async def Ask(
#     request: AskRequest,
#     service: AIService = Depends(GetAIService),
# ):
#     """Ask a question and retrieve answers using RAG.

#     Args:
#         request: Contains question + querying user context (user_id, user_group_ids).
#                  Retrieval allows creator access and assigned document-group access.

#     Returns:
#         AskResponse with the generated answer and source chunks.
#     """
#     result = await service.Ask(
#         question=request.question,
#         user_id=request.user_id,
#         user_group_ids=request.user_group_ids,
#     )

#     return {
#         "answer": result["answer"],
#         "sources": [
#             {
#                 "content": item["content"],
#                 "source_key": item.get("metadata", {}).get("source_key", ""),
#                 "document_index": item.get("metadata", {}).get("document_index", -1),
#                 "creator_user_id": item.get("metadata", {}).get("creator_user_id", ""),
#                 "document_group_id": item.get("metadata", {}).get("document_group_id"),
#             }
#             for item in result["sources"]
#         ],
#     }
