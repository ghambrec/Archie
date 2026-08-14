"""Retrieval service with permission filtering."""

from __future__ import annotations

from typing import Any, Iterable, List


class PermissionAwareRetriever:
    """Retrieve relevant document chunks while respecting document permissions."""

    def __init__(self, vector_store):
        self.vector_store = vector_store

    def retrieve(
        self,
        query: str,
        user_id: str,
        user_group_ids: Iterable[str] | None = None,
        top_k: int = 5,
    ) -> List[dict]:
        """Return top-k readable chunks for this user.

        The permission filter is pushed down into the vector-store query so the
        database returns the top-k authorized matches directly.
        """
        access_filter = self.build_access_filter(
            user_id=user_id,
            user_group_ids=user_group_ids,
        )
        return self.vector_store.similarity_search(
            query=query,
            k=top_k,
            filter_metadata=access_filter,
        )

    def build_access_filter(
        self,
        user_id: str,
        user_group_ids: Iterable[str] | None = None,
    ) -> dict[str, Any]:
        """Build a backend-neutral access filter for vector-store implementations.

        Semantics:
        - creator_user_id == user_id
        - OR document_group_id IN user_group_ids

        Adapters should translate this structure to the native filter syntax of
        the underlying vector store when needed.
        """
        normalized_user_groups = [group_id for group_id in (user_group_ids or []) if group_id]
        clauses: list[dict[str, Any]] = [{"creator_user_id": {"$eq": user_id}}]

        if normalized_user_groups:
            clauses.append({"document_group_id": {"$in": normalized_user_groups}})

        if len(clauses) == 1:
            return clauses[0]

        return {"$or": clauses}
