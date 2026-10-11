CREATE TABLE IF NOT EXISTS ai_documents (
	id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
	status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'FINISHED', 'FAILED', 'SKIPPED')),
	ai_summary TEXT,
	language VARCHAR(10),
	error_key TEXT,
	error_detail TEXT,
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

CREATE INDEX IF NOT EXISTS ai_chunks_ai_document_id_idx ON ai_chunks (ai_document_id);
CREATE INDEX IF NOT EXISTS ai_chunks_embedding_hnsw_idx ON ai_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS ai_document_tags (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	ai_document_id UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
	ai_tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
	proposed_name VARCHAR(100),
	proposed_description VARCHAR(500),
	proposed_facet VARCHAR(16) CHECK (proposed_facet IN ('domain', 'doctype')),
	proposed_parent_id UUID REFERENCES tags(id) ON DELETE SET NULL,
	confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT ai_document_tags_tag_exists_or_proposal CHECK (
		(ai_tag_id IS NOT NULL AND proposed_name IS NULL)
		OR (ai_tag_id IS NULL AND proposed_name IS NOT NULL)
	)
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_document_tags_unique_tag ON ai_document_tags (ai_document_id, COALESCE(ai_tag_id::text, proposed_name));

CREATE INDEX IF NOT EXISTS ai_document_tags_idx ON ai_document_tags (ai_document_id);



CREATE TABLE IF NOT EXISTS ai_conversations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title varchar(255),
	updated_at timestamptz NOT NULL DEFAULT now(),
	created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON ai_conversations (user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	conv_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
	sender varchar(10) NOT NULL CHECK (sender IN ('user', 'llm')),
	"content" text NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_messages_conversation_id_idx ON ai_messages(conv_id);

CREATE TABLE IF NOT EXISTS ai_message_sources (
	message_id uuid NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
	chunk_id uuid NOT NULL REFERENCES ai_chunks(id) ON DELETE CASCADE,
	similiary_score REAL,
	PRIMARY KEY(message_id, chunk_id)
);
