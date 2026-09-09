"""conversation routes for the AI Service."""

from fastapi import APIRouter, Request, Security, Depends, HTTPException
from uuid import UUID
from pydantic import BaseModel, Field

from src.api.auth import check_api_key, get_user_id
from src.conversations import conversations


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=100, examples=["ask your question here"])


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


@router.post("/conversations/{conv_id}/ask", summary="ask a question to a conversation from a user")
async def ask(request: Request, body: AskRequest, conv_id: UUID, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    try:
        content = await conversations.ask_question(pool, user_id, conv_id, body.question)
    except conversations.UserNotFoundError:
        raise HTTPException(status_code=400, detail="user does not exist")
    except conversations.ConversationNotFoundError:
        raise HTTPException(status_code=400, detail="conversation for given user not found")
    return content


@router.get("/conversations/{conv_id}/messages", summary="get all messages to a conversation from a user")
async def get_messages(request: Request, conv_id: UUID, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    # TODO


@router.delete("/conversations", status_code=204, summary="delete all conversations from a user")
async def del_conversations(request: Request, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    await conversations.del_conversations(pool, user_id)


@router.delete("/conversations/{conv_id}", status_code=204, summary="delete a single conversation from a user")
async def del_conversation(request: Request, conv_id: UUID, user_id: UUID = Depends(get_user_id)):
    pool = request.app.state.db_pool
    await conversations.del_conversation(pool, user_id, conv_id)
