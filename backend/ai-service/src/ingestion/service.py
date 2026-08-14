"""Document ingestion service."""

from __future__ import annotations

from typing import Iterable, List

from langchain_text_splitters import RecursiveCharacterTextSplitter
from transformers import AutoTokenizer

from src.config import settings


class DocumentIngestionService:
    """Chunk documents using the configured embedding model tokenizer.

    Embedding itself is not done here. The vector store adapter owns the exact
    embedding model logic and inserts the resulting vectors into pgvector.
    Ingestion is responsible only for splitting text into model-sized windows and
    attaching retrieval metadata.
    """

    def __init__(
        self,
        minio_store,
        vector_store,
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP,
        embedding_model: str = settings.EMBEDDING_MODEL,
    ):
        self.minio_store = minio_store
        self.vector_store = vector_store
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedding_model = embedding_model
        self.chunker = RecursiveCharacterTextSplitter.from_huggingface_tokenizer(
            AutoTokenizer.from_pretrained(self.embedding_model),
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )

    async def ingest_all_documents(self, object_keys: Iterable[str] | None = None) -> List[str]:
        """Ingest all documents from MinIO into the vector database."""
        if self.minio_store is None:
            raise RuntimeError("DocumentIngestionService requires a MinIO store.")
        if self.vector_store is None:
            raise RuntimeError("DocumentIngestionService requires a vector store.")

        keys = list(object_keys) if object_keys is not None else self.minio_store.list_documents()
        ingested_chunk_ids: list[str] = []

        for object_key in keys:
            ingested_chunk_ids.extend(await self.ingest_document(object_key))

        return ingested_chunk_ids

    async def ingest_document(self, object_key: str) -> List[str]:
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
            document_id=metadata["document_id"],
            creator_user_id=metadata.get("creator_user_id"),
            document_group_id=metadata.get("document_group_id"),
        )

        if not chunks:
            return []

        return await self.vector_store.add_documents(chunks)

    def chunk_text(
        self,
        text: str,
        source_key: str,
        document_index: int,
        document_id: str,
        creator_user_id: str,
        document_group_id: str | None,
    ) -> list[dict]:
        """Split text with the configured tokenizer-aware chunker."""
        if not text or not text.strip():
            return []

        chunk_contents = self.chunker.split_text(text)
        chunks: list[dict] = []

        for index, chunk_content in enumerate(chunk_contents):
            if not chunk_content.strip():
                continue

            chunks.append(
                {
                    "id": self.build_chunk_id(document_id=document_id, chunk_index=index),
                    "content": chunk_content,
                    "metadata": self.build_chunk_metadata(
                        document_id=document_id,
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
        document_id: str,
        source_key: str,
        document_index: int,
        creator_user_id: str,
        document_group_id: str | None,
    ) -> dict:
        """Build chunk metadata with MinIO provenance + document-group access fields."""
        return {
            "document_id": document_id,
            "source_key": source_key,
            "document_index": document_index,
            "creator_user_id": creator_user_id,
            "document_group_id": document_group_id,
        }

    def build_chunk_id(self, document_id: str, chunk_index: int) -> str:
        """Build a deterministic chunk ID scoped to the source document."""
        return f"{document_id}:{chunk_index}"
