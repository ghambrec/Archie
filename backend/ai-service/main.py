from fastapi import FastAPI, Request
from config import settings
from db import lifespan

app = FastAPI(title="AI Service",lifespan=lifespan)


@app.get("/health")
async def health(request: Request) -> dict[str, str]:
	pool = request.app.state.db_pool
	result = await pool.fetchval("SELECT 1;")
	db_status = "reachable" if result == 1 else "unreachable"
	return {"status": "healthy", "db": db_status}


# start with:
# uv run uvicorn main:app --reload --port 8000
