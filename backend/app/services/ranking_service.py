"""Ranking service.

Computes the candidate/job match scores using the weighted scoring model:

    Required Skills  35%
    Relevant Exp.    25%
    Projects         15%
    Education        10%
    Certifications    5%
    Preferred Skills 10%

Used directly when no AI key is configured, and as a structured-data
fallback / consistency check for the AI path.
"""

import re
from typing import List, Optional, Tuple

from app.models.schemas import (
    CandidateAnalysis,
    JobAnalysis,
    MatchReason,
    ParsedResume,
    ScoreBreakdown,
    SkillGap,
)

WEIGHTS = {
    "requiredSkills": 0.35,
    "experience": 0.25,
    "projects": 0.15,
    "education": 0.10,
    "certifications": 0.05,
    "preferredSkills": 0.10,
}


def category_for_score(score: float) -> str:
    if score >= 90:
        return "strong"
    if score >= 75:
        return "good"
    if score >= 60:
        return "needs-review"
    return "low"


def recommendation_for_score(score: float) -> str:
    if score >= 90:
        return "Strong Match"
    if score >= 75:
        return "Good Match"
    if score >= 60:
        return "Needs Review"
    return "Low Match"


def _normalize(text: str) -> str:
    return text.lower().strip()


def _required_years(job: JobAnalysis) -> Optional[float]:
    match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs|yr)", job.experience.lower())
    if match:
        return float(match.group(1))
    return None


# ---------------------------------------------------------------------------
# Sub-scores
# ---------------------------------------------------------------------------
def _score_required_skills(job: JobAnalysis, resume: ParsedResume) -> Tuple[float, List[str], List[str]]:
    required = [_normalize(s) for s in job.requiredSkills]
    have = {_normalize(s) for s in resume.skills}
    if not required:
        return 70.0, [], []

    matched = [s for s in job.requiredSkills if _normalize(s) in have]
    missing = [s for s in job.requiredSkills if _normalize(s) not in have]
    score = round(len(matched) / len(required) * 100, 1)
    return score, matched, missing


def _score_experience(job: JobAnalysis, resume: ParsedResume) -> Tuple[float, float, Optional[float]]:
    resume_years = sum(exp.years or 0 for exp in resume.workExperience)
    required = _required_years(job)

    if resume_years <= 0 and not resume.workExperience:
        return 0.0, resume_years, required

    if required is None:
        # Neutral: some relevant experience present.
        score = 70.0 if resume.workExperience else 30.0
        return score, resume_years, None

    score = min(100.0, round(resume_years / required * 100, 1))
    return score, resume_years, required


def _score_projects(job: JobAnalysis, resume: ParsedResume) -> float:
    if not resume.projects:
        return 0.0
    required = {_normalize(s) for s in job.requiredSkills}
    project_skills = {
        _normalize(s) for p in resume.projects for s in (p.skills or [])
    }
    overlap = len(required & project_skills)
    relevance = overlap / len(required) if required else 0.5
    count_bonus = min(1.0, len(resume.projects) / 3)
    score = (55 + relevance * 45) * (0.5 + 0.5 * count_bonus)
    return round(min(100.0, score), 1)


def _score_education(job: JobAnalysis, resume: ParsedResume) -> float:
    if not job.education:
        return 75.0  # not specified in JD → neutral
    if not resume.education:
        return 20.0

    resume_text = " ".join(e.degree + " " + e.institution for e in resume.education).lower()
    matched = 0
    for req in job.education:
        keywords = [k for k in re.split(r"[,\s]+", req.lower()) if len(k) > 3]
        if any(k in resume_text for k in keywords):
            matched += 1
    ratio = matched / len(job.education) if job.education else 1.0
    return round(max(40.0, ratio * 100), 1)


def _score_certifications(job: JobAnalysis, resume: ParsedResume) -> float:
    if not job.certifications:
        return 60.0  # not specified in JD → neutral
    if not resume.certifications:
        return 25.0
    resume_text = " ".join(resume.certifications).lower()
    matched = sum(1 for cert in job.certifications if _normalize(cert) in resume_text)
    ratio = matched / len(job.certifications)
    # Partial credit for having any certification.
    any_cert_bonus = 0.3 if resume.certifications else 0
    score = (ratio * 0.7 + any_cert_bonus * 0.3) * 100
    return round(min(100.0, score), 1)


def _score_preferred_skills(job: JobAnalysis, resume: ParsedResume) -> float:
    preferred = [_normalize(s) for s in job.preferredSkills]
    if not preferred:
        return 60.0
    have = {_normalize(s) for s in resume.skills}
    matched = sum(1 for s in preferred if s in have)
    return round(matched / len(preferred) * 100, 1)


