CREATE TABLE IF NOT EXISTS ai_documents (
	id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
	status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
	ai_summary TEXT,
	language VARCHAR(10),
	error_msg TEXT,
	retry_count SMALLINT NOT NULL DEFAULT 0,
	processed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chunks (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	ai_document_id UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
	chunk_index INTEGER NOT NULL,
	content TEXT NOT NULL,
	embedding VECTOR(1024) NOT NULL,
	token_count INTEGER NOT NULL,
	page_number INTEGER,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (ai_document_id, chunk_index)
);

CREATE INDEX ai_chunks_ai_document_id_idx ON ai_chunks (ai_document_id);
CREATE INDEX ai_chunks_embedding_hnsw_idx ON ai_chunks USING hnsw (embedding vector_cosine_ops);

-- CREATE TABLE IF NOT EXISTS ai_tags (
-- 	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- 	name VARCHAR(100) NOT NULL UNIQUE,
-- 	label VARCHAR(150) NOT NULL,
-- 	description VARCHAR(500),
-- 	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

-- CREATE TABLE IF NOT EXISTS ai_document_tags (
-- 	ai_document_id UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
-- 	ai_tag_id UUID NOT NULL REFERENCES ai_tags(id) ON DELETE CASCADE,
-- 	confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
-- 	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
-- 	PRIMARY KEY (ai_document_id, ai_tag_id)
-- );
