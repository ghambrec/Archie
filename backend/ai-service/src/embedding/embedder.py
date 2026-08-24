from __future__ import annotations

from openai import AsyncOpenAI

from src.config import settings

client = AsyncOpenAI(base_url=f"{settings.ollama_host}/v1", api_key="ollama")


async def embed(text: str) -> list[float]:
    response = await client.embeddings.create(
        model=settings.ollama_embedding_model, input=text
    )
    return response.data[0].embedding
