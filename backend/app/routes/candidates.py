"""Candidate database API: list / search / filter / sort / profile / resume."""

import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse

from app.config import settings
from app.database import list_reports, save_report
from app.models.schemas import CandidateProfile
from app.rate_limit import limiter
from app.services import report_service
from app.services.mock_candidates import (
    RESUMES_DIR,
    load_profile,
    load_profiles,
    profile_to_candidate_analysis,
)

logger = logging.getLogger("smart-hire.candidates")

router = APIRouter()

SORT_KEYS = {"name", "atsScore", "overallMatch", "experience", "communication", "location"}


def _profile_response(profile: dict) -> dict:
    """Serialize a profile dict into the public API shape."""
    ats = float(profile.get("atsScore", 0) or 0)
    exp = float(profile.get("experience", 0) or 0)
    overall = float(profile.get("overallMatch", 0) or 0)
    skills = profile.get("skills", []) or []
    return {
        "id": profile.get("id"),
        "candidateId": f"cand_{profile.get('id')}",
        "name": profile.get("name"),
        "photo": f"/mock/photos/{profile.get('photo')}",
        "email": profile.get("email"),
        "phone": profile.get("phone"),
        "location": profile.get("location"),
        "role": profile.get("role", "Professional"),
        "experience": profile.get("experience", 0),
        "education": profile.get("education"),
        "university": profile.get("university"),
        "educationHistory": profile.get("educationHistory", []),
        "experienceTimeline": profile.get("experienceTimeline", []),
        "projects": profile.get("projects", []),
        "skills": skills,
        "certifications": profile.get("certifications", []),
        "github": profile.get("github"),
        "linkedin": profile.get("linkedin"),
        "resumeSummary": profile.get("resumeSummary", ""),
        "atsScore": ats,
        "communication": profile.get("communication", 0),
        "leadership": profile.get("leadership", 0),
        "problemSolving": profile.get("problemSolving", 0),
        "expectedSalary": profile.get("expectedSalary"),
        "noticePeriod": profile.get("noticePeriod"),
        "resumePdf": profile.get("resumePdf"),
        "overallMatch": overall,
        "strengths": profile.get("strengths", []),
        "weaknesses": profile.get("weaknesses", []),
        "aiSummary": profile.get("aiSummary", ""),
        "hireRecommendation": profile.get("hireRecommendation", "Maybe"),
        "resumeUrl": f"/api/candidates/{profile.get('id')}/resume",
        "skillMatch": ats,
        "experienceMatch": min(100.0, exp * 14),
        "educationMatch": 85.0,
        "projectsMatch": overall,
        "aiConfidence": min(100.0, ats + 5),
        "skillsMatch": skills[:8],
        "missingSkills": [],
        "engine": "offline",
        "poweredBy": "Offline AI Mode",
    }


@router.get("/api/candidates")
@limiter.limit(settings.general_rate_limit)
async def list_candidates_api(
    request: Request,
    search: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    education: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    min_experience: Optional[int] = Query(None),
    max_experience: Optional[int] = Query(None),
    min_ats: Optional[float] = Query(None),
    max_ats: Optional[float] = Query(None),
    sort_by: str = Query("atsScore"),
    order: str = Query("desc"),
) -> dict:
    profiles = [_profile_response(p) for p in load_profiles()]

    q = (search or "").strip().lower()
    if q:
        profiles = [
            p for p in profiles
            if q in (p["name"] or "").lower()
            or q in (p["role"] or "").lower()
            or q in (p["email"] or "").lower()
            or q in " ".join(p["skills"]).lower()
        ]
    if skill:
        skill_l = skill.lower()
        profiles = [p for p in profiles if any(skill_l in s.lower() for s in p["skills"])]
    if education:
        edu_l = education.lower()
        profiles = [p for p in profiles if edu_l in (p["education"] or "").lower()]
    if location:
        loc_l = location.lower()
        profiles = [p for p in profiles if loc_l in (p["location"] or "").lower()]
    if min_experience is not None:
        profiles = [p for p in profiles if (p["experience"] or 0) >= min_experience]
    if max_experience is not None:
        profiles = [p for p in profiles if (p["experience"] or 0) <= max_experience]
    if min_ats is not None:
        profiles = [p for p in profiles if (p["atsScore"] or 0) >= min_ats]
    if max_ats is not None:
        profiles = [p for p in profiles if (p["atsScore"] or 0) <= max_ats]

    reverse = order.lower() == "desc"
    if sort_by in SORT_KEYS:
        profiles.sort(
            key=lambda p: (p.get(sort_by) is None, p.get(sort_by) or 0 if isinstance(p.get(sort_by), (int, float)) else str(p.get(sort_by) or "").lower()),
            reverse=reverse,
        )
    else:
        profiles.sort(key=lambda p: p.get("atsScore", 0) or 0, reverse=True)

    return {"total": len(profiles), "candidates": profiles}


@router.get("/api/candidates/{candidate_id}")
@limiter.limit(settings.general_rate_limit)
async def get_candidate_api(request: Request, candidate_id: int) -> dict:
    profile = load_profile(candidate_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return _profile_response(profile)


@router.get("/api/candidates/{candidate_id}/resume")
@limiter.limit(settings.general_rate_limit)
async def get_candidate_resume(request: Request, candidate_id: int) -> FileResponse:
    profile = load_profile(candidate_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    pdf_name = profile.get("resumePdf")
    pdf_path = RESUMES_DIR / (pdf_name or "")
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Resume PDF not found.")
    return FileResponse(str(pdf_path), media_type="application/pdf", filename=pdf_name or "resume.pdf")


@router.post("/api/candidates/{candidate_id}/report")
@limiter.limit(settings.compare_rate_limit)
async def generate_candidate_report_api(request: Request, candidate_id: int, job_title: Optional[str] = None) -> dict:
    profile = load_profile(candidate_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    candidate = profile_to_candidate_analysis(profile)
    job = report_service.simple_job(job_title or profile.get("role", "Professional"))
    metadata = report_service.generate_candidate_report(
        candidate, job, resume_name=profile.get("resumePdf", "")
    )
    save_report(
        report_id=metadata["reportId"],
        candidate_name=metadata["candidateName"],
        resume_name=metadata["resumeName"],
        job_title=metadata["jobTitle"],
        ats_score=metadata["atsScore"],
        recommendation=metadata["recommendation"],
        report_path=metadata["reportPath"],
        report_data=report_service.build_report_json(candidate, job, metadata["resumeName"]),
    )
    return {"downloadUrl": f"/api/reports/{metadata['reportId']}/download", **metadata}


@router.get("/api/reports/{report_id}/download")
@limiter.limit(settings.general_rate_limit)
async def download_report_api(request: Request, report_id: str) -> FileResponse:
    path = Path(report_service.REPORTS_DIR) / f"{report_id}.pdf"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report not found.")
    return FileResponse(str(path), media_type="application/pdf", filename=f"{report_id}.pdf")


@router.get("/api/reports")
@limiter.limit(settings.general_rate_limit)
async def list_reports_api(request: Request) -> dict:
    reports = list_reports(limit=200)
    items = []
    for r in reports:
        items.append({
            "reportId": r.get("report_id"),
            "candidateName": r.get("candidate_name"),
            "resumeName": r.get("resume_name"),
            "jobTitle": r.get("job_title"),
            "atsScore": r.get("ats_score"),
            "recommendation": r.get("recommendation"),
            "createdAt": r.get("created_at"),
            "downloadUrl": f"/api/reports/{r.get('report_id')}/download",
        })
    return {"total": len(items), "reports": items}
