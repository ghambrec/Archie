"""Pydantic models for API requests and responses."""

from pydantic import BaseModel


class IngestRequest(BaseModel):
    """Request to ingest documents from MinIO."""

    object_keys: list[str] | None = None


class IngestResponse(BaseModel):
    """Response from document ingestion."""

    chunk_count: int
    ingested_documents: list[str]


class AskRequest(BaseModel):
    """Request to ask a question and retrieve answers."""

    question: str
    user_id: str
    user_group_ids: list[str] | None = None


class SourceChunk(BaseModel):
    """A retrieved source chunk with metadata."""

    content: str
    source_key: str
    document_index: int
    creator_user_id: str
    document_group_id: str | None


class AskResponse(BaseModel):
    """Response from question answering."""

    answer: str
    sources: list[SourceChunk]


class RetrieveRequest(BaseModel):
    """Request payload for permission-aware retrieval."""

    query: str
    user_id: str
    user_group_ids: list[str] | None = None
    top_k: int = 5


class RetrievedChunk(BaseModel):
    """A single vector-search result returned to API clients."""

    id: str
    content: str
    metadata: dict
    distance: float


class RetrieveResponse(BaseModel):
    """Response returned by the retrieval service."""

    results: list[RetrievedChunk]
    count: int
