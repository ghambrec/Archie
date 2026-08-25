"""API routes for the AI Service."""

from fastapi import APIRouter, Request
from uuid import UUID

from src.ingestion import status

router = APIRouter()


@router.post("/ingest/{doc_id}", status_code=202, tags=["queue"], summary="Queue document ingestion")
async def ingest(doc_id: UUID, request: Request):
    """add ingestion job to queue"""
    pool = request.app.state.db_pool
    await status.init_db_entry(pool, doc_id)
    await request.app.state.arq_pool.enqueue_job("ingest_job", doc_id)
