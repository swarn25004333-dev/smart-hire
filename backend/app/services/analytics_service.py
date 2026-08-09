"""Analytics aggregation service.

Builds the datasets used by the Analytics page from the mock candidate pool
plus the persisted screening history:
  - resume upload trend (by day)
  - average ATS
  - top / most common skills & technologies
  - most common missing skills
  - hiring recommendation distribution
  - experience & education distribution
"""

from collections import Counter
from typing import Any, Dict, List

from app.database import list_history
from app.services.mock_candidates import load_profiles


def _distribute(values: List[Any]) -> List[Dict[str, Any]]:
    counter = Counter(values)
    return [{"name": k, "value": v} for k, v in counter.most_common()]


def _bucket_experience(years) -> str:
    try:
        y = float(years)
    except (TypeError, ValueError):
        return "Unknown"
    if y < 2:
        return "0-2 yrs"
    if y < 5:
        return "2-5 yrs"
    if y < 8:
        return "5-8 yrs"
    return "8+ yrs"


def _bucket_education(level: str) -> str:
    low = (level or "").lower()
    if any(k in low for k in ["ph.d", "phd", "doctorate"]):
        return "PhD"
    if any(k in low for k in ["m.tech", "m.sc", "m.c.a", "master", "mba", "m.e"]):
        return "Master's"
    if any(k in low for k in ["b.tech", "b.sc", "b.e", "b.c.a", "bachelor", "b.a"]):
        return "Bachelor's"
    if low:
        return "Other"
    return "Unknown"


def get_analytics() -> Dict[str, Any]:
    profiles = load_profiles()
    history = list_history(limit=500)

    # Resume upload trend (last 14 days, from history timestamps).
    trend: Dict[str, int] = {}
    for entry in history:
        day = (entry.get("created_at") or entry.get("screening_date") or "")[:10]
        if day:
            trend[day] = trend.get(day, 0) + 1
    if not trend:
        trend["Today"] = len(history)

    top_skills: Counter = Counter()
    missing_skills: Counter = Counter()
    tech_counter: Counter = Counter()
    recommendation: Counter = Counter()
    exp_dist: Counter = Counter()
    edu_dist: Counter = Counter()
    matched_total = 0

    for p in profiles:
        for s in p.get("skills") or []:
            top_skills[s] += 1
            tech_counter[s] += 1
        for m in p.get("missingSkills") or []:
            missing_skills[m] += 1
        recommendation[(p.get("hireRecommendation") or "Maybe")] += 1
        exp_dist[_bucket_experience(p.get("experience"))] += 1
        edu_dist[_bucket_education(p.get("education"))] += 1

    # Also fold screened (uploaded) candidates from history into the mix.
    for entry in history:
        result = entry.get("result") or {}
        candidates = result.get("candidates") or []
        for c in candidates:
            for s in (c.get("topSkills") or []):
                top_skills[s] += 1
                tech_counter[s] += 1
            for s in (c.get("missingSkills") or []):
                missing_skills[s] += 1
            recommendation[(c.get("hireRecommendation") or "Maybe")] += 1
            exp_dist[_bucket_experience(c.get("experienceYears"))] += 1
            edu_dist[_bucket_education(c.get("educationLevel"))] += 1

    avg_ats = 0.0
    scores = [float(p.get("atsScore") or 0) for p in profiles]
    for entry in history:
        result = entry.get("result") or {}
        scores += [float(c.get("overallScore") or 0) for c in (result.get("candidates") or [])]
    if scores:
        avg_ats = round(sum(scores) / len(scores), 1)

    def chart(counter: Counter, limit: int = 8) -> List[Dict[str, Any]]:
        return [{"name": k, "value": v} for k, v in counter.most_common(limit)]

    return {
        "overview": {
            "totalCandidates": len(profiles),
            "totalScreenings": len(history),
            "averageATS": avg_ats,
            "recommendations": [
                {"name": k, "value": v} for k, v in recommendation.most_common()
            ],
        },
        "uploadTrend": [{"name": k, "value": v} for k, v in trend.items()],
        "topSkills": chart(top_skills, 10),
        "missingSkills": chart(missing_skills, 10),
        "mostCommonTechnologies": chart(tech_counter, 10),
        "experienceDistribution": [{"name": k, "value": v} for k, v in exp_dist.most_common()],
        "educationDistribution": [{"name": k, "value": v} for k, v in edu_dist.most_common()],
    }
