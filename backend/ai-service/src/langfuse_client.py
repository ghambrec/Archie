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

    try:
        client = get_client()
        if not client.auth_check():
            logger.warning("Langfuse auth check failed; continuing without instrumentation")
            return

        Agent.instrument_all()
    except Exception:
        logger.warning(
            "Langfuse initialization failed; continuing without instrumentation. "
            "Check the Langfuse endpoint and container DNS/network connectivity.",
            exc_info=True,
        )
        return

    logger.info("Langfuse connected")
