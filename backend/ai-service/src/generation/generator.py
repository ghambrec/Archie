"""Answer generation service."""

from __future__ import annotations

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

# from src.config import settings
from config_tmp import settings

# SYSTEM_PROMPT = "You are Archie AI. Answer strictly using the provided authorized context. If the context does not contain the answer, say you do not have enough authorized information."
SYSTEM_PROMPT = "You are a helpful assistant"


def _build_model() -> OpenAIChatModel:
    if settings.llm_provider == "openrouter":
        return OpenAIChatModel(
            settings.openrouter_generation_model,
            provider=OpenAIProvider(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.openrouter_api_key,
            ),
        )
    return OpenAIChatModel(
        settings.ollama_generation_model,
        provider=OpenAIProvider(
            base_url=f"{settings.ollama_host}/v1", api_key="ollama"
        ),
    )


model = _build_model()
agent = Agent(model, system_prompt=SYSTEM_PROMPT)


async def generate(question: str) -> str:
    result = await agent.run(question)
    return result.output


if __name__ == "__main__":
    import asyncio

    answer = asyncio.run(generate("Do you know the 42 ecole?"))
    print(answer)

# uv run python src/generation/generator.py
