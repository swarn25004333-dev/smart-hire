"""AI chat assistant.

Answers recruiter questions about a screening result. Uses Groq (via the OpenAI
SDK) when available, and falls back to a smart offline answer engine built from
the screening data (why a score, missing skills, role fit, interview questions).
"""

import json
import logging
import re
from typing import Any, Dict, List

from app.config import settings
from app.models.schemas import CandidateAnalysis, JobAnalysis
from app.services import ai_service

logger = logging.getLogger("smart-hire.chat")


def _candidate_by_name(candidates: List[Dict[str, Any]], query: str) -> Dict[str, Any]:
    q = query.lower()
    for c in candidates:
        if c.get("name") and c["name"].lower() in q:
            return c
    return None


def _pick_candidate(context: Dict[str, Any], message: str) -> Dict[str, Any]:
    candidates = context.get("candidates") or []
    target = context.get("targetCandidate") or {}
    if target.get("name"):
        return target
    by_name = _candidate_by_name(candidates, message)
    if by_name:
        return by_name
    if candidates:
        return candidates[0]
    return {}


def offline_answer(message: str, context: Dict[str, Any]) -> str:
    """Deterministic, data-aware answers without any external provider."""
    candidates = context.get("candidates") or []
    job = context.get("jobAnalysis") or {}
    q = message.lower()
    cand = _pick_candidate(context, message)

    if not candidates and not cand:
        return (
            "I don't have any screening data yet. Run a screening first and I can "
            "explain scores, missing skills, role fit and interview questions."
        )

    name = cand.get("name", "the candidate")
    score = cand.get("overallScore", 0)
    missing = cand.get("missingSkills") or []
    matched = cand.get("skillsMatch") or cand.get("matchedSkills") or []
    strengths = cand.get("strengths") or []
    weaknesses = cand.get("weaknesses") or []
    recommendation = cand.get("recommendation", "Needs Review")
    required = job.get("requiredSkills") or []

    if "why" in q and ("score" in q or "82" in q or "only" in q):
        exp_years = cand.get("experienceYears", 0)
        explanation = cand.get("recommendationExplanation") or ""
        return (
            f"{name} scored {score:.0f}% because they matched {len(matched)} of "
            f"{len(required) or 'N/A'} required skills"
            + (f" ({', '.join(matched[:5])})" if matched else "")
            + (
                f". Missing: {', '.join(missing[:4])}."
                if missing
                else ". No critical skill gaps."
            )
            + (
                f" They bring {exp_years:.0f} years of experience. "
                if exp_years
                else " "
            )
            + f"Bottom line: {recommendation}."
            + (f" {explanation}" if explanation else "")
        )

    if "skill" in q and ("missing" in q or "gap" in q):
        if not missing:
            return f"{name} covers all required skills — no critical gaps detected. Nice profile."
        gap_lines = "\n".join(f"  •  {s}" for s in missing[:8])
        return (
            f"Here are the skills {name} is currently missing:\n{gap_lines}\n\n"
            "Focus on closing the top gaps to raise their match. I can suggest courses or projects too."
        )

    if "fit" in q or ("role" in q and ("backend" in q or "role" in q)):
        has_backend = any(
            s in " ".join(matched + strengths).lower()
            for s in ["node", "java", "spring", "fastapi", "django", "backend", "api", "express", "mongo"]
        )
        verdict = "a good fit" if has_backend and score >= 65 else "a partial fit"
        return (
            f"Based on the screening, {name} is {verdict} for a backend role "
            f"({recommendation}, {score:.0f}% match). "
            + (
                f"Relevant signals: {', '.join(matched[:4])}. "
                if matched
                else ""
            )
            + (
                f"Watch-outs: {', '.join(weaknesses[:3])}."
                if weaknesses
                else "No major watch-outs."
            )
        )

    if "interview" in q or "question" in q:
        questions = cand.get("interviewQuestions") or []
        if questions:
            qs = "\n".join(f"{i}. {qt}" for i, qt in enumerate(questions[:6], 1))
            return f"Here are tailored interview questions for {name}:\n{qs}"
        return (
            f"For {name}, ask about: {', '.join(matched[:3]) or 'core experience'} "
            "in production, handling scaling challenges, and a recent technical disagreement and how it was resolved."
        )

    if "recommend" in q or "hire" in q:
        return (
            f"Recommendation for {name}: {recommendation} ({score:.0f}% ATS). "
            f"Strengths: {', '.join(strengths[:3]) or 'n/a'}. "
            f"Concerns: {', '.join(weaknesses[:3]) or 'none significant'}."
        )

    if "strength" in q:
        return f"{name}'s top strengths:\n" + "\n".join(f"  •  {s}" for s in strengths[:6]) or "No strengths recorded."

    if "compare" in q or "top" in q:
        ranked = sorted(candidates, key=lambda c: c.get("overallScore", 0), reverse=True)
        if ranked:
            lines = [f"{i + 1}. {c.get('name')} — {c.get('overallScore', 0):.0f}% ({c.get('recommendation')})" for i, c in enumerate(ranked[:5])]
            return "Ranking by ATS score:\n" + "\n".join(lines)
        return "No candidates to compare."

    # Generic summary
    return (
        f"Here's a snapshot of the current screening ({job.get('title', 'the role')}):\n"
        f"  •  Top candidate: {name} at {score:.0f}%.\n"
        f"  •  Matched skills: {', '.join(matched[:6]) or 'n/a'}.\n"
        f"  •  Missing skills: {', '.join(missing[:6]) or 'none'}.\n"
        f"  •  Recommendation: {recommendation}.\n"
        "Try asking: 'Why score only 82?', 'What skills are missing?', "
        "'Can the candidate fit a Backend role?' or 'Generate interview questions.'"
    )


def _build_system_prompt(context: Dict[str, Any]) -> str:
    return (
        "You are Smart Hire AI, an expert technical recruiting assistant. "
        "Answer concisely and helpfully using ONLY the screening data provided. "
        "Never invent facts about candidates that are not present. "
        "If asked for interview questions, generate role-specific ones. "
        "Screening data:\n"
        + json.dumps(context, default=str)
    )


def chat(message: str, context: Dict[str, Any]) -> Dict[str, str]:
    if not settings.ai_enabled:
        logger.info("AI disabled; answering chat from offline engine")
        return {"reply": offline_answer(message, context or {})}

    prompt = f"""User question: {message}

Answer the recruiter's question about the candidate screening. Return plain text."""
    system = _build_system_prompt(context or {})
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.groq_base_url,
            timeout=settings.ai_timeout_seconds,
        )
        completion = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": message},
            ],
            temperature=0.3,
        )
        if completion.choices[0].message.content:
            return {"reply": completion.choices[0].message.content.strip()}
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI chat failed (%s); using offline engine.", ai_service._redact_secrets(str(exc)))

    return {"reply": offline_answer(message, context or {})}
