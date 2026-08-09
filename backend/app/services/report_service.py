"""Professional screening report generator (PDF).

Renders a polished, multi-section candidate report with:

  - header + candidate summary
  - ATS score gauge
  - score breakdown bar chart
  - matched / missing skills
  - strengths & weaknesses
  - AI summary + recommendation
  - interview questions

Uses PyMuPDF (already a project dependency) so no extra packages are needed.
"""

import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from app.models.schemas import CandidateAnalysis, JobAnalysis

logger = logging.getLogger("smart-hire.reports")

REPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "reports"

# Palette
CYAN = (0.0, 0.898, 1.0)
INDIGO = (0.31, 0.275, 0.898)
VIOLET = (0.486, 0.227, 0.93)
DARK = (0.08, 0.1, 0.17)
TEXT = (0.24, 0.28, 0.38)
MUTED = (0.45, 0.5, 0.62)
GREEN = (0.03, 0.59, 0.4)
RED = (0.86, 0.17, 0.17)
AMBER = (0.85, 0.6, 0.04)


def _score_color(score: float):
    if score >= 90:
        return GREEN
    if score >= 75:
        return CYAN
    if score >= 60:
        return AMBER
    return RED


def _wrap_lines(doc, text, fontname, size, max_width):
    import fitz

    words = text.split()
    lines = []
    current = ""
    for word in words:
        trial = (current + " " + word).strip()
        if fitz.get_text_length(trial, fontname=fontname, fontsize=size) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _draw_textbox(page, rect, lines, fontname, size, color=TEXT, lineheight=1.3):
    page.insert_textbox(
        rect,
        "\n".join(lines),
        fontname=fontname,
        fontsize=size,
        color=color,
        lineheight=lineheight,
    )


