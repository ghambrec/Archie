"""Core orchestration service."""

from __future__ import annotations

from typing import Iterable, List


class AIService:
    """Entry point for the document ingestion and question-answering workflow."""

    def __init__(self, minio_store, vector_store, retriever, generator):
        self.minio_store = minio_store
        self.vector_store = vector_store
        self.retriever = retriever
        self.generator = generator

    def ingest_documents(self, object_keys: Iterable[str] | None = None) -> List[str]:
        """Run the ingestion flow for documents currently stored in MinIO."""
        raise NotImplementedError("ingest_documents is not implemented yet")

    def ask(self, question: str, user_roles: Iterable[str] | None = None) -> str:
        """Retrieve matching chunks, build a prompt, and return the answer."""
        raise NotImplementedError("ask is not implemented yet")
