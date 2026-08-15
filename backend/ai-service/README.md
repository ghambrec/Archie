# AI Service

FastAPI microservice for document ingestion and retrieval-augmented generation (RAG).

## Features

- **Document Ingestion**: Reads text documents from MinIO, chunks them, and stores embeddings in a vector database
- **Permission-Aware Retrieval**: Filters chunks by creator-user and document-group membership
- **RAG Generation**: Generates answers using retrieved context chunks
- **Metadata Tracking**: Associates chunks with source document keys and document access metadata

## Architecture

```
MinIO (documents bucket)
    ↓
Ingestion Service → Chunking → Embeddings
    ↓
Vector Store (Postgres + pgvector)
    ↓
Retriever (Permission-filtered) → Generator
    ↓
AI Service (FastAPI)
```

## API Endpoints

### Health Check

```
GET /health
```

Returns `{"status": "ok"}` if the service is ready.

**Example:**
```bash
curl http://localhost:5000/health
```

### Ingest Documents

```
POST /ingest
Content-Type: application/json

{
  "object_keys": ["doc1.txt", "doc2.pdf"] | null
}
```

Ingest documents from the MinIO `documents` bucket into the vector database.

- If `object_keys` is `null` or omitted, all documents in the bucket are ingested.
- Each document is split into chunks with metadata:
  `source_key`, `document_index`, `creator_user_id`, `document_group_id`.

**Response:**
```json
{
  "chunk_count": 42,
  "ingested_documents": ["doc1.txt", "doc2.pdf"]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/ingest \
  -H "Content-Type: application/json" \
  -d '{"object_keys": null}'
```

### Ask a Question

```
POST /ask
Content-Type: application/json

{
  "question": "What is the company's policy on remote work?",
  "user_id": "user-uuid",
  "user_group_ids": ["group-a", "group-b"] | null
}
```

Retrieve relevant document chunks and generate an answer.

- A chunk is readable if the querying `user_id` is the creator OR the chunk's
  `document_group_id` is present in the querying `user_group_ids`.
- The generation response includes retrieved sources for transparency.

**Response:**
```json
{
  "answer": "Based on the company policy...",
  "sources": [
    {
      "content": "...",
      "source_key": "policies.txt",
      "document_index": 0,
      "creator_user_id": "user-uuid",
      "document_group_id": "group-a"
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the company policy?",
    "user_id": "user-uuid",
    "user_group_ids": ["group-a"]
  }'
```

## Configuration

Environment variables (from `.env`):

```bash
# API Server
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=5000
ENVIRONMENT=development

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=<your-key>
MINIO_SECRET_KEY=<your-secret>
MINIO_SECURE=false
MINIO_DOCUMENTS_BUCKET=documents

# Vector Database (Postgres + pgvector)
VECTOR_DB_TYPE=pgvector
PGVECTOR_HOST=postgres
PGVECTOR_PORT=5432
PGVECTOR_USER=postgres
PGVECTOR_PASSWORD=postgres
PGVECTOR_DB=postgresdb
PGVECTOR_COLLECTION=archie_documents

# Embedding Model
EMBEDDING_MODEL=BAAI/bge-m3
CHUNK_SIZE=512
CHUNK_OVERLAP=50
RETRIEVAL_TOP_K=5

# Claude (LangChain)
ANTHROPIC_API_KEY=<your-anthropic-api-key>
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_TEMPERATURE=0.2

```

## Running Locally

### 1. Install dependencies

```bash
cd backend/ai-service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

### 2. Run the server

```bash
python main.py
```

The server will start on `http://0.0.0.0:5000`.

### 3. Or with Docker Compose

```bash
docker-compose up ai-service
```

## Docker Build

```bash
cd backend/ai-service
docker build -t archie-ai-service:latest .
```

## Integration with Nest Server

From the Nest backend, call the ai-service endpoints:

```typescript
// Example: Ingest documents
const response = await fetch('http://ai-service:5000/ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ object_keys: null })
});

// Example: Ask a question
const response = await fetch('http://ai-service:5000/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'What is the policy?',
    user_id: 'user-uuid',
    user_group_ids: ['group-a']
  })
});
const data = await response.json();
console.log(data.answer);
```

When running in Docker Compose, use the container name `ai-service` as the hostname (internal network DNS resolution).

## Development

### Testing

```bash
pytest tests/
```

### Linting

```bash
ruff check .
mypy .
```

## Implementation Status

- [ ] MinIO adapter (`src/storage/minio.py`)
- [ ] Document ingestion (`src/ingestion/service.py`)
- [ ] Vector store adapter (`src/vector_store/adapter.py`)
- [ ] Permission-aware retrieval (`src/retrieval/service.py`)
- [ ] Answer generation (`src/generation/generator.py`)
- [ ] Service orchestration (`src/core/service.py`)
- [ ] FastAPI routes (`src/api/routes.py`, `src/app.py`, `main.py`)
