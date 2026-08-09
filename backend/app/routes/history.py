"""Screening history API: list / get / delete persisted screenings."""

import logging

from fastapi import APIRouter, HTTPException, Request

from app.config import settings
from app.database import delete_history, get_history, list_history
from app.models.schemas import HistoryEntry
from app.rate_limit import limiter

logger = logging.getLogger("smart-hire.history")

router = APIRouter()


def _serialize(entry: dict) -> dict:
    return {
        "id": entry.get("id"),
        "resumeName": entry.get("resume_name") or "",
        "candidateName": entry.get("candidate_name") or "",
        "candidateId": entry.get("candidate_id") or "",
        "screeningDate": (entry.get("screening_date") or "")[:10],
        "screeningTime": entry.get("screening_time") or "",
        "atsScore": entry.get("ats_score") or 0,
        "recommendation": entry.get("recommendation") or "",
        "jobDescription": entry.get("job_description") or "",
        "jobTitle": entry.get("job_title") or "",
        "missingSkills": entry.get("missing_skills") or [],
        "matchedSkills": entry.get("matched_skills") or [],
        "aiSummary": entry.get("ai_summary") or "",
        "engine": entry.get("engine") or "offline",
        "result": entry.get("result") or {},
        "createdAt": entry.get("created_at") or "",
    }


@router.get("/api/history", response_model=list[HistoryEntry])
@limiter.limit(settings.general_rate_limit)
async def history_list(request: Request) -> list:
    return [_serialize(e) for e in list_history(limit=500)]


@router.get("/api/history/{history_id}", response_model=HistoryEntry)
@limiter.limit(settings.general_rate_limit)
async def history_detail(request: Request, history_id: int) -> dict:
    entry = get_history(history_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found.")
    return _serialize(entry)


@router.delete("/api/history/{history_id}")
@limiter.limit(settings.general_rate_limit)
async def history_delete(request: Request, history_id: int) -> dict:
    if not delete_history(history_id):
        raise HTTPException(status_code=404, detail="History entry not found.")
    return {"deleted": True, "id": history_id}