# ---------------------------------------------------------------------------
# Narrative builders
# ---------------------------------------------------------------------------
def _build_why_matches(
    job: JobAnalysis,
    resume: ParsedResume,
    matched_required: List[str],
    experience_years: float,
) -> List[MatchReason]:
    reasons: List[MatchReason] = []
    have = {_normalize(s) for s in resume.skills}

    for skill in matched_required[:6]:
        reasons.append(
            MatchReason(
                reason=f"{skill} experience found",
                evidence=f"'{skill}' listed in resume skills",
            )
        )

    if resume.workExperience:
        exp = resume.workExperience[0]
        reasons.append(
            MatchReason(
                reason="Relevant work experience found",
                evidence=f"{experience_years:.0f}+ years across {len(resume.workExperience)} role(s) including {exp.role}",
            )
        )

    if resume.projects:
        reasons.append(
            MatchReason(
                reason="Relevant projects found",
                evidence=f"{len(resume.projects)} project(s) listed (e.g. {resume.projects[0].name})",
            )
        )

    if resume.education:
        top = resume.education[0]
        reasons.append(
            MatchReason(
                reason="Education requirement evaluated",
                evidence=f"{top.degree} at {top.institution}",
            )
        )

    if resume.certifications:
        reasons.append(
            MatchReason(
                reason="Certifications present",
                evidence=", ".join(resume.certifications[:3]),
            )
        )

    for skill in job.preferredSkills:
        if _normalize(skill) in have:
            reasons.append(
                MatchReason(
                    reason=f"Preferred skill '{skill}' found",
                    evidence="Matches a nice-to-have requirement",
                )
            )

    return reasons[:8]


def _build_gaps(job: JobAnalysis, missing_required: List[str], matched_preferred: List[str]) -> List[SkillGap]:
    gaps: List[SkillGap] = []
    for skill in missing_required:
        gaps.append(SkillGap(skill=skill, severity="critical"))
    for skill in job.preferredSkills:
        if _normalize(skill) not in {_normalize(s) for s in matched_preferred} and _normalize(skill) not in {
            _normalize(g.skill) for g in gaps
        }:
            gaps.append(SkillGap(skill=skill, severity="preferred"))
    return gaps[:10]


def _build_strengths(job: JobAnalysis, resume: ParsedResume, top_skills: List[str], experience_years: float) -> List[str]:
    strengths: List[str] = []
    if experience_years > 0:
        strengths.append(f"{experience_years:.0f} years of experience in the field")
    if resume.projects:
        strengths.append(f"Hands-on work on {len(resume.projects)} project(s)")
    if resume.education:
        strengths.append(f"Background in {resume.education[0].degree}")
    if resume.certifications:
        strengths.append(f"Professional certifications ({len(resume.certifications)})")
    if top_skills:
        strengths.append("Core expertise: " + ", ".join(top_skills[:4]))
    if resume.achievements:
        strengths.append(f"Recognized with {len(resume.achievements)} achievement(s)")
    return strengths[:5] or ["Candidate profile extracted from resume"]


def _education_level(resume: ParsedResume) -> str:
    if not resume.education:
        return "Not Found"
    return resume.education[0].degree


def _estimate_communication(job: JobAnalysis, resume: ParsedResume) -> float:
    """Heuristic communication score based on evidence in the resume."""
    text = " ".join(
        [resume.summary or ""] + resume.achievements + [resume.address or ""]
    ).lower()
    score = 60.0
    indicators = ["present", "communicat", "present", "team", "stakeholder",
                  "present", "client", "lead", "mentor", "public", "talk"]
    hits = sum(1 for word in indicators if word in text)
    score += hits * 4
    if resume.achievements:
        score += 5
    if resume.projects:
        score += 3
    return round(min(100.0, score), 1)


def _estimate_leadership(job: JobAnalysis, resume: ParsedResume) -> float:
    text = " ".join([resume.summary or ""] + resume.achievements).lower()
    score = 55.0
    indicators = ["lead", "led", "team", "mentor", "managed", "head", "senior",
                  "architecture", "own", "direct", "hire"]
    hits = sum(1 for word in indicators if word in text)
    score += hits * 5
    if len(resume.workExperience) >= 3:
        score += 5
    if resume.achievements:
        score += 4
    return round(min(100.0, score), 1)


def _estimate_problem_solving(job: JobAnalysis, resume: ParsedResume) -> float:
    score = 62.0
    if resume.projects:
        score += 10 + min(15, len(resume.projects) * 3)
    if resume.workExperience:
        score += min(15, len(resume.workExperience) * 3)
    if resume.achievements:
        score += 5
    return round(min(100.0, score), 1)


