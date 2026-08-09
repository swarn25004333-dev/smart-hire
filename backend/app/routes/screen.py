"""Main screening pipeline: job + resumes -> ranked candidates."""

import logging
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.config import settings
from app.database import add_history, save_screening
from app.models.schemas import ParsedResume, ScreeningResult
from app.rate_limit import limiter
from app.services import ai_service, mock_candidates, resume_parser
from app.utils.helpers import anonymize_candidate

logger = logging.getLogger("smart-hire.screen")

router = APIRouter()


def _engine_label() -> str:
    engine = ai_service.current_engine()
    if engine == "groq":
        return "Powered by Groq"
    return "Offline AI Mode"


def _save_history_entries(
    job_description: str,
    result: ScreeningResult,
) -> None:
    """Persist one history row per screened candidate."""
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    for candidate in result.candidates:
        add_history(
            {
                "resumeName": f"{candidate.name} - resume",
                "candidateName": candidate.name,
                "candidateId": candidate.candidateId,
                "screeningDate": date_str,
                "screeningTime": time_str,
                "atsScore": candidate.overallScore,
                "recommendation": candidate.recommendation,
                "jobDescription": job_description,
                "jobTitle": result.jobTitle,
                "missingSkills": candidate.missingSkills,
                "matchedSkills": candidate.skillsMatch or candidate.matchedSkills,
                "aiSummary": candidate.aiSummary
                or candidate.recommendationExplanation
                or candidate.evidence,
                "engine": ai_service.current_engine(),
                "result": result.model_dump(),
            }
        )


@router.post("/api/screen", response_model=ScreeningResult)
@limiter.limit(settings.ai_screen_rate_limit)
async def screen_resumes(
    request: Request,
    job_description: str = Form(...),
    blind_screening: str = Form("false"),
    resumes: List[UploadFile] = File(...),
) -> ScreeningResult:
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")
    if len(job_description.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description is too short.")
    if not resumes:
        raise HTTPException(status_code=400, detail="At least one resume is required.")

    blind = blind_screening.strip().lower() in ("1", "true", "yes", "on")

    logger.info("Starting AI screening pipeline")
    logger.info("AI enabled: %s", settings.ai_enabled)
    logger.info("AI provider: %s", "Groq" if settings.openai_api_key else "None")
    logger.info("AI model: %s", settings.openai_model)

    try:
        job = ai_service.analyze_job(job_description)
    except Exception as exc:
        logger.error("Job analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    logger.info("Job analysis completed: %s", job.title)

    parsed: List[ParsedResume] = []
    for upload in resumes:
        logger.info("Parsing resume: %s", upload.filename)
        data = await upload.read()
        if len(data) > settings.max_upload_size:
            raise HTTPException(status_code=400, detail=f"{upload.filename} exceeds the size limit.")
        if not data:
            raise HTTPException(status_code=400, detail=f"{upload.filename} is empty.")
        try:
            parsed.append(resume_parser.parse_resume_bytes(data, upload.filename or "resume.pdf"))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Failed to parse {upload.filename}: {exc}")

    logger.info("Resume parsing completed for %d file(s)", len(parsed))

    try:
        candidates = [
            ai_service.analyze_candidate(job, resume, index)
            for index, resume in enumerate(parsed)
        ]
    except Exception as exc:
        logger.error("Candidate AI analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    logger.info("AI analysis completed for all candidates")

    if blind:
        candidates = [
            anonymize_candidate(candidate, index + 1)
            for index, candidate in enumerate(candidates)
        ]

    candidates.sort(key=lambda c: c.overallScore, reverse=True)

    total = len(candidates)
    strong = sum(1 for c in candidates if c.matchCategory == "strong")
    average = round(sum(c.overallScore for c in candidates) / total, 1) if total else 0.0
    shortlisted = sum(1 for c in candidates if c.overallScore >= 75)

    result = ScreeningResult(
        jobId=f"job-{uuid.uuid4().hex[:8]}",
        jobTitle=job.title,
        analyzedAt=datetime.now(timezone.utc).isoformat(),
        totalCandidates=total,
        strongMatches=strong,
        averageScore=average,
        shortlisted=shortlisted,
        jobAnalysis=job,
        candidates=candidates,
        engine=ai_service.current_engine(),
        poweredBy=_engine_label(),
        autoCompare=mock_candidates.auto_compare(candidates[0]) if candidates else None,
    )

    # Persist everything: the full screening job + per-candidate history.
    try:
        save_screening(
            screening_id=result.jobId,
            job_title=result.jobTitle,
            job_description=job_description,
            job_analysis=job.model_dump(),
            engine=result.engine,
            analyzed_at=result.analyzedAt,
            result=result.model_dump(),
        )
        _save_history_entries(job_description, result)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to persist screening history: %s", exc)

    logger.info("Screening pipeline finished: %d candidates, avg score %.1f (engine=%s)",
                total, average, result.engine)
    return result