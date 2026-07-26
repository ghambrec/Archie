from contextlib import asynccontextmanager
import asyncpg
from fastapi import FastAPI
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
	pool = await asyncpg.create_pool(dsn=settings.postgres_dsn, min_size=5, max_size=5)
	app.state.db_pool = pool
	yield
	await pool.close()
