"""Prometheus measurements for chat processing, excluding document ingestion."""

from collections.abc import Iterator
from contextlib import contextmanager
from time import perf_counter
from typing import Literal

from prometheus_client import CollectorRegistry, Histogram

ChatStage = Literal['embedding', 'retrieval', 'generation']

METRICS_REGISTRY = CollectorRegistry()
CHAT_STAGE_DURATION = Histogram(
    'archie_ai_stage_duration_seconds',
    'Chat stage duration in seconds, including failed and cancelled attempts.',
    labelnames=['stage'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1, 2, 5, 8, 10, 12, 15, 20, 30, 60, 120, 300, 600],
    registry=METRICS_REGISTRY,
)

# Export zero counts before the first request so Prometheus has a baseline.
for stage in ['embedding', 'retrieval', 'generation']:
    CHAT_STAGE_DURATION.labels(stage=stage)

# stages "embedding, retrieval, generation"
@contextmanager
def measure_chat_stage(stage: ChatStage) -> Iterator[None]:
    stage_histogram = CHAT_STAGE_DURATION.labels(stage=stage)
    start_time = perf_counter()
    try:
        yield # eg. embed(qeustion)
    finally:
        duration_seconds = perf_counter() - start_time
        stage_histogram.observe(duration_seconds)
