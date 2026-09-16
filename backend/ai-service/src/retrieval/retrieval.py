from src.config import settings
from src.embedding.embedder import embed

from uuid import UUID
import asyncpg

import logging

async def retrieval(user_id: UUID, conv_id: UUID, question: str, pool: asyncpg.Pool ) -> str :
	question_embedding = await embed(question)

	logging.info( f"tokens: {len(question_embedding)}")
	#user_doc = await 


