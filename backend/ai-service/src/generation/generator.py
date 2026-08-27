"""Answer generation service."""

from __future__ import annotations

from pydantic_ai import Agent

from src.generation.model import build_model

# SYSTEM_PROMPT = "You are Archie AI. Answer strictly using the provided authorized context. If the context does not contain the answer, say you do not have enough authorized information."
SYSTEM_PROMPT = "You are a helpful assistant"


model = build_model()
agent = Agent(model, system_prompt=SYSTEM_PROMPT)


async def generate(question: str) -> str:
    result = await agent.run(question)
    return result.output


if __name__ == "__main__":
    import asyncio

    answer = asyncio.run(generate("Do you know the 42 ecole?"))
    print(answer)

# uv run python -m src.generation.generator
