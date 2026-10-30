"""Public chat failures shared by HTTP responses and future stream error events."""
from dataclasses import dataclass
import httpx
from pydantic_ai import UsageLimitExceeded
from pydantic_ai.exceptions import ModelAPIError, ModelHTTPError, UnexpectedModelBehavior


@dataclass
class ChatError(Exception):
    code: str
    status: int
    retryable: bool = False
    retry_after_seconds: int | None = None

    def __str__(self) -> str:
        return self.code

    def payload(self) -> dict:
        return {"code": self.code, "retryable": self.retryable,
                "retryAfterSeconds": self.retry_after_seconds}


def classify_chat_error(error: Exception) -> ChatError:
    if isinstance(error, ChatError):
        return error
    if isinstance(error, UsageLimitExceeded):
        return ChatError('AI_CONTEXT_LIMIT', 422)
    if isinstance(error, (TimeoutError, httpx.TimeoutException)):
        return ChatError('AI_REQUEST_TIMEOUT', 504, True)
    if isinstance(error, ModelHTTPError):
        if error.status_code == 429:
            headers = getattr(error, 'headers', None) or {}
            raw = headers.get('retry-after', '')
            seconds = int(raw) if str(raw).isdigit() else None
            return ChatError('AI_RATE_LIMITED', 429, True, seconds)
        if error.status_code in (408, 504):
            return ChatError('AI_REQUEST_TIMEOUT', 504, True)
        if error.status_code >= 500:
            return ChatError('AI_SERVICE_UNAVAILABLE', 503, True)
    cause = error.__cause__
    while cause is not None and cause is not error:
        if isinstance(cause, (TimeoutError, httpx.TimeoutException)):
            return ChatError('AI_REQUEST_TIMEOUT', 504, True)
        if isinstance(cause, httpx.TransportError):
            return ChatError('AI_SERVICE_UNAVAILABLE', 503, True)
        cause = cause.__cause__
    if isinstance(error, httpx.TransportError):
        return ChatError('AI_SERVICE_UNAVAILABLE', 503, True)
    if isinstance(error, (UnexpectedModelBehavior, ModelAPIError)):
        return ChatError('AI_INVALID_RESPONSE', 502)
    return ChatError('AI_GENERATION_FAILED', 502)
