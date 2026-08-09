"""Standalone job-description analysis endpoint."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import settings
from app.models.schemas import JobAnalysis
from app.rate_limit import limiter
from app.services import ai_service

router = APIRouter()


class AnalyzeJobRequest(BaseModel):
    job_description: str = Field(..., min_length=20)


@router.post("/api/analyze-job", response_model=JobAnalysis)
@limiter.limit(settings.ai_analyze_job_rate_limit)
async def analyze_job(request: Request, payload: AnalyzeJobRequest) -> JobAnalysis:
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")
    return ai_service.analyze_job(payload.job_description)
