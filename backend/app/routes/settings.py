"""Settings API: manage API keys, theme and offline mode."""

import logging

from fastapi import APIRouter, Request

from app.config import settings as app_settings
from app.database import get_settings, set_settings
from app.models.schemas import SettingsResponse, SettingsUpdate
from app.rate_limit import limiter

logger = logging.getLogger("smart-hire.settings")

router = APIRouter()


@router.get("/api/settings", response_model=SettingsResponse)
@limiter.limit(app_settings.general_rate_limit)
async def get_settings_api(request: Request) -> SettingsResponse:
    stored = get_settings()
    return SettingsResponse(
        geminiConfigured=bool(app_settings.gemini_api_key or stored.get("geminiApiKey")),
        openaiConfigured=bool(app_settings.openai_api_key or stored.get("openaiApiKey")),
        theme=stored.get("theme") or "dark",
        offlineMode=bool(stored.get("offlineMode")),
    )


@router.put("/api/settings", response_model=SettingsResponse)
@limiter.limit(app_settings.general_rate_limit)
async def update_settings_api(request: Request, payload: SettingsUpdate) -> SettingsResponse:
    updates: dict = {}
    if payload.geminiApiKey is not None:
        updates["geminiApiKey"] = payload.geminiApiKey.strip()
        app_settings.gemini_api_key = updates["geminiApiKey"]
    if payload.openaiApiKey is not None:
        updates["openaiApiKey"] = payload.openaiApiKey.strip()
        app_settings.openai_api_key = updates["openaiApiKey"]
    if payload.theme is not None:
        updates["theme"] = payload.theme
    if payload.offlineMode is not None:
        updates["offlineMode"] = payload.offlineMode
        app_settings.offline_mode = payload.offlineMode

    if updates:
        stored = set_settings(updates)
    else:
        stored = get_settings()

    return SettingsResponse(
        geminiConfigured=bool(app_settings.gemini_api_key or stored.get("geminiApiKey")),
        openaiConfigured=bool(app_settings.openai_api_key or stored.get("openaiApiKey")),
        theme=stored.get("theme") or "dark",
        offlineMode=bool(stored.get("offlineMode")),
    )
