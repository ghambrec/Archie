"""Answer generation service."""

from __future__ import annotations

from typing import Iterable

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate


class GenerationService:
    """Generate answers from retrieved context chunks."""

    def __init__(self, model_client):
        if model_client is None:
            raise ValueError("GenerationService requires a configured LangChain model client.")
        self.model_client = model_client
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are Archie AI. Answer strictly using the provided authorized context. "
                    "If the context does not contain the answer, say you do not have enough "
                    "authorized information.",
                ),
                (
                    "human",
                    "Authorized context:\n{context}\n\nQuestion: {question}",
                ),
            ]
        )
        self.chain = self.prompt | self.model_client | StrOutputParser()

    async def generate(self, question: str, context_chunks: Iterable[dict]) -> str:
        """Run a LangChain prompt->model->parser chain for response generation."""
        chunks = list(context_chunks)
        if not chunks:
            return "No authorized context was found for this question."
        return await self.chain.ainvoke(
            {
                "context": self._format_context(chunks),
                "question": question,
            }
        )

    def build_prompt(self, question: str, context_chunks: Iterable[dict]) -> str:
        """Create a rendered prompt text for debugging/inspection."""
        context = self._format_context(context_chunks)
        return (
            "Authorized context:\n"
            f"{context}\n\n"
            f"Question: {question}\n"
        )

    def _format_context(self, context_chunks: Iterable[dict]) -> str:
        """Format retrieved chunks into a prompt-friendly context block."""
        sections: list[str] = []
        for index, chunk in enumerate(context_chunks, start=1):
            metadata = chunk.get("metadata") or {}
            source_key = metadata.get("source_key", "unknown")
            document_index = metadata.get("document_index", "unknown")
            sections.append(
                f"[Source {index} | document_index={document_index} | source_key={source_key}]\n"
                f"{chunk.get('content', '')}"
            )

        if not sections:
            return "No authorized context available."

        return "\n\n".join(sections)
