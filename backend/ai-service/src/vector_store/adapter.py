"""Async pgvector-backed vector store adapter."""

from __future__ import annotations

import logging
from typing import Any, Sequence

import torch
from langchain_huggingface import HuggingFaceEmbeddings
from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, Column, MetaData, String, Table, Text, and_, delete, or_, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from src.config import settings

logger = logging.getLogger(__name__)

DEFAULT_TABLE_NAME = "document_chunks"
DEFAULT_EMBEDDING_PROBE_TEXT = "archie"


class VectorStoreAdapter:
    """Async vector store adapter backed by Postgres with pgvector.

    This adapter is responsible for:
    1. Initializing the embedding model used for indexing and search
    2. Creating the pgvector-backed storage table when needed
    3. Inserting chunk content + metadata + embeddings
    4. Running top-k similarity search with metadata filtering inside SQL

    The SQL-level filtering is important because retrieval must return the
    top-k authorized matches, not top-k global matches filtered afterward.
    """

    def __init__(
        self,
        *,
        host: str = settings.PGVECTOR_HOST,
        port: int = settings.PGVECTOR_PORT,
        user: str = settings.PGVECTOR_USER,
        password: str = settings.PGVECTOR_PASSWORD,
        database: str = settings.PGVECTOR_DB,
        default_collection: str = settings.PGVECTOR_COLLECTION,
        embedding_model: str = settings.EMBEDDING_MODEL,
        table_name: str = DEFAULT_TABLE_NAME,
    ) -> None:
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.default_collection = default_collection
        self.embedding_model = embedding_model
        self.table_name = table_name

        self.engine: AsyncEngine | None = None
        self.sql_metadata: MetaData | None = None
        self.documents_table: Table | None = None
        self.embeddings: HuggingFaceEmbeddings | None = None
        self.embedding_dimensions: int | None = None

    async def Connect(self) -> None:
        """Initialize the embedding model, database engine, and storage table."""
        if self.engine is not None and self.documents_table is not None:
            return

        self.embeddings = self._InitializeEmbeddings()
        self.embedding_dimensions = len(
            self.embeddings.embed_query(DEFAULT_EMBEDDING_PROBE_TEXT)
        )

        self.engine = create_async_engine(
            (
                f"postgresql+psycopg://{self.user}:{self.password}"
                f"@{self.host}:{self.port}/{self.database}"
            ),
            future=True,
        )

        async with self.engine.begin() as connection:
            await connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

        self.documents_table = self._BuildTable(self.embedding_dimensions)
        async with self.engine.begin() as connection:
            await connection.run_sync(self.sql_metadata.create_all)

        await self._EnsureIndexes()

        logger.info(
            "Connected async pgvector adapter",
            extra={
                "host": self.host,
                "port": self.port,
                "database": self.database,
                "table_name": self.table_name,
                "embedding_dimensions": self.embedding_dimensions,
            },
        )

    async def DeleteCollection(
        self,
        collection_name: str = settings.PGVECTOR_COLLECTION,
    ) -> None:
        """Delete all rows for a logical collection."""
        await self.Connect()
        assert self.engine is not None
        assert self.documents_table is not None

        async with self.engine.begin() as connection:
            await connection.execute(
                delete(self.documents_table).where(
                    self.documents_table.c.collection_name == collection_name
                )
            )

    async def AddDocuments(
        self,
        documents: Sequence[dict],
        collection_name: str = settings.PGVECTOR_COLLECTION,
    ) -> list[str]:
        """Insert chunk documents with embeddings and metadata.

        Expected document shape:
        {
            "content": "...",   # or "page_content"
            "metadata": {...}
        }
        """
        await self.Connect()
        assert self.engine is not None
        assert self.documents_table is not None
        assert self.embeddings is not None

        if not documents:
            return []

        contents = [self._ExtractContent(document) for document in documents]
        embeddings = self.embeddings.embed_documents(contents)
        rows: list[dict[str, Any]] = []
        chunk_ids: list[str] = []

        for document, content, embedding in zip(documents, contents, embeddings, strict=True):
            chunk_id = self._ExtractChunkId(document)
            metadata = dict(document.get("metadata") or {})
            chunk_ids.append(chunk_id)
            rows.append(
                {
                    "chunk_id": chunk_id,
                    "collection_name": collection_name,
                    "content": content,
                    "metadata_json": metadata,
                    "embedding": embedding,
                }
            )

        async with self.engine.begin() as connection:
            await connection.execute(self.documents_table.insert(), rows)

        return chunk_ids

    async def SimilaritySearch(
        self,
        query: str,
        collection_name: str = settings.PGVECTOR_COLLECTION,
        k: int = 5,
        filter_metadata: dict | None = None,
    ) -> list[dict]:
        """Return the top-k matching chunks filtered inside the database query."""
        await self.Connect()
        assert self.engine is not None
        assert self.documents_table is not None
        assert self.embeddings is not None

        query_embedding = self.embeddings.embed_query(query)
        distance_expr = self.documents_table.c.embedding.cosine_distance(query_embedding)

        statement = (
            select(
                self.documents_table.c.chunk_id,
                self.documents_table.c.content,
                self.documents_table.c.metadata_json,
                distance_expr.label("distance"),
            )
            .where(self.documents_table.c.collection_name == collection_name)
            .order_by(distance_expr)
            .limit(k)
        )

        metadata_clause = self._BuildMetadataClause(filter_metadata)
        if metadata_clause is not None:
            statement = statement.where(metadata_clause)

        async with self.engine.begin() as connection:
            rows = (await connection.execute(statement)).mappings().all()

        return [
            {
                "id": row["chunk_id"],
                "content": row["content"],
                "metadata": row["metadata_json"],
                "distance": row["distance"],
            }
            for row in rows
        ]

    async def Close(self) -> None:
        """Release database resources owned by the adapter."""
        if self.engine is not None:
            await self.engine.dispose()
            self.engine = None
            self.documents_table = None
            self.sql_metadata = None

    def _InitializeEmbeddings(self) -> HuggingFaceEmbeddings:
        """Load the embedding model onto the best available device."""
        if torch.cuda.is_available():
            device = "cuda"
        elif torch.backends.mps.is_built() and torch.backends.mps.is_available():
            device = "mps"
        else:
            device = "cpu"

        return HuggingFaceEmbeddings(
            model_name=self.embedding_model,
            model_kwargs={"device": device},
        )

    def _BuildTable(self, embedding_dimensions: int) -> Table:
        """Create the SQLAlchemy table definition used by the adapter."""
        self.sql_metadata = MetaData()
        return Table(
            self.table_name,
            self.sql_metadata,
            Column("chunk_id", String, primary_key=True),
            Column("collection_name", String, nullable=False),
            Column("content", Text, nullable=False),
            Column("metadata_json", JSONB().with_variant(JSON, "sqlite"), nullable=False),
            Column("embedding", Vector(embedding_dimensions), nullable=False),
        )

    async def _EnsureIndexes(self) -> None:
        """Create metadata indexes used by access-filtered retrieval."""
        assert self.engine is not None

        async with self.engine.begin() as connection:
            await connection.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_{self.table_name}_collection_name "
                    f"ON {self.table_name} (collection_name)"
                )
            )
            await connection.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_{self.table_name}_creator_user_id "
                    f"ON {self.table_name} ((metadata_json ->> 'creator_user_id'))"
                )
            )
            await connection.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_{self.table_name}_document_group_id "
                    f"ON {self.table_name} ((metadata_json ->> 'document_group_id'))"
                )
            )

    def _BuildMetadataClause(self, filter_metadata: dict[str, Any] | None):
        """Translate a neutral metadata filter into SQLAlchemy expressions.

        Supported operators:
        - {"field": {"$eq": "value"}}
        - {"field": {"$in": ["a", "b"]}}
        - {"$or": [subfilter, subfilter]}
        """
        if not filter_metadata:
            return None
        assert self.documents_table is not None

        if "$or" in filter_metadata:
            clauses = [            self._BuildMetadataClause(item) for item in filter_metadata["$or"]]
            return or_(*[clause for clause in clauses if clause is not None])

        clauses = []
        for key, condition in filter_metadata.items():
            if key.startswith("$"):
                raise ValueError(f"Unsupported metadata operator: {key}")

            json_field = self.documents_table.c.metadata_json[key].astext

            if not isinstance(condition, dict):
                clauses.append(json_field == str(condition))
                continue

            if "$eq" in condition:
                clauses.append(json_field == str(condition["$eq"]))
                continue

            if "$in" in condition:
                values = [str(value) for value in condition["$in"] if value is not None]
                if not values:
                    clauses.append(text("1 = 0"))
                else:
                    clauses.append(json_field.in_(values))
                continue

            raise ValueError(f"Unsupported metadata condition for field {key}: {condition}")

        return and_(*clauses) if clauses else None

    def _ExtractContent(self, document: dict) -> str:
        """Normalize supported input document shapes to plain text."""
        content = document.get("content")
        if content is None:
            content = document.get("page_content")
        if not isinstance(content, str) or not content.strip():
            raise ValueError("Each document must include a non-empty 'content' string")
        return content

    def _ExtractChunkId(self, document: dict[str, Any]) -> str:
        """Return a stable chunk ID for a document row.

        Preferred input shape is an explicit top-level `id`. If that is not
        provided, fall back to `document_id` + `chunk_index` from metadata.
        """
        chunk_id = document.get("id")
        if chunk_id is not None:
            chunk_id = str(chunk_id)
            if chunk_id:
                return chunk_id

        metadata = dict(document.get("metadata") or {})
        document_id = metadata.get("document_id")
        chunk_index = metadata.get("chunk_index")
        if document_id is None or chunk_index is None:
            raise ValueError(
                "Each document must include either a top-level 'id' or both "
                "'metadata.document_id' and 'metadata.chunk_index'"
            )

        return f"{document_id}:{chunk_index}"