def _build_interview_questions(job: JobAnalysis, resume: ParsedResume) -> List[str]:
    questions = []
    required = job.requiredSkills[:4]
    for skill in required:
        questions.append(
            f"Describe your experience using {skill} in a production environment and the challenges you overcame."
        )
    questions.append(
        f"Walk me through the architecture of one of your projects ({resume.projects[0].name if resume.projects else 'most recent'}) and the key engineering decisions you made."
    )
    if resume.workExperience:
        top = resume.workExperience[0]
        questions.append(
            f"At {top.company}, how did you measure the impact of your work as a {top.role}?"
        )
    questions.append(
        "How would you approach debugging a production incident where a model's accuracy drops suddenly?"
    )
    if job.preferredSkills:
        questions.append(
            f"Which of these preferred skills ({', '.join(job.preferredSkills[:3])}) have you used, and where?"
        )
    questions.append(
        "Tell me about a time you disagreed with a teammate on a technical decision and how you resolved it."
    )
    return questions[:6]


def _default_ai_summary(candidate: CandidateAnalysis, job: JobAnalysis) -> str:
    return (
        f"{candidate.name} scored {candidate.overallScore:.0f}% against the {job.title} role. "
        f"Matched {len(candidate.skillsMatch)} required skills; "
        + (
            f"missing {', '.join(candidate.missingSkills[:3])}."
            if candidate.missingSkills
            else "no critical skill gaps identified."
        )
        + f" Recommendation: {candidate.recommendation}."
    )


# ---------------------------------------------------------------------------
# Main entry
# ---------------------------------------------------------------------------
def compute_analysis(job: JobAnalysis, resume: ParsedResume, index: int) -> CandidateAnalysis:
    req_score, matched_required, missing_required = _score_required_skills(job, resume)
    exp_score, experience_years, _ = _score_experience(job, resume)
    proj_score = _score_projects(job, resume)
    edu_score = _score_education(job, resume)
    cert_score = _score_certifications(job, resume)
    pref_score = _score_preferred_skills(job, resume)

    breakdown = ScoreBreakdown(
        requiredSkills=req_score,
        experience=exp_score,
        projects=proj_score,
        education=edu_score,
        certifications=cert_score,
        preferredSkills=pref_score,
    )

    overall = round(
        sum(
            getattr(breakdown, key) * weight
            for key, weight in WEIGHTS.items()
        ),
        1,
    )
    overall = max(0.0, min(100.0, overall))

    top_skills = resume.skills[:6]
    why = _build_why_matches(job, resume, matched_required, experience_years)
    gaps = _build_gaps(job, missing_required, matched_required)

    explanation = (
        f"Candidate matched {len(matched_required)} of {max(1, len(job.requiredSkills))} "
        f"required skills with an overall score of {overall:.0f}%. "
        + (
            f"Experience of {experience_years:.0f} year(s) was found."
            if experience_years > 0
            else "No directly relevant work experience was found."
        )
    )

    analysis = CandidateAnalysis(
        candidateId=f"cand_{index + 1}",
        name=resume.name,
        email=resume.email,
        phone=resume.phone,
        address=resume.address,
        overallScore=overall,
        matchCategory=category_for_score(overall),
        scoreBreakdown=breakdown,
        skillsMatch=matched_required,
        missingSkills=missing_required,
        strengths=_build_strengths(job, resume, top_skills, experience_years),
        whyMatches=why,
        skillGaps=gaps,
        recommendation=recommendation_for_score(overall),
        recommendationExplanation=explanation,
        experienceYears=round(experience_years, 1),
        educationLevel=_education_level(resume),
        topSkills=top_skills,
        certifications=resume.certifications,
    )

    # --- Extended heuristic fields -----------------------------------------
    analysis.communication = _estimate_communication(job, resume)
    analysis.leadership = _estimate_leadership(job, resume)
    analysis.problemSolving = _estimate_problem_solving(job, resume)
    analysis.projects = resume.projects
    analysis.location = resume.address
    analysis.interviewQuestions = _build_interview_questions(job, resume)
    analysis.confidence = round(max(40.0, min(95.0, overall * 0.75 + 15)), 1)
    analysis.hireRecommendation = (
        "Hire" if overall >= 80 else ("Maybe" if overall >= 60 else "Reject")
    )
    analysis.skillMatch = req_score
    analysis.educationMatch = edu_score
    analysis.experienceMatch = exp_score
    analysis.projectsMatch = proj_score
    analysis.overallMatch = overall
    analysis.matchedSkills = list(matched_required)
    analysis.aiSummary = _default_ai_summary(analysis, job)
    return analysis
