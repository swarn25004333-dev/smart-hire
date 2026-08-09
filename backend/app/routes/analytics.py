"""Analytics API."""

import logging

from fastapi import APIRouter, Request

from app.config import settings
from app.rate_limit import limiter
from app.services.analytics_service import get_analytics

logger = logging.getLogger("smart-hire.analytics")

router = APIRouter()


@router.get("/api/analytics")
@limiter.limit(settings.general_rate_limit)
async def analytics(request: Request) -> dict:
    return get_analytics()
