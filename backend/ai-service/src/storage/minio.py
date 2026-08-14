"""MinIO document store adapter for fetching documents and creator-group metadata."""

from __future__ import annotations

import logging
from typing import Any, Iterable, List, Optional

from minio import Minio
import httpx

logger = logging.getLogger(__name__)


class MinioDocumentStore:
    """Adapter for reading documents from MinIO and enriching them with metadata.

    Responsibilities:
    1. Connect to MinIO and list documents in the 'documents' bucket
    2. Download document text content
    3. Query nest-server API to fetch creator metadata
       (creator user + all creator groups)
    4. Provide stable indexing for documents
    5. Build chunk metadata used for query-time access checks

    Access rule expected by retriever:
    - A querying user can read a chunk if they are the creator user, OR
    - Their groups intersect with the creator's groups stored on the chunk.
    """

    def __init__(
        self,
        minio_endpoint: str,
        minio_access_key: str,
        minio_secret_key: str,
        minio_secure: bool = False,
        bucket: str = "documents",
        nest_server_url: str = "http://nest-server:3000",
    ):
        """Initialize MinIO adapter.

        Args:
            minio_endpoint: MinIO server address (e.g., "minio:9000")
            minio_access_key: MinIO access key
            minio_secret_key: MinIO secret key
            minio_secure: Use HTTPS (False for local development)
            bucket: MinIO bucket name containing documents
            nest_server_url: Base URL of nest-server for metadata queries
        """
        self.bucket = bucket
        self.nest_server_url = nest_server_url

        # Initialize MinIO client
        self.minio_client = Minio(
            endpoint=minio_endpoint,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            secure=minio_secure,
        )

        # HTTP client for nest-server API calls
        self.http_client = httpx.Client(base_url=nest_server_url)

        logger.info(
            f"Initialized MinioDocumentStore: endpoint={minio_endpoint}, bucket={bucket}"
        )

    def list_documents(self) -> List[str]:
        """List all object keys in the documents bucket.

        Returns:
            List of object keys (e.g., ["documents-uuid1", "documents-uuid2"])

        Raises:
            Exception: If MinIO connection fails or bucket is inaccessible
        """
        try:
            logger.info(f"Listing documents from MinIO bucket: {self.bucket}")
            objects = self.minio_client.list_objects(self.bucket)
            keys = [obj.object_name for obj in objects]
            logger.info(f"Found {len(keys)} documents in bucket")
            return keys
        except Exception as e:
            logger.error(f"Failed to list documents from MinIO: {e}")
            raise

    def get_document_text(self, object_key: str) -> str:
        """Download and read document content from MinIO.

        Currently supports plain text and UTF-8 encoded files.
        Future: extend to handle PDF, DOCX, etc. via langchain loaders.

        Args:
            object_key: MinIO object key (e.g., "documents-uuid1")

        Returns:
            Document text content

        Raises:
            Exception: If document cannot be retrieved or decoded
        """
        try:
            logger.info(f"Downloading document from MinIO: {object_key}")
            response = self.minio_client.get_object(self.bucket, object_key)
            content = response.read().decode("utf-8")
            logger.info(f"Successfully downloaded document: {object_key}")
            return content
        except Exception as e:
            logger.error(f"Failed to download document {object_key}: {e}")
            raise

    def get_document_metadata(self, object_key: str) -> dict:
        """Fetch creator metadata for a document from nest-server API.

        Expected payload shape from nest-server:
        - id: document UUID
        - uploadedBy: creator user UUID
        - creatorGroupIds: list[str] (all groups creator belongs to)

        Args:
            object_key: MinIO object key

        Returns:
            Normalized metadata dictionary with:
            - document_id
            - creator_user_id
            - creator_group_ids

        Raises:
            httpx.HTTPError: If nest-server API call fails
            ValueError: If document not found in nest-server
        """
        try:
            logger.info(f"Fetching metadata from nest-server for: {object_key}")

            # Query nest-server to find document + creator membership by object key.
            # Endpoint contract is a placeholder until nest-server endpoint is added.
            response = self.http_client.get(
                f"/documents/by-key/{object_key}",
                timeout=10,
            )
            response.raise_for_status()

            metadata = response.json()
            creator_group_ids = self._extract_creator_group_ids(metadata)
            normalized = {
                "document_id": metadata.get("id"),
                "creator_user_id": metadata.get("uploadedBy"),
                "creator_group_ids": creator_group_ids,
            }
            logger.info(
                f"Retrieved metadata for {object_key}: "
                f"creator={normalized['creator_user_id']}, "
                f"groups={len(creator_group_ids)}"
            )

            return normalized

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise ValueError(
                    f"Document with objectKey {object_key} not found in nest-server"
                )
            logger.error(f"Nest-server API error for {object_key}: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to fetch metadata for {object_key}: {e}")
            raise

    def _extract_creator_group_ids(self, metadata: dict[str, Any]) -> list[str]:
        """Normalize creator group IDs from possible response field names.

        This keeps the adapter resilient while the upstream endpoint is evolving.
        """
        value = metadata.get("creatorGroupIds")
        if value is None:
            value = metadata.get("groupIds")
        if value is None:
            value = metadata.get("groups")
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValueError("Expected creator group IDs to be a list")

        normalized: list[str] = []
        for item in value:
            if isinstance(item, str):
                normalized.append(item)
            elif isinstance(item, dict):
                # Supports group objects like {"id": "..."} if that is returned upstream.
                group_id = item.get("id")
                if isinstance(group_id, str):
                    normalized.append(group_id)
        return normalized

    def get_object_index(
        self, object_key: str, all_keys: Optional[Iterable[str]] = None
    ) -> int:
        """Assign a stable index to this object within the bucket.

        This provides a consistent ordering for documents, useful for tracking
        which document a chunk came from in a deterministic way.

        Args:
            object_key: The object key to index
            all_keys: Optional pre-sorted list of all keys. If None, fetched from MinIO.

        Returns:
            0-based index of the object in sorted order

        Raises:
            ValueError: If object_key not found in the bucket
        """
        try:
            # Use provided keys or fetch from MinIO
            if all_keys is None:
                all_keys = self.list_documents()

            sorted_keys = sorted(all_keys)

            try:
                index = sorted_keys.index(object_key)
                logger.debug(f"Assigned index {index} to {object_key}")
                return index
            except ValueError:
                raise ValueError(f"Object {object_key} not found in bucket {self.bucket}")

        except Exception as e:
            logger.error(f"Failed to get object index for {object_key}: {e}")
            raise

    def build_chunk_metadata(
        self,
        source_key: str,
        document_index: int,
        creator_user_id: str,
        creator_group_ids: list[str],
    ) -> dict:
        """Build metadata for each chunk.

        This metadata is stored with every chunk in the vector database.
        At retrieval time, access is allowed when:
        - querying user ID == creator_user_id, OR
        - querying user's groups intersect creator_group_ids.

        Args:
            source_key: MinIO object key where this chunk came from
            document_index: Stable index of the document in the bucket
            creator_user_id: UUID of user who uploaded the document
            creator_group_ids: All group UUIDs the creator belongs to

        Returns:
            Dictionary with chunk provenance + access metadata

        Example:
            {
                "source_key": "documents-abc123",
                "document_index": 5,
                "creator_user_id": "user-uuid",
                "creator_group_ids": ["group-a", "group-b"],
            }
        """
        metadata = {
            "source_key": source_key,
            "document_index": document_index,
            "creator_user_id": creator_user_id,
            "creator_group_ids": creator_group_ids,
        }

        logger.debug(f"Built chunk metadata: {metadata}")
        return metadata
