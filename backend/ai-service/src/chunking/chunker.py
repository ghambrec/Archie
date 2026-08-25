from __future__ import annotations

from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.config import settings

splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.chunk_size_chars,
    chunk_overlap=settings.chunk_overlap_chars,
)


def chunk_text(text: str) -> list[str]:
    return splitter.split_text(text)
