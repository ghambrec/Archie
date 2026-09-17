from src.config import settings
from src.embedding.embedder import embed
from pgvector import Vector
from src.generation.generator import generate

from uuid import UUID
import asyncpg

import logging

async def retrieval(user_id: UUID, conv_id: UUID, question: str, pool: asyncpg.Pool ) -> str :
	question_embedding = await embed(question)

	logging.info( f"embedding dimensions: {len(question_embedding)}")
	#user_doc = await 
	query = """
			select 
			ac.id,
			ac.ai_document_id,
			ac."content",
			ac."token_count",
			ac.embedding <=> $1 as distance 
			from ai_chunks ac 
			join ai_documents ad 
				on ad.id = ac.ai_document_id 
			order by ac.embedding <=> $1
			Limit 5
			"""
	rows = await pool.fetch(query, Vector(question_embedding))
	logging.info("Retrieved %d chunks ", len(rows))

	context_budget = 2000
	used_tokens = 0
	selected =[]

	for row in rows:
		chunked_tokens = row["token_count"]
		logging.info("chunked tokens =%d", chunked_tokens)
		logging.info("row=%s", row["content"])


		if used_tokens + chunked_tokens <= context_budget:
			used_tokens += chunked_tokens
			selected.append(row["content"])

	#context="make the last letter of each Word to a CapitalLetter "
	context ="\n\n".join(selected)
	answer = await generate(question, context)
	return answer




