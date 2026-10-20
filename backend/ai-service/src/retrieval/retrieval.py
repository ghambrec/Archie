from src.config import settings
from src.embedding.embedder import embed
from pgvector import Vector
from src.generation.generator import generate
from src.generation.schemas import AnswerResponse, GeneratedAnswer, SourceCitation


from uuid import UUID
import asyncpg

import logging

async def retrieval(user_id: UUID,
					conv_id: UUID, 
					question: str, 
					pool: asyncpg.Pool, 
					result_limit: int = settings.limit,
					context_budget: int = settings.context_budget 
					) -> AnswerResponse :
	try:
		message_history = await load_conversation_messages(pool, conv_id)

		question_embedding = await embed(question)
		#logging.debug(f"vector: {question_embedding}")

		logging.debug( f"embedding dimensions: {len(question_embedding)}")
		
		chunks = await search_chunks(pool,
							   user_id=user_id,
							   question_embedding=question_embedding,
	
							   limit= result_limit)
		
		context, context_chunks = build_context(chunks, context_budget)

		answer = await generate(question,
						context,
						message_history)
	except Exception:
		logging.exception("embedding, question, and context failed")
		raise
	
	return enrich_answer(answer, context_chunks)
	

async def load_conversation_messages(pool: asyncpg.Pool, conv_id: UUID) -> list[asyncpg.Record]:


	previous_messages = await pool.fetch(
                    """select am.sender , am."content" 
                    from ai_messages am 
                    where am.conv_id=$1
                    order by am.created_at
                    """, conv_id,
                )
	
	for record in previous_messages:
		logging.debug(dict(record))
	return previous_messages


async def search_chunks(pool: asyncpg.Pool,
                        user_id: UUID, 
                        question_embedding: list[asyncpg.Record], 
						limit:int) ->list[asyncpg.Record]:

	query = """
				select 
					ac.ai_document_id,
					ac.id,
					d.filename as document_name,
					ac."content",
					ac."token_count",
					ac.embedding <=> $1 as distance
				from ai_chunks ac
				join documents d on 
					d.id = ac.ai_document_id
				where ac.ai_document_id in (
					select
						distinct d.id 
					from documents d 
					inner join document_groups dg on 
						d.id = dg.document_id 
					inner join user_groups ug on 
						ug.group_id = dg.group_id 
					inner join user_permission up on 
						up.user_id = ug.user_id AND up.group_id = dg.group_id
					inner join permissions p on 
						up.permission_id = p.id 
					where
						d.deleted_at is null
						and p.perm_key = 'documents.read'
						and ug.user_id = $2
				)
				order by ac.embedding <=> $1
				limit $3
				"""
	
	rows = await pool.fetch(query, Vector(question_embedding), user_id, limit)
	logging.debug("Retrieved %d chunks ", len(rows))
	return rows

def build_context(chunks: list[asyncpg.Record], context_budget: int) -> tuple[str, list[asyncpg.Record]]:
	"""
	Return the context and exactly the chunks included within its token budget.

	"""
	used_tokens = 0
	selected = []
	context_chunks = []

	for row in chunks:
		chunked_tokens = row["token_count"]
		logging.debug("chunked tokens =%d", chunked_tokens)
		logging.debug("row=%s", row["content"])
		if used_tokens + chunked_tokens <= context_budget:
			used_tokens += chunked_tokens
			context_chunks.append(row)
			selected.append(
				f"Chunk_Id: {row['id']}\n"
				f"Content: {row['content']}"
				)

	context ="\n\n".join(selected)

	return context, context_chunks

def enrich_answer(answer: GeneratedAnswer, context_chunks: list[asyncpg.Record]) -> AnswerResponse:
    """Resolve filenames from database records; omit unknown or repeated citations."""
    chunks_by_id = {row["id"]: row for row in context_chunks}
    sources = []
    seen = set()
    for citation in answer.sources:
        chunk = chunks_by_id.get(citation.chunk_Id)
        if chunk is None or citation.chunk_Id in seen:
            continue
        seen.add(citation.chunk_Id)
        sources.append(SourceCitation(
            chunk_Id=chunk["id"],
            document_id=chunk["ai_document_id"],
            document_name=chunk["document_name"],
            similarity_score=1.0 - float(chunk["distance"]),
        ))
    return AnswerResponse(
        answer=answer.answer,
        confidence_score=answer.confidence_score,
        sources=sources,
    )
