"""Document ingestion service."""

from __future__ import annotations

from typing import Iterable, List

from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.config import settings


class DocumentIngestionService:
    """Service responsible for converting documents into vector chunks.

    Each chunk keeps enough metadata to trace back to the source file in MinIO and
    to enforce document-group access during retrieval.
    """

    def __init__(
        self,
        minio_store,
        vector_store,
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP,
    ):
        self.minio_store = minio_store
        self.vector_store = vector_store
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def ingest_all_documents(self, object_keys: Iterable[str] | None = None) -> List[str]:
        """Ingest all documents from MinIO into the vector database."""
        if self.minio_store is None:
            raise RuntimeError("DocumentIngestionService requires a MinIO store.")
        if self.vector_store is None:
            raise RuntimeError("DocumentIngestionService requires a vector store.")

        keys = list(object_keys) if object_keys is not None else self.minio_store.list_documents()
        ingested_chunk_ids: list[str] = []

        for object_key in keys:
            ingested_chunk_ids.extend(self.ingest_document(object_key))

        return ingested_chunk_ids

    def ingest_document(self, object_key: str) -> List[str]:
        """Ingest a single document and return the IDs of the created chunks."""
        if self.minio_store is None:
            raise RuntimeError("DocumentIngestionService requires a MinIO store.")
        if self.vector_store is None:
            raise RuntimeError("DocumentIngestionService requires a vector store.")

        text = self.minio_store.get_document_text(object_key)
        metadata = self.minio_store.get_document_metadata(object_key)
        document_index = self.minio_store.get_object_index(object_key)

        chunks = self.chunk_text(
            text=text,
            source_key=object_key,
            document_index=document_index,
            creator_user_id=metadata.get("creator_user_id"),
            document_group_id=metadata.get("document_group_id"),
        )

        if not chunks:
            return []

        return self.vector_store.add_documents(chunks)

    def chunk_text(
        self,
        text: str,
        source_key: str,
        document_index: int,
        creator_user_id: str,
        document_group_id: str | None,
    ) -> list[dict]:
        """Split text into chunks and attach MinIO provenance and access metadata."""
        if not text or not text.strip():
            return []

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
        )

        chunk_contents = splitter.split_text(text)
        chunks: list[dict] = []

        for index, chunk_content in enumerate(chunk_contents):
            chunks.append(
                {
                    "content": chunk_content,
                    "metadata": self.build_chunk_metadata(
                        source_key=source_key,
                        document_index=document_index,
                        creator_user_id=creator_user_id,
                        document_group_id=document_group_id,
                    )
                    | {"chunk_index": index},
                }
            )

        return chunks

    def build_chunk_metadata(
        self,
        source_key: str,
        document_index: int,
        creator_user_id: str,
        document_group_id: str | None,
    ) -> dict:
        """Build chunk metadata with MinIO provenance + document-group access fields."""
        return {
            "source_key": source_key,
            "document_index": document_index,
            "creator_user_id": creator_user_id,
            "document_group_id": document_group_id,
        }
