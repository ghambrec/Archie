"""Retrieval service with permission filtering."""

from __future__ import annotations

from typing import Iterable, List


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
        """Search vector store and keep only chunks readable by this user.

        Access rule:
        - allow if user_id == chunk.creator_user_id
        - allow if intersection(user_group_ids, chunk.creator_group_ids) is non-empty
        """
        candidates = self.vector_store.similarity_search(query=query, k=top_k)
        return self.filter_chunks_by_creator_groups(
            candidates=candidates,
            user_id=user_id,
            user_group_ids=user_group_ids,
        )

    def filter_chunks_by_creator_groups(
        self,
        candidates: Iterable[dict],
        user_id: str,
        user_group_ids: Iterable[str] | None = None,
    ) -> list[dict]:
        """Filter retrieval results using creator-user and creator-groups metadata."""
        allowed: list[dict] = []
        normalized_user_groups = set(user_group_ids or [])
        for chunk in candidates:
            metadata = chunk.get("metadata", {})
            creator_user_id = metadata.get("creator_user_id")
            creator_group_ids = metadata.get("creator_group_ids") or []
            if not isinstance(creator_group_ids, list):
                creator_group_ids = []

            if creator_user_id == user_id:
                allowed.append(chunk)
                continue

            if normalized_user_groups.intersection(creator_group_ids):
                allowed.append(chunk)

        return allowed
