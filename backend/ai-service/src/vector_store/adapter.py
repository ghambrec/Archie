"""Vector store abstraction layer."""

from __future__ import annotations

from typing import Sequence


class VectorStoreAdapter:
    """Abstract adapter around the embedding/vector database.

    The project targets pgvector on Postgres as the primary backend. The
    storage interface remains generic so the retrieval layer stays isolated from
    backend-specific query details.
    """

    def connect(self) -> None:
        """Initialize the database connection and embeddings."""
        raise NotImplementedError("connect is not implemented yet")

    def delete_collection(self, collection_name: str = "archie_documents") -> None:
        """Delete or recreate the target collection before ingestion."""
        raise NotImplementedError("delete_collection is not implemented yet")

    def add_documents(
        self, documents: Sequence[dict], collection_name: str = "archie_documents"
    ) -> list[str]:
        """Insert chunk documents with embedding vectors and metadata."""
        raise NotImplementedError("add_documents is not implemented yet")

    def similarity_search(
        self,
        query: str,
        collection_name: str = "archie_documents",
        k: int = 5,
        filter_metadata: dict | None = None,
    ) -> list[dict]:
        """Return the best matching chunks, optionally filtered by metadata.

        Important: when ``filter_metadata`` is provided, implementations should
        apply it inside the vector-database query so the returned rows are the
        top-k authorized matches rather than top-k global matches filtered later.
        """
        raise NotImplementedError("similarity_search is not implemented yet")
