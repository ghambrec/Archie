"""Answer generation service."""

from __future__ import annotations

from typing import Iterable


class GenerationService:
    """Generate answers from retrieved context chunks."""

    def __init__(self, model_client):
        self.model_client = model_client

    def generate(self, question: str, context_chunks: Iterable[dict]) -> str:
        """Compose a prompt using relevant chunks and return the generated answer."""
        raise NotImplementedError("generate is not implemented yet")

    def build_prompt(self, question: str, context_chunks: Iterable[dict]) -> str:
        """Create the context + question prompt for the LLM."""
        raise NotImplementedError("build_prompt is not implemented yet")
