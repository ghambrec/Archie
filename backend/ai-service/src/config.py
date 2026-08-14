import os


class Settings:
    # API Server
    API_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("AI_SERVICE_PORT", "5000"))
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

    # MinIO
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
    MINIO_BUCKET = os.getenv("MINIO_DOCUMENTS_BUCKET", "documents")

    # Vector Database
    VECTOR_DB_TYPE = os.getenv("VECTOR_DB_TYPE", "chroma")
    CHROMA_PERSIST_DIRECTORY = os.getenv(
        "CHROMA_PERSIST_DIRECTORY",
        "/tmp/archie_ai_service_chroma",
    )

    # Embedding & Chunking
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))

    # RBAC
    DEFAULT_ROLE_PERMISSION = os.getenv("DEFAULT_ROLE_PERMISSION", "public")


settings = Settings()
