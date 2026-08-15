"""Core orchestration service."""

from __future__ import annotations

from typing import Any, Iterable, List


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

    async def IngestDocuments(self, object_keys: Iterable[str] | None = None) -> List[str]:
        """Run the ingestion flow for documents currently stored in MinIO."""
        if self.ingestion_service is None:
            raise RuntimeError(
                "AIService is not configured with an ingestion service. "
                "Attach DocumentIngestionService before ingesting documents."
            )
        return await self.ingestion_service.IngestAllDocuments(object_keys)

    async def Ask(
        self,
        question: str,
        user_id: str,
        user_group_ids: Iterable[str] | None = None,
    ) -> dict[str, Any]:
        """Retrieve matching chunks, build a prompt, and return the answer."""
        if self.retrieval_service is None:
            raise RuntimeError(
                "AIService is not configured with a retrieval service. "
                "Attach RetrievalService before answering questions."
            )
        if self.generator is None:
            raise RuntimeError(
                "AIService is not configured with a generation service. "
                "Attach GenerationService before answering questions."
            )

        sources = await self.retrieval_service.Retrieve(
            query=question,
            user_id=user_id,
            user_group_ids=user_group_ids,
        )
        answer = await self.generator.Generate(question, sources)
        return {
            "answer": answer,
            "sources": sources,
        }
