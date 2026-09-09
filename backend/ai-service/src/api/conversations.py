"""conversation routes for the AI Service."""

from fastapi import APIRouter, Request, Security, Depends
from uuid import UUID

from src.api.auth import check_api_key, get_user_id
from src.conversations import conversations


router = APIRouter(tags=["conversations"], dependencies=[Security(check_api_key)])


@router.post("/conversations", status_code=201, summary="create a new conversation")
async def create_conversation(request: Request, user_id: UUID = Depends(get_user_id)):
    """create new conversation"""
    pool = request.app.state.db_pool
    conversation_id = await conversations.create_conversation(pool, user_id)
    return {"id": conversation_id}
