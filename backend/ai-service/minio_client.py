from __future__ import annotations

from typing import Iterable, List, Optional


class MinioDocumentStore:
    """Thin adapter for the MinIO documents bucket.

    This layer is responsible for listing objects in the documents bucket and
    resolving the source metadata that will later be attached to each vector
    chunk.
    """

    def __init__(self, endpoint: str, access_key: str, secret_key: str, secure: bool = False, bucket: str = "documents"):
        self.endpoint = endpoint
        self.access_key = access_key
        self.secret_key = secret_key
        self.secure = secure
        self.bucket = bucket

    def list_documents(self) -> List[str]:
        """Return the list of object keys in the documents bucket.

        Implementation detail: for now this is a placeholder until the MinIO client
        is wired in and the object listing contract is finalized.
        """
        raise NotImplementedError("list_documents is not implemented yet")

    def get_document_text(self, object_key: str) -> str:
        """Download a document from MinIO and return its text content."""
        raise NotImplementedError("get_document_text is not implemented yet")

    def get_document_metadata(self, object_key: str) -> dict:
        """Return MinIO metadata that should be attached to ingested chunks."""
        raise NotImplementedError("get_document_metadata is not implemented yet")

    def get_role_permission(self, object_key: str) -> str:
        """Resolve the role-based permission for a document.

        This is intentionally kept as a separate method because MinIO currently
        does not enforce RBAC at the object level yet. Once that is in place, this
        function can map the object or bucket policy into a permission tag.
        """
        raise NotImplementedError("get_role_permission is not implemented yet")

    def get_object_index(self, object_key: str, all_keys: Optional[Iterable[str]] = None) -> int:
        """Return the stable index of the object within the source bucket."""
        raise NotImplementedError("get_object_index is not implemented yet")
