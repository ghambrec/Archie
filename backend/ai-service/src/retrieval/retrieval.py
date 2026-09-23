from src.config import settings
from src.embedding.embedder import embed
from pgvector import Vector
from src.generation.generator import generate
import exception

from uuid import UUID
import asyncpg

import logging

async def retrieval(user_id: UUID,
					conv_id: UUID, 
					question: str, 
					pool: asyncpg.Pool, 
					document_id: UUID | None = None,
					result_limit: int = settings.limit,
					context_budget: int = settings.context_budget 
					) -> str :
	try:
		message_history = await load_conversation_messages(pool, conv_id)

		question_embedding = await embed(question)

		logging.debug( f"embedding dimensions: {len(question_embedding)}")
		
		chunks = await search_chunks(pool,
							   user_id=user_id,
							   question_embedding=question_embedding,
							   document_id= document_id,
							   result_limit= result_limit)
		
		context = build_context(chunks, context_budget)

		answer = await generate(question,
						context,
						message_history)
	except Exception:
		logging.exception("embedding, question, and context failed")
		raise
	
	return answer
	



def load_conversation_messages(pool: asyncpg.Pool, conv_id: UUID) -> str:


	previous_messages = pool.fetch(
                    """select am.sender , am."content" 
                    from ai_messages am 
                    where am.conv_id=$1
                    order by am.created_at
                    """, conv_id,
                )
	return previous_messages


def search_chunks(pool: asyncpg.Pool ,user_id: UUID, question_embedding: str, document_id: str, limit:int) -> str:

	query = """
				select 
					ac.ai_document_id,
					ac."content",
					ac."token_count",
					ac.embedding <=> $1 as distance
				from ai_chunks ac
				where ac.ai_document_id in (
					select
						distinct d.id 
					from documents d 
					inner join document_groups dg on 
						d.id = dg.document_id 
					inner join user_groups ug on 
						ug.group_id = dg.group_id 
					inner join user_permission up on 
						up.user_id = ug.user_id 
					inner join permissions p on 
						up.permission_id = p.id 
					where
						d.deleted_at is null
						and p.perm_key = 'documents.read'
						and ug.user_id = $2
				)
				order by ac.embedding <=> $1
				limit 50
				"""
	
	rows = pool.fetch(query, Vector(question_embedding), user_id)
	logging.debug("Retrieved %d chunks ", len(rows))

def build_context(chunks: str , context_budget: int)-> str:
	context_budget = 2000
	used_tokens = 0
	selected =[]

	for row in chunks:
		chunked_tokens = row["token_count"]
		logging.debug("chunked tokens =%d", chunked_tokens)
		logging.debug("row=%s", row["content"])
		if used_tokens + chunked_tokens <= context_budget:
			used_tokens += chunked_tokens
			selected.append(row["content"])

	context ="\n\n".join(selected)

	return context
	