"""Candidate comparison endpoint."""

from fastapi import APIRouter, Request

from app.config import settings
from app.models.schemas import CompareMetric, CompareRequest, CompareResult
from app.rate_limit import limiter

router = APIRouter()

METRIC_KEYS = [
    ("requiredSkills", "Required Skills"),
    ("experience", "Experience"),
    ("projects", "Projects"),
    ("education", "Education"),
    ("certifications", "Certifications"),
    ("preferredSkills", "Preferred Skills"),
]


@router.post("/api/compare-candidates", response_model=CompareResult)
@limiter.limit(settings.compare_rate_limit)
async def compare_candidates(request: Request, payload: CompareRequest) -> CompareResult:
    candidates = sorted(payload.candidates, key=lambda c: c.overallScore, reverse=True)
    metrics = [
        CompareMetric(
            label=label,
            values=[c.scoreBreakdown.model_dump()[key] for c in candidates],
        )
        for key, label in METRIC_KEYS
    ]
    return CompareResult(candidates=candidates, metrics=metrics)
