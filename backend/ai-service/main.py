"""Main entry point for the AI Service."""

import logging

from src.app import app
from src.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


if __name__ == "__main__":
    import uvicorn

    logger.info(
        f"Starting AI Service on {settings.API_HOST}:{settings.API_PORT} "
        f"in {settings.ENVIRONMENT} mode"
    )
    uvicorn.run(
        "src.app:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.ENVIRONMENT == "development",
    )
