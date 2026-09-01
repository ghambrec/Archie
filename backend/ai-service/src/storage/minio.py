"""MinIO document store adapter for fetching documents and document-group metadata."""

from __future__ import annotations

import asyncio
import logging
from typing import List

from minio import Minio

logger = logging.getLogger(__name__)


class MinioDocumentStore:
    """Adapter for getting documents from MinIO

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

        # Initialize MinIO client
        self.minio_client = Minio(
            endpoint=minio_endpoint,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            secure=minio_secure,
        )

        logger.info(
            f"Initialized MinioDocumentStore: endpoint={minio_endpoint}, bucket={bucket}"
        )

    async def GetDocumentBytes(self, object_key: str) -> bytes:
        """download raw file in bytes"""
        try:
            logger.info(f"Downloading document from MinIO: {object_key}")
            response = await asyncio.to_thread(
                self.minio_client.get_object,
                self.bucket,
                object_key,
            )
            try:
                content = (await asyncio.to_thread(response.read))
            finally:
                await asyncio.to_thread(response.close)
                await asyncio.to_thread(response.release_conn)
            logger.info(f"Successfully downloaded document: {object_key}")
            return content
        except Exception as e:
            logger.error(f"Failed to download document {object_key}: {e}")
            raise

    async def ListDocuments(self) -> List[str]:
        """List all object keys in the documents bucket.

        Returns:
            List of object keys (e.g., ["documents-uuid1", "documents-uuid2"])

        Raises:
            Exception: If MinIO connection fails or bucket is inaccessible
        """
        try:
            logger.info(f"Listing documents from MinIO bucket: {self.bucket}")
            objects = await asyncio.to_thread(
                lambda: list(self.minio_client.list_objects(self.bucket))
            )
            keys = [obj.object_name for obj in objects]
            logger.info(f"Found {len(keys)} documents in bucket")
            return keys
        except Exception as e:
            logger.error(f"Failed to list documents from MinIO: {e}")
            raise
