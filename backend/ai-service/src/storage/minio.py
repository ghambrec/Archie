"""MinIO document store adapter for fetching documents and document-group metadata."""

from __future__ import annotations

import logging
from typing import Iterable, List, Optional

from minio import Minio
import httpx

logger = logging.getLogger(__name__)


class MinioDocumentStore:
    """Adapter for reading documents from MinIO and enriching them with metadata.

    Responsibilities:
    1. Connect to MinIO and list documents in the 'documents' bucket
    2. Download document text content
    3. Query nest-server API to fetch document access metadata
       (creator user + assigned document group)
    4. Provide stable indexing for documents
    5. Build chunk metadata used for query-time access checks

    Access rule expected by retriever:
    - A querying user can read a chunk if they are the creator user, OR
    - They belong to the document's assigned group.
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

    def ListDocuments(self) -> List[str]:
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

    def GetDocumentText(self, object_key: str) -> str:
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

    def GetDocumentMetadata(self, object_key: str) -> dict:
        """Fetch document access metadata for a document from nest-server API.

        Expected payload shape from nest-server:
        - id: document UUID
        - uploadedBy: creator user UUID
        - groupId: UUID of document's assigned group, or null

        Args:
            object_key: MinIO object key

        Returns:
            Normalized metadata dictionary with:
            - document_id
            - creator_user_id
            - document_group_id

        Raises:
            httpx.HTTPError: If nest-server API call fails
            ValueError: If document not found in nest-server
        """
        try:
            logger.info(f"Fetching metadata from nest-server for: {object_key}")

            # Query nest-server to find a document and its assigned access group by object key.
            response = self.http_client.get(
                f"/documents/by-key/{object_key}",
                timeout=10,
            )
            response.raise_for_status()

            metadata = response.json()
            normalized = {
                "document_id": metadata.get("id"),
                "creator_user_id": metadata.get("uploadedBy"),
                "document_group_id": metadata.get("groupId"),
            }
            logger.info(
                f"Retrieved metadata for {object_key}: "
                f"creator={normalized['creator_user_id']}, "
                f"group={normalized['document_group_id']}"
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

    def GetObjectIndex(
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
                all_keys = self.ListDocuments()

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

    def BuildChunkMetadata(
        self,
        document_id: str,
        source_key: str,
        document_index: int,
        creator_user_id: str,
        document_group_id: str | None,
    ) -> dict:
        """Build metadata for each chunk.

        This metadata is stored with every chunk in the vector database.
        At retrieval time, access is allowed when:
        - querying user ID == creator_user_id, OR
        - querying user's groups contain document_group_id.

        Args:
            document_id: Logical document UUID from nest-server
            source_key: MinIO object key where this chunk came from
            document_index: Stable index of the document in the bucket
            creator_user_id: UUID of user who uploaded the document
            document_group_id: Group UUID assigned to this document, if any

        Returns:
            Dictionary with chunk provenance + access metadata

        Example:
            {
                "document_id": "document-uuid",
                "source_key": "documents-abc123",
                "document_index": 5,
                "creator_user_id": "user-uuid",
                "document_group_id": "group-uuid",
            }
        """
        metadata = {
            "document_id": document_id,
            "source_key": source_key,
            "document_index": document_index,
            "creator_user_id": creator_user_id,
            "document_group_id": document_group_id,
        }

        logger.debug(f"Built chunk metadata: {metadata}")
        return metadata

    def Close(self) -> None:
        """Release HTTP resources owned by the metadata client."""
        self.http_client.close()
