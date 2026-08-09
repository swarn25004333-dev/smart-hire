"""AI service.

Wraps Groq (via the OpenAI SDK) to produce structured job analysis and
candidate evaluations. Falls back to a deterministic heuristic engine when no
API key is configured or when the provider call fails, so the app always works.
"""

import json
import logging
import re
from typing import Any, Dict, List

from app.config import settings
from app.models.schemas import CandidateAnalysis, JobAnalysis, ParsedResume
from app.services import ranking_service
from app.services.resume_parser import SKILL_LEXICON, _matches

logger = logging.getLogger("smart-hire.ai")

# Tracks which engine actually produced the last analysis (groq/offline).
_ENGINE = {"value": "offline"}


def current_engine() -> str:
    return _ENGINE["value"]


def powered_by_label() -> str:
    engine = current_engine()
    if engine == "groq":
        return "Powered by Groq"
    return "Offline AI Mode"


def _mark_engine() -> None:
    if settings.openai_api_key and not getattr(settings, "offline_mode", False):
        _ENGINE["value"] = "groq"
    else:
        _ENGINE["value"] = "offline"


def _redact_secrets(text: str) -> str:
    """Replace configured API keys with a placeholder before logging."""
    for key in (settings.gemini_api_key, settings.openai_api_key):
        if key and key in text:
            text = text.replace(key, "[REDACTED]")
    return text


def _provider_configured() -> bool:
    """A valid Groq API key must be present before any external call is made."""
    return bool(settings.openai_api_key)


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------
def _call_openai(prompt: str) -> Dict[str, Any]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError(
            "openai package is not installed. Install it with: pip install openai"
        ) from exc

    logger.info("Using Groq AI provider (model: %s)", settings.openai_model)

    try:
        client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.groq_base_url,
            timeout=settings.ai_timeout_seconds,
        )
        completion = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert technical recruiter and resume analyst. "
                        "Respond ONLY with valid JSON matching the requested schema."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        err_msg = str(exc).lower()
        if "rate" in err_msg or "429" in err_msg:
            raise RuntimeError("Groq API rate limit exceeded") from exc
        if "timeout" in err_msg or "deadline" in err_msg:
            raise RuntimeError("Groq API request timed out") from exc
        if "invalid" in err_msg or "api key" in err_msg or "unauthorized" in err_msg or "401" in err_msg or "403" in err_msg:
            raise RuntimeError(f"Groq API authentication error: invalid or missing API key") from exc
        raise RuntimeError(f"Groq API error: {exc}") from exc

    if not completion.choices[0].message.content:
        raise RuntimeError("Groq API returned empty response")

    try:
        return json.loads(completion.choices[0].message.content)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Groq API returned invalid JSON: {exc}") from exc


def _structured_json(prompt: str) -> Dict[str, Any]:
    if not _provider_configured():
        raise RuntimeError("No AI provider configured")
    return _call_openai(prompt)


# ---------------------------------------------------------------------------
# Heuristic job analysis (offline)
# ---------------------------------------------------------------------------
def _heuristic_job_analysis(job_text: str) -> JobAnalysis:
    text = job_text.lower()
    lines = [l.strip() for l in job_text.splitlines() if l.strip()]

    title = "Untitled Role"
    for line in lines[:6]:
        if 2 <= len(line.split()) <= 12 and not re.search(r"(salary|apply|about|description|responsib|qualif|requir)", line.lower()):
            title = line
            break

    found_skills = [s for s in SKILL_LEXICON if _matches(job_text, s)]

    exp_match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs|yr)", text)
    experience = f"{exp_match.group(1)}+ years" if exp_match else "Not Specified"

    edu_keywords = ["bachelor", "master", "b.tech", "m.tech", "mba", "ph.d",
                     "b.sc", "m.sc", "degree", "computer science", "engineering"]
    education = []
    for line in lines:
        if any(k in line.lower() for k in edu_keywords):
            education.append(line[:120])
    education = list(dict.fromkeys(education))[:4]

    cert_keywords = ["certified", "certification", "aws certified", "pmp", "cissp"]
    certifications = []
    for line in lines:
        if any(k in line.lower() for k in cert_keywords):
            certifications.append(line[:120])
    certifications = list(dict.fromkeys(certifications))[:4]

    responsibilities = [
        l.strip().lstrip("-•*").strip()
        for l in lines
        if l.strip().startswith(("-", "•", "*")) or re.match(r"^\d+[.)]", l.strip())
    ][:8]

    required = found_skills[:12]
    preferred = found_skills[12:16]

    return JobAnalysis(
        title=title,
        requiredSkills=required,
        preferredSkills=preferred,
        experience=experience,
        education=education,
        certifications=certifications,
        keyResponsibilities=responsibilities,
    )


