"""API routes for the AI Service."""

from fastapi import APIRouter, HTTPException, Request
from uuid import UUID

from src.ingestion import status

router = APIRouter()


@router.get("/health", tags=["app"])
async def health_check():
    """health check - checks for server running"""
    return {"status": "ok"}


@router.get("/ready", tags=["app"])
async def ready_check(request: Request):
    """ready check - checks for connection to database ready"""
    pool = request.app.state.db_pool
    try:
        await pool.fetchval("SELECT 1")
    except Exception as ex:
        raise HTTPException(status_code=503, detail="database unavailable") from ex
    return {"status": "ok"}


@router.post("/ingest/{doc_id}", status_code=202, tags=["queue"], summary="Queue document ingestion")
async def ingest(doc_id: UUID, request: Request):
    """add ingestion job to queue"""
    pool = request.app.state.db_pool
    await status.init_db_entry(pool, doc_id)
    await request.app.state.arq_pool.enqueue_job("ingest_job", doc_id)
