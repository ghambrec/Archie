from __future__ import annotations

from typing import TypeVar

from pydantic import BaseModel
from pydantic_ai import NativeOutput
from pydantic_ai.models.ollama import OllamaModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider

from src.config import settings

T = TypeVar("T", bound=BaseModel)


def build_model() -> OpenAIChatModel:
    if settings.llm_provider == "openrouter":
        return OpenAIChatModel(
            settings.openrouter_generation_model,
            provider=OpenAIProvider(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.openrouter_api_key,
            ),
        )
    return OllamaModel(
        settings.ollama_generation_model,
        provider=OllamaProvider(base_url=f"{settings.ollama_host}/v1")
    )


def get_output_type(output_model: type[T]) -> NativeOutput[T] | type[T]:
    if settings.llm_provider == "ollama":
        return NativeOutput(output_model)
    return output_model