def generate_candidate_report(
    candidate: CandidateAnalysis,
    job: JobAnalysis,
    resume_name: str = "",
) -> Dict[str, Any]:
    """Build and persist a PDF report; returns report metadata."""
    import fitz
    import math

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_id = f"rep-{uuid.uuid4().hex[:8]}"
    date_str = datetime.now().strftime("%d %b %Y, %H:%M")
    file_name = f"{report_id}.pdf"
    out_path = REPORTS_DIR / file_name

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)

    # Header
    page.draw_rect((0, 0, 595, 96), color=None, fill=DARK)
    page.draw_rect((0, 96, 595, 100), color=None, fill=CYAN)
    page.insert_text((40, 42), "SMART HIRE AI", fontname="hebo", fontsize=15, color=CYAN)
    page.insert_text((40, 62), "Candidate Screening Report", fontname="hebo", fontsize=22, color=(1, 1, 1))
    page.insert_text((40, 82), f"Generated {date_str}", fontname="helv", fontsize=9, color=(0.7, 0.75, 0.85))
    page.insert_text((430, 62), "ATS Score", fontname="hebo", fontsize=11, color=(0.7, 0.75, 0.85))

    # Gauge (semicircle approximation with arc segments)
    score = max(0.0, min(100.0, candidate.overallScore))
    gauge_cx, gauge_cy, gauge_r = 500, 86, 32
    for i in range(1, 21):
        start = 180 + (i - 1) * 9
        end = 180 + i * 9
        color = _score_color(score)
        page.draw_line(
            (gauge_cx + gauge_r * 0.8 * math.cos(start * math.pi / 180),
             gauge_cy - gauge_r * 0.8 * math.sin(start * math.pi / 180)),
            (gauge_cx + gauge_r * 0.8 * math.cos(end * math.pi / 180),
             gauge_cy - gauge_r * 0.8 * math.sin(end * math.pi / 180)),
            color=color,
            width=5,
        )
    page.insert_text((471, 92), f"{score:.0f}%", fontname="hebo", fontsize=15, color=(1, 1, 1))

    y = 128

    def section(title):
        nonlocal y
        page.draw_line((40, y - 6), (150, y - 6), color=CYAN, width=2)
        page.insert_text((40, y), title.upper(), fontname="hebo", fontsize=12, color=DARK)
        y += 8
        return y

    def body(text, size=9.5):
        nonlocal y
        lines = _wrap_lines(doc, text, "helv", size, 505)
        height = len(lines) * size * 1.35 + 4
        _draw_textbox(page, (40, y, 545, y + height), lines, "helv", size)
        y += height

    # Candidate summary
    section("Candidate")
    body(f"{candidate.name}  ·  {candidate.email}  ·  {candidate.phone}", size=10)
    if candidate.location:
        body(f"Location: {candidate.location}")
    body(
        f"Experience: {candidate.experienceYears:.0f} years  ·  "
        f"Education: {candidate.educationLevel}  ·  "
        f"Notice: {candidate.noticePeriod}  ·  "
        f"Expected: {candidate.expectedSalary}"
    )
    y += 6

    # Score breakdown bar chart
    section("Score Breakdown")
    breakdown = candidate.scoreBreakdown.model_dump()
    labels = [
        ("requiredSkills", "Required Skills", CYAN),
        ("experience", "Experience", INDIGO),
        ("projects", "Projects", VIOLET),
        ("education", "Education", (0.02, 0.75, 0.83)),
        ("certifications", "Certifications", (0.03, 0.65, 0.42)),
        ("preferredSkills", "Preferred", AMBER),
    ]
    chart_x0, chart_x1 = 40, 545
    chart_y0 = y
    for idx, (key, label, color) in enumerate(labels):
        row_y = chart_y0 + idx * 22
        value = min(100.0, float(breakdown.get(key, 0)))
        page.insert_text((40, row_y + 10), label, fontname="helv", fontsize=8.5, color=MUTED)
        bar_w = (chart_x1 - 170) * (value / 100)
        page.draw_rect((170, row_y, 170 + bar_w, row_y + 10), color=None, fill=color)
        page.insert_text((170 + bar_w + 6, row_y + 10), f"{value:.0f}%", fontname="hebo", fontsize=8.5, color=DARK)
    y = chart_y0 + len(labels) * 22 + 8

    # Skills
    section("Skills")
    matched = candidate.matchedSkills or candidate.skillsMatch or []
    missing = candidate.missingSkills or []
    if matched:
        body("Matched Skills:  " + ", ".join(matched))
    if missing:
        body("Missing Skills:  " + ", ".join(missing), size=9.5)
    y += 4

    # Strengths & Weaknesses (two columns)
    section("Strengths & Weaknesses")
    strengths = candidate.strengths or []
    weaknesses = candidate.weaknesses or []
    col_top = y
    page.insert_text((40, y), "STRENGTHS", fontname="hebo", fontsize=10, color=GREEN)
    page.insert_text((320, y), "WEAKNESSES", fontname="hebo", fontsize=10, color=RED)
    y += 8
    strength_lines = []
    for s in strengths:
        strength_lines.append("\u2022  " + s)
        for sub in _wrap_lines(doc, s, "helv", 9, 250):
            strength_lines.append("     " + sub)
    weak_lines = []
    for w in weaknesses:
        weak_lines.append("\u2022  " + w)
        for sub in _wrap_lines(doc, w, "helv", 9, 210):
            weak_lines.append("     " + sub)
    _draw_textbox(page, (40, y, 295, y + 120), strength_lines, "helv", 9, TEXT)
    _draw_textbox(page, (320, y, 545, y + 120), weak_lines, "helv", 9, TEXT)
    y += 130

    # AI summary + recommendation
    section("AI Summary & Recommendation")
    body(candidate.aiSummary or candidate.recommendationExplanation or "No AI summary available.")
    rec_color = _score_color(score)
    page.insert_text((40, y + 6), "Recommendation:", fontname="hebo", fontsize=10, color=DARK)
    page.insert_text((140, y + 6), candidate.recommendation.upper(), fontname="hebo", fontsize=10, color=rec_color)
    y += 18

    # Interview questions
    questions = candidate.interviewQuestions or []
    if questions:
        y += 4
        section("Suggested Interview Questions")
        for i, q in enumerate(questions[:6], 1):
            body(f"{i}. {q}", size=9)
            y += 2

    doc.save(str(out_path))
    doc.close()

    metadata = {
        "reportId": report_id,
        "candidateName": candidate.name,
        "resumeName": resume_name,
        "jobTitle": job.title,
        "atsScore": candidate.overallScore,
        "recommendation": candidate.recommendation,
        "reportPath": str(out_path),
        "createdAt": date_str,
    }
    return metadata


def simple_job(job_title: str = "Professional") -> JobAnalysis:
    """Minimal JobAnalysis used when reporting on a stored candidate."""
    return JobAnalysis(title=job_title or "Professional")


def build_report_json(
    candidate: CandidateAnalysis,
    job: JobAnalysis,
    resume_name: str = "",
) -> Dict[str, Any]:
    """Return a JSON-safe report payload (used for the Reports page + DB)."""
    return {
        "candidate": candidate.model_dump(),
        "job": job.model_dump(),
        "resumeName": resume_name,
        "generatedAt": datetime.now().isoformat(),
    }
