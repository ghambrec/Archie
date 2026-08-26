from fastapi import APIRouter, HTTPException, Request

router = APIRouter(tags=["app"])


@router.get("/health")
async def health_check():
    """health check - checks for server running"""
    return {"status": "ok"}


@router.get("/ready")
async def ready_check(request: Request):
    """ready check - checks for connection to database ready"""
    pool = request.app.state.db_pool
    try:
        await pool.fetchval("SELECT 1")
    except Exception as ex:
        raise HTTPException(status_code=503, detail="database unavailable") from ex
    return {"status": "ok"}
