"""conversation routes for the AI Service."""

from fastapi import APIRouter, Request, Security, Depends, HTTPException
from uuid import UUID
from pydantic import BaseModel, Field, StringConstraints
from typing import Annotated

from src.api.auth import check_api_key, get_user_id
from src.conversations import conversations
from src.generation.schemas import AnswerResponse

import logging
from src.config import settings
from src.conversations.errors import classify_chat_error
from src.conversations.lifecycle import run_chat_request


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000, examples=["ask your question here"])

class PatchRequest(BaseModel):
    title: Annotated[
            str, 
            StringConstraints(strip_whitespace=True, min_length=1, max_length= 254)
            ] = Field (examples= ["Untilted chat"])


router = APIRouter(tags=["conversations"], dependencies=[Security(check_api_key)])


@router.post("/conversations", status_code=201, summary="create a new conversation for a user")
async def create_conversation(request: Request, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    try:
        conversation_id = await conversations.create_conversation(pool, user_id)
    except conversations.UserNotFoundError:
        raise HTTPException(status_code=400, detail="user does not exist")
    return {"id": conversation_id}


@router.get("/conversations", summary="get all conversations from a user")
async def get_conversations(request: Request, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    rows = await conversations.get_conversations(pool, user_id)
    return {"count": len(rows), "data": rows}


@router.post("/conversations/{conv_id}/ask", response_model=AnswerResponse, summary="ask a question to a conversation from a user")
async def ask(request: Request, body: AskRequest, conv_id: UUID, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    try:
        content = await run_chat_request(
            conversations.ask_question(pool, user_id, conv_id, body.question),
            request.is_disconnected,
            timeout_seconds=settings.chat_timeout_seconds,
        )
    except conversations.UserNotFoundError:
        raise HTTPException(status_code=400, detail="user does not exist")
    except conversations.ConversationNotFoundError:
        raise HTTPException(status_code=404, detail={"code": "AI_CONVERSATION_NOT_FOUND", "retryable": False})
    except Exception as error:
        failure = classify_chat_error(error)
        logging.getLogger(__name__).warning("Chat request failed: %s", failure.code)
        headers = {"Retry-After": str(failure.retry_after_seconds)} if failure.retry_after_seconds is not None else None
        raise HTTPException(status_code=failure.status, detail=failure.payload(), headers=headers) from error
    return content


@router.get("/conversations/{conv_id}/messages", summary="get all messages to a conversation from a user")
async def get_messages(request: Request, conv_id: UUID, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    rows = await conversations.get_messages(pool, user_id, conv_id)
    return {"count": len(rows), "data": rows}


@router.delete("/conversations", status_code=204, summary="delete all conversations from a user")
async def del_conversations(request: Request, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    await conversations.del_conversations(pool, user_id)


@router.delete("/conversations/{conv_id}", status_code=204, summary="delete a single conversation from a user")
async def del_conversation(request: Request, conv_id: UUID, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    await conversations.del_conversation(pool, user_id, conv_id)

@router.patch("/conversations/{conv_id}/", summary="rename title of a conversation")
async def patch_conversations(request: Request, body: PatchRequest, conv_id: UUID, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    try:
        conversation = await conversations.patch_conversation(pool, user_id, conv_id, body.title)
    except conversations.ConversationNotFoundError:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation