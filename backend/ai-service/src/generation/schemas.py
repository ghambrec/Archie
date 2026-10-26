"""Separate model-generated citations from database-enriched API sources."""

from uuid import UUID
from typing import Annotated, Literal

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
    similarity_score: float | None = None


class AnswerResponse(BaseModel):
    answer: str
    confidence_score: float = Field(ge=0, le=1)
    sources: list[SourceCitation]


# The streaming endpoint will emit snapshots, and complete only after DB commit.


class ChatStreamStatus(BaseModel):
    type: Literal['status'] = 'status'
    stage: Literal['retrieving', 'generating', 'saving']


class ChatStreamAnswer(BaseModel):
    type: Literal['answer'] = 'answer'
    text: str


class ChatStreamComplete(BaseModel):
    type: Literal['complete'] = 'complete'
    messageId: UUID
    result: AnswerResponse


class ChatStreamError(BaseModel):
    type: Literal['error'] = 'error'
    code: str
    retryable: bool = False
    retryAfterSeconds: int | None = Field(default=None, ge=0)


ChatStreamEvent = Annotated[
    ChatStreamStatus | ChatStreamAnswer | ChatStreamComplete | ChatStreamError,
    Field(discriminator='type'),
]
