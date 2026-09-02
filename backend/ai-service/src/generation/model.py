from __future__ import annotations

from typing import TypeVar

import logging

from pydantic import BaseModel
from pydantic_ai import NativeOutput

from pydantic_ai.models.openai import OpenAIChatModel

from pydantic_ai.models.ollama import OllamaModel
from pydantic_ai.providers.ollama import OllamaProvider

from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider

from src.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def build_model() -> OpenAIChatModel:
    if settings.llm_provider == "openrouter":
        logger.info("LLM Provider: OpenRouter")
        return OpenRouterModel(
            settings.openrouter_generation_model,
            provider=OpenRouterProvider(api_key=settings.openrouter_api_key)
        )
    logger.info("LLM Provider: Ollama")
    return OllamaModel(
        settings.ollama_generation_model,
        provider=OllamaProvider(base_url=f"{settings.ollama_host}/v1")
    )


def get_output_type(output_model: type[T]) -> NativeOutput[T] | type[T]:
    if settings.llm_provider == "ollama":
        return NativeOutput(output_model)
    return output_model


def get_max_input_chars() -> int:
    if settings.llm_provider == "ollama":
        return settings.analyzer_max_chars_ollama
    return settings.analyzer_max_chars_openrouter
