"""AI chat assistant API."""

import logging

from fastapi import APIRouter, Request

from app.config import settings
from app.models.schemas import ChatRequest, ChatResponse
from app.rate_limit import limiter
from app.services import chat_service

logger = logging.getLogger("smart-hire.chat")

router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
@limiter.limit(settings.ai_analyze_job_rate_limit)
async def chat(request: Request, payload: ChatRequest) -> ChatResponse:
    result = chat_service.chat(payload.message, payload.context or {})
    engine = "groq" if settings.openai_api_key else "offline"
    return ChatResponse(reply=result.get("reply", ""), engine=engine)
