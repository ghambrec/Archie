"""MinIO document store adapter for fetching documents and document-group metadata."""

from __future__ import annotations

import asyncio
import logging
from typing import List

from minio import Minio

logger = logging.getLogger(__name__)


class MinioDocumentStore:
    """Adapter for getting documents from MinIO"""

    def __init__(
        self,
        minio_endpoint: str,
        minio_access_key: str,
        minio_secret_key: str,
        minio_secure: bool = False,
        bucket: str = "documents",
    ):
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