# ---------------------------------------------------------------------------
# AI job analysis
# ---------------------------------------------------------------------------
JOB_SCHEMA_EXAMPLE = {
    "title": "Senior Machine Learning Engineer",
    "requiredSkills": ["Python", "TensorFlow", "AWS", "Kubernetes"],
    "preferredSkills": ["Spark", "Airflow"],
    "experience": "5+ years",
    "education": ["Bachelor's in Computer Science or related field"],
    "certifications": ["AWS Certified Machine Learning"],
    "keyResponsibilities": ["Design and deploy production ML models"],
}


def analyze_job(job_text: str) -> JobAnalysis:
    if not settings.ai_enabled:
        logger.info("AI disabled; using offline heuristic engine for job analysis")
        _ENGINE["value"] = "offline"
        return _heuristic_job_analysis(job_text)

    logger.info("Using Groq AI provider for job analysis")

    prompt = f"""You are a job-description analyzer for an ATS tool.
Extract the following fields from the job description below.
Rules:
- requiredSkills: hard requirements only, as short skill names.
- preferredSkills: nice-to-haves.
- experience: keep the exact phrasing like "5+ years".
- education: degree requirements.
- certifications: required certificates.
- Never invent requirements not present in the text.
- If a field is not present use an empty list, or "Not Specified" for experience.
Return JSON exactly like this example:
{json.dumps(JOB_SCHEMA_EXAMPLE, indent=2)}

JOB DESCRIPTION:
{job_text}
"""
    try:
        data = _structured_json(prompt)
        job = JobAnalysis.model_validate(data)
        if not job.title or job.title == "Untitled Role":
            raise ValueError("Model returned empty title")
        _mark_engine()
        logger.info("AI job analysis completed successfully")
        return job
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "AI job analysis failed (%s); using heuristic fallback.",
            _redact_secrets(str(exc)),
        )
        _ENGINE["value"] = "offline"
        return _heuristic_job_analysis(job_text)


# ---------------------------------------------------------------------------
# AI candidate analysis
# ---------------------------------------------------------------------------
CANDIDATE_SCHEMA_EXAMPLE = {
    "candidateId": "cand_1",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "+91 98765 43210",
    "address": "Bengaluru, India",
    "overallScore": 94.0,
    "matchCategory": "strong",
    "scoreBreakdown": {
        "requiredSkills": 100.0,
        "experience": 95.0,
        "projects": 92.0,
        "education": 90.0,
        "certifications": 95.0,
        "preferredSkills": 88.0,
    },
    "skillsMatch": ["Python", "TensorFlow", "AWS"],
    "missingSkills": ["Kubernetes"],
    "strengths": ["7+ years ML engineering experience", "Strong AWS background"],
    "weaknesses": ["No Kubernetes experience"],
    "whyMatches": [
        {"reason": "Python experience found", "evidence": "7 years of professional Python"}
    ],
    "evidence": "Resume lists 7 years Python experience, TensorFlow projects, AWS certification, and Kubernetes gaps.",
    "skillGaps": [
        {"skill": "Kubernetes", "severity": "critical"}
    ],
    "recommendation": "Strong Match",
    "recommendationExplanation": "Rahul exceeds requirements with deep production ML experience.",
    "experienceYears": 7.0,
    "educationLevel": "M.Tech, Computer Science",
    "topSkills": ["Python", "TensorFlow", "PyTorch", "Kubernetes"],
    "certifications": ["AWS Certified ML Specialist"],
    "communication": 88.0,
    "leadership": 85.0,
    "problemSolving": 95.0,
    "expectedSalary": "Rs 35-50 LPA",
    "noticePeriod": "30 days",
    "location": "Bengaluru, India",
    "projects": [
        {
            "name": "Recommendation Engine",
            "description": "Production recommender serving 10M users",
            "skills": ["Python", "TensorFlow", "AWS"],
        }
    ],
    "aiSummary": "Strong hire with deep production ML experience and leadership.",
    "interviewQuestions": [
        "Walk me through how you scaled the recommendation engine to 10M users."
    ],
    "confidence": 96.0,
    "hireRecommendation": "Hire",
    "skillMatch": 100.0,
    "educationMatch": 90.0,
    "experienceMatch": 95.0,
    "projectsMatch": 92.0,
    "overallMatch": 94.0,
    "matchedSkills": ["Python", "TensorFlow", "AWS"],
}


def _resume_summary(resume: ParsedResume) -> Dict[str, Any]:
    return {
        "name": resume.name,
        "email": resume.email,
        "phone": resume.phone,
        "summary": resume.summary,
        "education": [e.model_dump() for e in resume.education],
        "skills": resume.skills,
        "workExperience": [e.model_dump() for e in resume.workExperience],
        "projects": [p.model_dump() for p in resume.projects],
        "certifications": resume.certifications,
        "achievements": resume.achievements,
    }


