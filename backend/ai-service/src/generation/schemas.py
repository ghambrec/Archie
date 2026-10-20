"""Separate model-generated citations from database-enriched API sources."""

from uuid import UUID

from pydantic import BaseModel, Field


class Citations(BaseModel):
    chunk_Id: UUID


class GeneratedAnswer(BaseModel):
    answer: str
    confidence_score: float = Field(ge=0, le=1)
    sources: list[Citations]


class SourceCitation(Citations):
    document_id: UUID
    document_name: str


class AnswerResponse(BaseModel):
    answer: str
    confidence_score: float = Field(ge=0, le=1)
    sources: list[SourceCitation]
