"""Mock candidate database + auto-compare engine.

Loads the 8 built-in candidate profiles (seeded from
`backend/mock_data/candidates.json` into SQLite) and exposes:

  - profile accessors used by the candidates API
  - an auto-compare engine that matches an analyzed (uploaded) resume against
    every mock candidate and returns similarity + dimension scores.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import settings
from app.database import get_candidate, list_candidates
from app.models.schemas import (
    AutoCompareMatch,
    AutoCompareResult,
    CandidateAnalysis,
    CandidateProfile,
    Education,
    Experience,
    JobAnalysis,
    Project,
)

logger = logging.getLogger("smart-hire.mock_candidates")

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
MOCK_DIR = _BACKEND_ROOT / "mock_data"
RESUMES_DIR = MOCK_DIR / "resumes"
PHOTOS_DIR = MOCK_DIR / "photos"

_PHOTO_NAMES = [
    "arjun_sharma.svg", "priya_verma.svg", "rahul_mehta.svg", "sneha_kapoor.svg",
    "aman_gupta.svg", "ritika_singh.svg", "harsh_agarwal.svg", "neha_joshi.svg",
]


def _parse_json_field(value, default):
    if not value:
        return default
    try:
        return json.loads(value) if isinstance(value, str) else value
    except (ValueError, TypeError):
        return default


def _profile_from_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a DB row into a full candidate profile dict (JSON shape)."""
    data = _parse_json_field(row.get("data"), {})
    if not data:
        data = {
            "id": row.get("id"),
            "candidateKey": row.get("candidate_key"),
            "name": row.get("name"),
            "photo": row.get("photo"),
            "email": row.get("email"),
            "phone": row.get("phone"),
            "location": row.get("location"),
            "experience": row.get("experience"),
            "education": row.get("education"),
            "university": row.get("university"),
            "skills": _parse_json_field(row.get("skills"), []),
            "certifications": _parse_json_field(row.get("certifications"), []),
            "github": row.get("github"),
            "linkedin": row.get("linkedin"),
            "expectedSalary": row.get("expected_salary"),
            "noticePeriod": row.get("notice_period"),
            "resumePdf": row.get("resume_pdf"),
            "resumeSummary": row.get("resume_summary"),
            "atsScore": row.get("ats_score"),
            "communication": row.get("communication"),
            "leadership": row.get("leadership"),
            "problemSolving": row.get("problem_solving"),
            "overallMatch": row.get("overall_match"),
            "strengths": _parse_json_field(row.get("strengths"), []),
            "weaknesses": _parse_json_field(row.get("weaknesses"), []),
            "aiSummary": row.get("ai_summary"),
            "projects": _parse_json_field(row.get("projects"), []),
        }
    data["id"] = row.get("id") or data.get("id")
    data["candidateKey"] = row.get("candidate_key") or data.get("candidateKey")
    data["resumePdf"] = row.get("resume_pdf") or data.get("resumePdf")
    data["resumePdfPath"] = str(RESUMES_DIR / (data.get("resumePdf") or ""))
    data["photoPath"] = str(PHOTOS_DIR / (data.get("photo") or ""))
    return data


def load_profiles() -> List[Dict[str, Any]]:
    """Return all mock candidate profiles (from the seeded SQLite DB)."""
    return [_profile_from_row(r) for r in list_candidates()]


def load_profile(candidate_id: int) -> Optional[Dict[str, Any]]:
    row = get_candidate(candidate_id)
    return _profile_from_row(row) if row else None


def profile_to_candidate_analysis(profile: Dict[str, Any], index: int = 0) -> CandidateAnalysis:
    """Build a CandidateAnalysis object from a mock profile so it can feed
    the compare engine / report generator."""
    skills = profile.get("skills") or []
    edu = profile.get("educationHistory") or []
    exp = profile.get("experienceTimeline") or []
    projects = profile.get("projects") or []
    strengths = profile.get("strengths") or []
    weaknesses = profile.get("weaknesses") or []

    candidate = CandidateAnalysis(
        candidateId=f"cand_{profile.get('id', index + 1)}",
        name=profile.get("name", "Not Found"),
        email=profile.get("email", "Not Found"),
        phone=profile.get("phone", "Not Found"),
        address=profile.get("location"),
        overallScore=float(profile.get("atsScore", 0) or 0),
        matchCategory="strong"
        if (profile.get("atsScore") or 0) >= 90
        else "good"
        if (profile.get("atsScore") or 0) >= 75
        else "needs-review"
        if (profile.get("atsScore") or 0) >= 60
        else "low",
        scoreBreakdown={
            "requiredSkills": float(profile.get("atsScore", 0) or 0),
            "experience": min(100.0, float(profile.get("experience", 0) or 0) * 14),
            "projects": float(profile.get("overallMatch", 0) or 0),
            "education": 85.0,
            "certifications": 88.0 if profile.get("certifications") else 60.0,
            "preferredSkills": float(profile.get("problemSolving", 0) or 0),
        },
        skillsMatch=skills[:8],
        matchedSkills=skills[:8],
        missingSkills=[],
        strengths=strengths,
        weaknesses=weaknesses,
        whyMatches=[
            {"reason": f"{profile.get('name')} has strong {', '.join(skills[:3])} expertise", "evidence": profile.get("resumeSummary", "")}
        ],
        evidence=profile.get("resumeSummary", ""),
        skillGaps=[],
        recommendation=(
            "Strong Match" if (profile.get("atsScore") or 0) >= 90
            else "Good Match" if (profile.get("atsScore") or 0) >= 75
            else "Needs Review" if (profile.get("atsScore") or 0) >= 60
            else "Low Match"
        ),
        recommendationExplanation=profile.get("aiSummary", ""),
        experienceYears=float(profile.get("experience", 0) or 0),
        educationLevel=f"{profile.get('education', '')}, {profile.get('university', '')}",
        topSkills=skills[:6],
        certifications=profile.get("certifications") or [],
        communication=float(profile.get("communication", 70) or 70),
        leadership=float(profile.get("leadership", 70) or 70),
        problemSolving=float(profile.get("problemSolving", 70) or 70),
        expectedSalary=profile.get("expectedSalary", "Not Specified"),
        noticePeriod=profile.get("noticePeriod", "Not Specified"),
        location=profile.get("location"),
        photo=profile.get("photoPath"),
        github=profile.get("github"),
        linkedin=profile.get("linkedin"),
        projects=[
            Project(name=p.get("name", "Not Found"), description=p.get("description", ""), skills=p.get("skills") or [])
            for p in projects
        ],
        aiSummary=profile.get("aiSummary", ""),
        confidence=min(100.0, float(profile.get("atsScore", 70) or 70) + 5),
        hireRecommendation=(
            "Hire" if (profile.get("atsScore") or 0) >= 80
            else "Maybe" if (profile.get("atsScore") or 0) >= 60
            else "Reject"
        ),
        skillMatch=float(profile.get("atsScore", 0) or 0),
        educationMatch=85.0,
        experienceMatch=min(100.0, float(profile.get("experience", 0) or 0) * 14),
        projectsMatch=float(profile.get("overallMatch", 0) or 0),
        overallMatch=float(profile.get("overallMatch", 0) or profile.get("atsScore", 0) or 0),
    )
    return candidate