def analyze_candidate(job: JobAnalysis, resume: ParsedResume, index: int) -> CandidateAnalysis:
    logger.info("Analyzing candidate %d: %s", index + 1, resume.name)
    heuristic = ranking_service.compute_analysis(job, resume, index)

    if not settings.ai_enabled:
        logger.info("AI disabled; using offline heuristic engine for candidate analysis")
        _ENGINE["value"] = "offline"
        return heuristic

    prompt = f"""You are an expert technical recruiter for an ATS tool.
Using ONLY the resume data below (never invent information; if something is
missing write "Not Found"), evaluate the candidate against the job.

Scoring model (weights):
- Required Skills 35%
- Relevant Experience 25%
- Projects 15%
- Education 10%
- Certifications 5%
- Preferred Skills 10%

Produce an overallScore (0-100) and a sub-score (0-100) for each dimension.
matchCategory: strong (90-100), good (75-89), needs-review (60-74), low (<60).
recommendation: one of "Strong Match", "Good Match", "Needs Review", "Low Match".
hireRecommendation: decide "Hire", "Maybe" or "Reject" based on overall fit.
The AI only recommends; it must never reject a candidate outright unless the
score is clearly below the job requirements.
Do NOT use protected characteristics (age, gender, race, address) in scoring.

Also produce:
- communication, leadership, problemSolving: soft-skill scores (0-100) inferred from the resume.
- confidence: your confidence in the assessment (0-100).
- interviewQuestions: 4-6 thoughtful, role-specific interview questions.
- aiSummary: a concise 1-3 sentence hiring summary.
- expectedSalary, noticePeriod, location: take from the resume if present,
  otherwise "Not Specified".
- skillMatch, educationMatch, experienceMatch, projectsMatch: mirror the
  breakdown for those dimensions.
- overallMatch: same value as overallScore.

For weaknesses: list areas where the candidate lacks required or preferred skills,
or has less experience than required. Use "Not Found" if no weaknesses are evident.
For evidence: provide a concise summary of the key evidence from the resume that
supports the candidate's score, referencing specific skills, experience, projects,
education, or certifications found in the resume.

Return JSON exactly like this example:
{json.dumps(CANDIDATE_SCHEMA_EXAMPLE, indent=2)}

JOB ANALYSIS:
{job.model_dump_json()}

RESUME:
{json.dumps(_resume_summary(resume), indent=2)}
"""
    try:
        data = _structured_json(prompt)
        candidate = CandidateAnalysis.model_validate(data)
        candidate.candidateId = f"cand_{index + 1}"
        # Back-fill any fields the model omitted so the response is always complete.
        _merge_heuristic_fields(candidate, heuristic)
        _mark_engine()
        logger.info("AI analysis completed for candidate %d: score=%.1f", index + 1, candidate.overallScore)
        return candidate
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "AI candidate analysis failed (%s); using heuristic fallback.",
            _redact_secrets(str(exc)),
        )
        _ENGINE["value"] = "offline"
        return heuristic


def _merge_heuristic_fields(ai: CandidateAnalysis, heuristic: CandidateAnalysis) -> None:
    """Fill any extended fields that the AI response is missing."""
    if not ai.expectedSalary or ai.expectedSalary == "Not Found":
        ai.expectedSalary = heuristic.expectedSalary
    if not ai.noticePeriod or ai.noticePeriod == "Not Found":
        ai.noticePeriod = heuristic.noticePeriod
    if not ai.location or ai.location == "Not Found":
        ai.location = heuristic.location
    if not ai.projects:
        ai.projects = heuristic.projects
    if not ai.interviewQuestions:
        ai.interviewQuestions = heuristic.interviewQuestions
    if not ai.aiSummary:
        ai.aiSummary = heuristic.aiSummary
    if ai.communication <= 0:
        ai.communication = heuristic.communication
    if ai.leadership <= 0:
        ai.leadership = heuristic.leadership
    if ai.problemSolving <= 0:
        ai.problemSolving = heuristic.problemSolving
    if ai.confidence <= 0:
        ai.confidence = heuristic.confidence
    if ai.skillMatch <= 0:
        ai.skillMatch = heuristic.skillMatch
    if ai.educationMatch <= 0:
        ai.educationMatch = heuristic.educationMatch
    if ai.experienceMatch <= 0:
        ai.experienceMatch = heuristic.experienceMatch
    if ai.projectsMatch <= 0:
        ai.projectsMatch = heuristic.projectsMatch
    if ai.overallMatch <= 0:
        ai.overallMatch = heuristic.overallMatch
    if not ai.matchedSkills:
        ai.matchedSkills = ai.skillsMatch
    if not ai.overallMatch:
        ai.overallMatch = ai.overallScore