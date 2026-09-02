from __future__ import annotations

import logging

from langfuse import get_client
from pydantic_ai import Agent

from src.config import settings

logger = logging.getLogger(__name__)


def setup_langfuse_client() -> None:
    if not settings.langfuse_enabled:
        logger.info("Langfuse disabled")
        return

    client = get_client()
    if not client.auth_check():
        logger.error("Langfuse auth check failed")
        return

    logger.info("Langfuse connected")
    Agent.instrument_all()
