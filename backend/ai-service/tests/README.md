# AI Service Smoke Test

Run the end-to-end bootstrap smoke test from the repository root:

```bash
bash backend/ai-service/tests/smoke_rag.sh
```

The script is re-runnable:

- if `rag@example.com` already exists, it logs in and continues
- if the smoke-test document already exists for that user, it reuses it
- if chunks for that document already exist in pgvector, it skips `/ingest`

Default test credentials:

- email: `rag@example.com`
- password: `password123`
- displayName: `rag`

Default service URLs:

- Nest: `http://localhost:3000`
- ai-service: `http://localhost:5001`

Optional overrides:

```bash
AI_BASE_URL=http://localhost:5001 \
NEST_BASE_URL=http://localhost:3000 \
TEST_EMAIL=rag@example.com \
TEST_PASSWORD=password123 \
TEST_DISPLAY_NAME=rag \
bash backend/ai-service/tests/smoke_rag.sh
```
