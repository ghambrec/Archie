"""Document ingestion service."""

from __future__ import annotations

from typing import Iterable, List


class DocumentIngestionService:
    """Service responsible for converting documents into vector chunks.

    Each chunk must keep enough metadata to trace back to the source file in MinIO
    and to enforce role-based filtering during retrieval.
    """

    def __init__(
        self,
        minio_store,
        vector_store,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
    ):
        self.minio_store = minio_store
        self.vector_store = vector_store
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def ingest_all_documents(self, object_keys: Iterable[str] | None = None) -> List[str]:
        """Ingest all documents from MinIO into the vector database."""
        raise NotImplementedError("ingest_all_documents is not implemented yet")

    def ingest_document(self, object_key: str) -> List[str]:
        """Ingest a single document and return the IDs or keys of the stored chunks."""
        raise NotImplementedError("ingest_document is not implemented yet")

    def chunk_text(self, text: str, source_key: str, role_permission: str) -> list[dict]:
        """Split a document into chunks and attach metadata for tracing and RBAC."""
        raise NotImplementedError("chunk_text is not implemented yet")

    def build_chunk_metadata(
        self, source_key: str, document_index: int, role_permission: str
    ) -> dict:
        """Build chunk metadata with MinIO provenance and permission information."""
        return {
            "source_key": source_key,
            "document_index": document_index,
            "role_permission": role_permission,
        }
