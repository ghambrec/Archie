"""Core orchestration service."""

from __future__ import annotations

from typing import Iterable, List


class AIService:
    """Entry point for the document ingestion and question-answering workflow."""

    def __init__(
        self,
        minio_store,
        vector_store,
        ingestion_service=None,
        retrieval_service=None,
        generator=None,
    ):
        self.minio_store = minio_store
        self.vector_store = vector_store
        self.ingestion_service = ingestion_service
        self.retrieval_service = retrieval_service
        self.generator = generator

    async def ingest_documents(self, object_keys: Iterable[str] | None = None) -> List[str]:
        """Run the ingestion flow for documents currently stored in MinIO."""
        if self.ingestion_service is None:
            raise RuntimeError(
                "AIService is not configured with an ingestion service. "
                "Attach DocumentIngestionService before ingesting documents."
            )
        return await self.ingestion_service.ingest_all_documents(object_keys)

    def ask(
        self,
        question: str,
        user_id: str,
        user_group_ids: Iterable[str] | None = None,
    ) -> str:
        """Retrieve matching chunks, build a prompt, and return the answer."""
        raise NotImplementedError("ask is not implemented yet")
