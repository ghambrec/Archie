"""Main entry point for the AI Service."""

import logging
# from src.app import app
from src.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn

    logger.info(
        f"Starting AI Service on port {settings.ai_service_port}"
    )
    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",
        port=settings.ai_service_port,
        reload=True,
    )

# run with:
# uv run python main.py