# ---------------------------------------------------------------------------
# Auto-compare engine
# ---------------------------------------------------------------------------
def _normalize_skills(skills) -> set:
    return {str(s).strip().lower() for s in (skills or [])}


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _skill_match(profile_skills: set, candidate_skills: set) -> tuple:
    """Return (score, matched_skills, missing_skills)."""
    matched = sorted(profile_skills & candidate_skills)
    missing = sorted(candidate_skills - profile_skills)
    score = round(_jaccard(profile_skills, candidate_skills) * 100, 1)
    return score, matched, missing


def _experience_match(profile_years: int, candidate_years: float) -> float:
    if candidate_years <= 0:
        return 60.0 if profile_years > 0 else 70.0
    ratio = min(profile_years, candidate_years) / max(profile_years, candidate_years)
    return round(max(0.0, min(100.0, ratio * 100)), 1)


def _education_match(profile_edu: str, candidate_edu: str) -> float:
    if not profile_edu or not candidate_edu:
        return 70.0
    a = set(profile_edu.lower().split())
    b = set(candidate_edu.lower().split())
    common = a & b
    score = 50 + min(50.0, len(common) * 10)
    return round(score, 1)


def _projects_match(profile_projects: List[Dict], candidate_projects: List[Any]) -> float:
    profile_tech = _normalize_skills(
        [s for p in profile_projects for s in (p.get("skills") or [])]
    )
    candidate_tech = _normalize_skills(
        [s for p in candidate_projects for s in (p.skills or [])]
    )
    if not profile_tech or not candidate_tech:
        return 50.0
    return round(_jaccard(profile_tech, candidate_tech) * 100, 1)


def auto_compare(candidate: CandidateAnalysis) -> AutoCompareResult:
    """Compare an analyzed candidate against all mock candidates."""
    profiles = load_profiles()
    candidate_skills = _normalize_skills(candidate.topSkills or candidate.skillsMatch)
    candidate_edu = candidate.educationLevel or ""
    candidate_projects = candidate.projects or []
    candidate_years = float(candidate.experienceYears or 0)

    matches: List[AutoCompareMatch] = []
    for profile in profiles:
        profile_skills = _normalize_skills(profile.get("skills"))
        skill_score, matched_skills, missing_skills = _skill_match(profile_skills, candidate_skills)
        exp_score = _experience_match(int(profile.get("experience", 0) or 0), candidate_years)
        edu_score = _education_match(profile.get("education", ""), candidate_edu)
        proj_score = _projects_match(profile.get("projects") or [], candidate_projects)

        similarity = round(
            0.5 * skill_score
            + 0.2 * exp_score
            + 0.15 * edu_score
            + 0.15 * proj_score,
            1,
        )
        overall = float(profile.get("overallMatch", profile.get("atsScore", 0)) or 0)

        matches.append(
            AutoCompareMatch(
                candidateId=f"cand_{profile.get('id')}",
                name=profile.get("name", "Not Found"),
                photo=f"/mock/photos/{profile.get('photo') or _PHOTO_NAMES[0]}",
                role=profile.get("role", "Professional"),
                location=profile.get("location"),
                experience=int(profile.get("experience", 0) or 0),
                overallMatch=round(overall, 1),
                similarity=similarity,
                skillMatch=skill_score,
                experienceMatch=exp_score,
                educationMatch=edu_score,
                projectsMatch=proj_score,
                matchedSkills=[s.capitalize() for s in matched_skills[:6]],
                missingSkills=[s.capitalize() for s in missing_skills[:6]],
            )
        )

    matches.sort(key=lambda m: m.similarity, reverse=True)
    top = matches[0]
    return AutoCompareResult(
        topMatch=top,
        top3=matches[:3],
        rankings=matches,
    )
