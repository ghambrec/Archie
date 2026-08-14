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
    creator_group_ids: list[str]


class AskResponse(BaseModel):
    """Response from question answering."""

    answer: str
    sources: list[SourceChunk]
