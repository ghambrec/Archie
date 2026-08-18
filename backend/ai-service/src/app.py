"""FastAPI application and route definitions."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.routes import router as api_router

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
	"""Initialize and cleanup on app startup/shutdown."""
	logger.info("AI Service starting up")
	try:
		yield
	finally:
		logger.info("AI Service shutting down")

app = FastAPI(
	title="Archie AI Service",
	description="API documentation for the Documents System AI Service backend",
	lifespan=lifespan,
)

app.include_router(api_router)
