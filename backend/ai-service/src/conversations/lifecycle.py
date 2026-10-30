"""Cancellation boundary reusable by the JSON and future streaming endpoints."""
import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar
from src.conversations.errors import ChatError

T = TypeVar('T')


async def run_chat_request(work: Awaitable[T], is_disconnected: Callable[[], Awaitable[bool]], *, timeout_seconds: float) -> T:
    stopped = asyncio.Event()

    async def watch_disconnect():
        while not stopped.is_set():
            if await is_disconnected():
                return
            await asyncio.sleep(0.25)

    task = asyncio.ensure_future(work)
    watcher = asyncio.create_task(watch_disconnect())
    try:
        async with asyncio.timeout(timeout_seconds):
            done, _ = await asyncio.wait((task, watcher), return_when=asyncio.FIRST_COMPLETED)
            if task in done:
                return await task
            await watcher
            raise ChatError('AI_REQUEST_CANCELLED', 499)
    except TimeoutError as error:
        raise ChatError('AI_REQUEST_TIMEOUT', 504, True) from error
    finally:
        stopped.set()
        for pending in (task, watcher):
            if not pending.done():
                pending.cancel()
        await asyncio.gather(task, watcher, return_exceptions=True)
