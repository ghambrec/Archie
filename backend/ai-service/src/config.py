import os


class Settings:
    # API Server
    AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "5000"))
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

    # MinIO
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
    MINIO_BUCKET = os.getenv("MINIO_DOCUMENTS_BUCKET", "documents")

    # Vector Database
    VECTOR_DB_TYPE = os.getenv("VECTOR_DB_TYPE", "pgvector")
    PGVECTOR_HOST = os.getenv("PGVECTOR_HOST", os.getenv("POSTGRES_HOST", "postgres"))
    PGVECTOR_PORT = int(os.getenv("PGVECTOR_PORT", os.getenv("POSTGRES_PORT", "5432")))
    PGVECTOR_USER = os.getenv("PGVECTOR_USER", os.getenv("POSTGRES_USER", "postgres"))
    PGVECTOR_PASSWORD = os.getenv(
        "PGVECTOR_PASSWORD",
        os.getenv("POSTGRES_PASSWORD", "postgres"),
    )
    PGVECTOR_DB = os.getenv("PGVECTOR_DB", os.getenv("POSTGRES_DB", "postgresdb"))
    PGVECTOR_COLLECTION = os.getenv("PGVECTOR_COLLECTION", "archie_documents")

    # Embedding & Chunking
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))
    RETRIEVAL_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "5"))

    # LLM (Claude via LangChain)
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")
    CLAUDE_TEMPERATURE = float(os.getenv("CLAUDE_TEMPERATURE", "0.2"))


settings = Settings()
