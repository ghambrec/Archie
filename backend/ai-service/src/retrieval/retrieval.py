from src.config import settings
from src.embedding.embedder import embed

from uuid import UUID
import asyncpg

import logging

async def retrieval(conv_id: UUID, question: str, pool: asyncpg.Pool ) -> str :
	question_embedding = await embed(question)

	logging.debug( f"tokens: {len(question_embedding)}")
	#user_doc = await 


