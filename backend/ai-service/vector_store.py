from __future__ import annotations

from typing import Any, Iterable, List, Sequence


class VectorStoreAdapter:
    """Abstract adapter around the embedding/vector database.

    The implementation can later use Chroma, pgvector, or any other backend, but
    the storage interface should remain stable for the retrieval layer.
    """

    def connect(self) -> None:
        """Initialize the database connection and embeddings."""
        raise NotImplementedError("connect is not implemented yet")

    def delete_collection(self, collection_name: str = "archie_documents") -> None:
        """Delete or recreate the target collection before ingestion."""
        raise NotImplementedError("delete_collection is not implemented yet")

    def add_documents(self, documents: Sequence[dict], collection_name: str = "archie_documents") -> List[str]:
        """Insert chunk documents with embedding vectors and metadata."""
        raise NotImplementedError("add_documents is not implemented yet")

    def similarity_search(
        self,
        query: str,
        collection_name: str = "archie_documents",
        k: int = 5,
        filter_metadata: dict | None = None,
    ) -> list[dict]:
        """Return the best matching chunks, optionally filtered by metadata."""
        raise NotImplementedError("similarity_search is not implemented yet")
