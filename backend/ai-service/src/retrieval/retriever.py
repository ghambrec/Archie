"""Retrieval service with permission filtering."""

from __future__ import annotations

from typing import Iterable, List


class PermissionAwareRetriever:
    """Retrieve relevant document chunks while respecting document permissions."""

    def __init__(self, vector_store):
        self.vector_store = vector_store

    def retrieve(
        self, query: str, user_roles: Iterable[str] | None = None, top_k: int = 5
    ) -> List[dict]:
        """Search the vector store and apply role filters to the result set."""
        raise NotImplementedError("retrieve is not implemented yet")

    def build_permission_filter(self, user_roles: Iterable[str] | None = None) -> dict:
        """Build a metadata filter for allowed roles.

        Example strategy:
        - allow documents with 'public' OR any role in user_roles.
        - future support can include org- or tenant-scoped permissions.
        """
        raise NotImplementedError("build_permission_filter is not implemented yet")
