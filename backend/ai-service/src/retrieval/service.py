"""Retrieval domain service for the AI service."""

from __future__ import annotations

from typing import Any, Iterable


class RetrievalService:
    """Domain logic for permission-aware document retrieval."""

    def __init__(self, vector_store=None):
        self.vector_store = vector_store

    async def retrieve(
        self,
        query: str,
        user_id: str,
        user_group_ids: Iterable[str] | None = None,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """Return top-k authorized chunks for a user."""
        if self.vector_store is None:
            raise RuntimeError(
                "RetrievalService is not configured with a vector_store. "
                "Attach a pgvector-backed adapter before using the route."
            )

        access_filter = self.build_access_filter(
            user_id=user_id,
            user_group_ids=user_group_ids,
        )
        return await self.vector_store.similarity_search(
            query=query,
            k=top_k,
            filter_metadata=access_filter,
        )

    def build_access_filter(
        self,
        user_id: str,
        user_group_ids: Iterable[str] | None = None,
    ) -> dict[str, Any]:
        """Build a permission filter for the vector search.

        A chunk is readable when the querying user created it or the document
        belongs to one of the user's groups.
        """
        normalized_user_groups = [group_id for group_id in (user_group_ids or []) if group_id]
        clauses: list[dict[str, Any]] = [{"creator_user_id": {"$eq": user_id}}]

        if normalized_user_groups:
            clauses.append({"document_group_id": {"$in": normalized_user_groups}})

        if len(clauses) == 1:
            return clauses[0]

        return {"$or": clauses}
