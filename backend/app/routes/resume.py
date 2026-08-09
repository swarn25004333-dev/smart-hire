"""Standalone resume parsing endpoint."""

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.config import settings
from app.models.schemas import ParsedResume
from app.rate_limit import limiter
from app.services import resume_parser

router = APIRouter()


@router.post("/api/parse-resume", response_model=ParsedResume)
@limiter.limit(settings.resume_parse_rate_limit)
async def parse_resume(request: Request, resume: UploadFile = File(...)) -> ParsedResume:
    data = await resume.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    try:
        return resume_parser.parse_resume_bytes(data, resume.filename or "resume.pdf")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to parse resume: {exc}")
