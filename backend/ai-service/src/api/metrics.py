"""Expose aggregate chat timings for Prometheus scraping."""

from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from src.metrics import METRICS_REGISTRY

router = APIRouter()


@router.get('/metrics', include_in_schema=False)
def metrics() -> Response:
    return Response(
        content=generate_latest(METRICS_REGISTRY),
        headers={'Content-Type': CONTENT_TYPE_LATEST},
    )
