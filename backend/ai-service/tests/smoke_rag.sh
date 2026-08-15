#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

AI_BASE_URL="${AI_BASE_URL:-http://localhost:5001}"
NEST_BASE_URL="${NEST_BASE_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-rag@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-password123}"
TEST_DISPLAY_NAME="${TEST_DISPLAY_NAME:-rag}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/archie-rag-cookies.txt}"
TEST_FILE="${TEST_FILE:-/tmp/archie-rag-test.txt}"
TEST_FILENAME="${TEST_FILENAME:-archie-rag-test.txt}"
REGISTER_RESPONSE_FILE="${REGISTER_RESPONSE_FILE:-/tmp/archie-rag-register.json}"

if [[ -f "$REPO_ROOT/env/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/env/.env"
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-postgresdb}"
PGVECTOR_COLLECTION="${PGVECTOR_COLLECTION:-archie_documents}"

cleanup() {
  rm -f "$COOKIE_JAR" "$TEST_FILE" "$REGISTER_RESPONSE_FILE"
}

trap cleanup EXIT

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempt=0

  until curl -fsS "$url" >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [[ "$attempt" -ge 60 ]]; then
      echo "Timed out waiting for $label at $url" >&2
      exit 1
    fi
    sleep 2
  done
}

json_field() {
  local field="$1"
  python3 -c '
import json
import sys

field = sys.argv[1]
payload = json.load(sys.stdin)
value = payload
for part in field.split("."):
    if isinstance(value, dict):
        value = value[part]
    else:
        raise KeyError(part)
if isinstance(value, (dict, list)):
    print(json.dumps(value))
else:
    print(value)
' "$field"
}

sql_scalar() {
  local query="$1"
  (
    cd "$REPO_ROOT"
    docker compose exec -T postgres \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atqc "$query"
  )
}

echo "Waiting for Nest server..."
wait_for_url "$NEST_BASE_URL/" "Nest server"

echo "Waiting for ai-service..."
wait_for_url "$AI_BASE_URL/health" "ai-service"

cat >"$TEST_FILE" <<'EOF'
Archie RAG smoke test document.

This document exists to validate upload, ingestion, retrieval, and answer generation.
EOF

echo "Registering test user (safe to fail if already exists)..."
register_status="$(
  curl -sS -o "$REGISTER_RESPONSE_FILE" -w "%{http_code}" \
    -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"displayName\":\"$TEST_DISPLAY_NAME\"}" \
    "$NEST_BASE_URL/auth/register"
)"
if [[ "$register_status" != "201" && "$register_status" != "200" && "$register_status" != "409" ]]; then
  echo "Registration failed with status $register_status" >&2
  cat "$REGISTER_RESPONSE_FILE" >&2
  exit 1
fi

echo "Logging in test user..."
login_response="$(
  curl -sS \
    -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    "$NEST_BASE_URL/auth/login"
)"
user_id="$(printf '%s' "$login_response" | json_field id)"
echo "Logged in as user: $user_id"

echo "Checking for existing smoke-test document..."
existing_document="$(
  sql_scalar "
    SELECT id || '|' || object_key
    FROM documents
    WHERE uploaded_by = '$user_id'
      AND filename = '$TEST_FILENAME'
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
  "
)"

if [[ -n "$existing_document" ]]; then
  document_id="${existing_document%%|*}"
  object_key="${existing_document#*|}"
  echo "Reusing existing document: $document_id"
  echo "Object key: $object_key"
else
  echo "Uploading test document..."
  upload_response="$(
    curl -sS \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
      -F "file=@$TEST_FILE;filename=$TEST_FILENAME" \
      "$NEST_BASE_URL/documents/upload"
  )"
  document_id="$(printf '%s' "$upload_response" | json_field id)"
  object_key="$(printf '%s' "$upload_response" | json_field objectKey)"
  echo "Uploaded document: $document_id"
  echo "Object key: $object_key"
fi

existing_chunk_count="$(
  sql_scalar "
    SELECT COUNT(*)
    FROM document_chunks
    WHERE collection_name = '$PGVECTOR_COLLECTION'
      AND metadata_json->>'source_key' = '$object_key';
  "
)"
existing_chunk_count="${existing_chunk_count:-0}"

if [[ "$existing_chunk_count" =~ ^[0-9]+$ ]] && (( existing_chunk_count > 0 )); then
  chunk_count="$existing_chunk_count"
  echo "Skipping ingest; found $chunk_count existing chunks for $object_key"
else
  echo "Ingesting uploaded document..."
  ingest_response="$(
    curl -sS \
      -H "Content-Type: application/json" \
      -d "{\"object_keys\":[\"$object_key\"]}" \
      "$AI_BASE_URL/ingest"
  )"
  chunk_count="$(printf '%s' "$ingest_response" | json_field chunk_count)"
  echo "Ingested chunks: $chunk_count"
fi

echo "Retrieving authorized chunks..."
retrieve_response="$(
  curl -sS \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"What is this document for?\",\"user_id\":\"$user_id\",\"user_group_ids\":[]}" \
    "$AI_BASE_URL/retrieve"
)"
retrieve_count="$(printf '%s' "$retrieve_response" | json_field count)"
echo "Retrieve result count: $retrieve_count"

echo "Asking question through /ask..."
ask_response="$(
  curl -sS \
    -H "Content-Type: application/json" \
    -d "{\"question\":\"What is this document for?\",\"user_id\":\"$user_id\",\"user_group_ids\":[]}" \
    "$AI_BASE_URL/ask"
)"
answer="$(printf '%s' "$ask_response" | json_field answer)"
echo "Answer:"
printf '%s\n' "$answer"

echo
echo "Smoke test completed successfully."
