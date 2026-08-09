"""SQLite persistence layer for Smart Hire.

Provides a thin, thread-safe wrapper around the `sqlite3` module and the
schema used by the platform:

    candidates  – built-in mock candidate profiles
    resumes     – resume files (uploaded or generated)
    screenings  – full screening jobs
    history     – per-candidate screening snapshots (auto-saved)
    reports     – generated screening reports
    settings    – UI/API settings (keys, theme, offline mode)

All data survives restarts because it is stored on disk at `backend/app.db`
(or the path configured with `SMART_HIRE_DB`).
"""

import json
import os
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

_SCHEMA = """
CREATE TABLE IF NOT EXISTS candidates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_key   TEXT UNIQUE,
    name            TEXT NOT NULL,
    photo           TEXT,
    email           TEXT,
    phone           TEXT,
    location        TEXT,
    experience      INTEGER,
    education       TEXT,
    university      TEXT,
    skills          TEXT,
    certifications  TEXT,
    github          TEXT,
    linkedin        TEXT,
    expected_salary TEXT,
    notice_period   TEXT,
    resume_pdf      TEXT,
    resume_summary  TEXT,
    ats_score       REAL,
    communication   REAL,
    leadership      REAL,
    problem_solving REAL,
    overall_match   REAL,
    strengths       TEXT,
    weaknesses      TEXT,
    ai_summary      TEXT,
    projects        TEXT,
    data            TEXT
);

CREATE TABLE IF NOT EXISTS resumes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    filename    TEXT,
    candidate_id INTEGER,
    path        TEXT,
    size        INTEGER,
    uploaded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS screenings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    screening_id    TEXT UNIQUE,
    job_title       TEXT,
    job_description TEXT,
    job_analysis    TEXT,
    engine          TEXT,
    analyzed_at     TEXT,
    result          TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_name     TEXT,
    candidate_name  TEXT,
    candidate_id    TEXT,
    screening_date  TEXT,
    screening_time  TEXT,
    ats_score       REAL,
    recommendation  TEXT,
    job_description TEXT,
    job_title       TEXT,
    missing_skills  TEXT,
    matched_skills  TEXT,
    ai_summary      TEXT,
    engine          TEXT,
    result          TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id       TEXT UNIQUE,
    candidate_name  TEXT,
    resume_name     TEXT,
    job_title       TEXT,
    ats_score       REAL,
    recommendation  TEXT,
    report_path     TEXT,
    report_data     TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
);
"""


def _db_path() -> Path:
    env = os.getenv("SMART_HIRE_DB", "").strip()
    if env:
        path = Path(env)
    else:
        path = Path(__file__).resolve().parent.parent / "smart_hire.db"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


_lock = threading.RLock()


def get_connection() -> sqlite3.Connection:
    """Open a new SQLite connection (check_same_thread disabled + row factory)."""
    conn = sqlite3.connect(str(_db_path()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create tables on first run (idempotent)."""
    with _lock:
        conn = get_connection()
        try:
            conn.executescript(_SCHEMA)
            conn.commit()
        finally:
            conn.close()


def _rows_to_dicts(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
def get_settings() -> Dict[str, Any]:
    with _lock:
        conn = get_connection()
        try:
            rows = conn.execute("SELECT key, value FROM settings").fetchall()
            return {r["key"]: json.loads(r["value"]) for r in rows}
        finally:
            conn.close()


def set_settings(updates: Dict[str, Any]) -> Dict[str, Any]:
    with _lock:
        conn = get_connection()
        try:
            for key, value in updates.items():
                conn.execute(
                    "INSERT INTO settings (key, value) VALUES (?, ?) "
                    "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    (key, json.dumps(value)),
                )
            conn.commit()
        finally:
            conn.close()
    return get_settings()


# ---------------------------------------------------------------------------
# Candidates
# ---------------------------------------------------------------------------
def upsert_candidate(profile: Dict[str, Any]) -> int:
    """Insert or update a candidate profile, returning its id."""
    data = json.dumps(profile, default=str)
    skills = json.dumps(profile.get("skills", []))
    certifications = json.dumps(profile.get("certifications", []))
    strengths = json.dumps(profile.get("strengths", []))
    weaknesses = json.dumps(profile.get("weaknesses", []))
    projects = json.dumps(profile.get("projects", []))
    key = profile.get("candidateKey") or profile.get("candidate_key") or profile.get("id")

    with _lock:
        conn = get_connection()
        try:
            conn.execute(
                """
                INSERT INTO candidates (
                    candidate_key, name, photo, email, phone, location, experience,
                    education, university, skills, certifications, github, linkedin,
                    expected_salary, notice_period, resume_pdf, resume_summary,
                    ats_score, communication, leadership, problem_solving, overall_match,
                    strengths, weaknesses, ai_summary, projects, data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(candidate_key) DO UPDATE SET
                    name = excluded.name,
                    photo = excluded.photo,
                    email = excluded.email,
                    phone = excluded.phone,
                    location = excluded.location,
                    experience = excluded.experience,
                    education = excluded.education,
                    university = excluded.university,
                    skills = excluded.skills,
                    certifications = excluded.certifications,
                    github = excluded.github,
                    linkedin = excluded.linkedin,
                    expected_salary = excluded.expected_salary,
                    notice_period = excluded.notice_period,
                    resume_pdf = excluded.resume_pdf,
                    resume_summary = excluded.resume_summary,
                    ats_score = excluded.ats_score,
                    communication = excluded.communication,
                    leadership = excluded.leadership,
                    problem_solving = excluded.problem_solving,
                    overall_match = excluded.overall_match,
                    strengths = excluded.strengths,
                    weaknesses = excluded.weaknesses,
                    ai_summary = excluded.ai_summary,
                    projects = excluded.projects,
                    data = excluded.data
                """,
                (
                    key, profile.get("name"), profile.get("photo"),
                    profile.get("email"), profile.get("phone"),
                    profile.get("location"), profile.get("experience"),
                    profile.get("education"), profile.get("university"),
                    skills, certifications, profile.get("github"),
                    profile.get("linkedin"), profile.get("expectedSalary"),
                    profile.get("noticePeriod"), profile.get("resumePdf"),
                    profile.get("resumeSummary"), profile.get("atsScore"),
                    profile.get("communication"), profile.get("leadership"),
                    profile.get("problemSolving"), profile.get("overallMatch"),
                    strengths, weaknesses, profile.get("aiSummary"),
                    projects, data,
                ),
            )
            conn.commit()
            row = conn.execute("SELECT id FROM candidates WHERE candidate_key = ?", (key,)).fetchone()
            return row["id"] if row else 0
        finally:
            conn.close()


def list_candidates() -> List[Dict[str, Any]]:
    with _lock:
        conn = get_connection()
        try:
            rows = conn.execute("SELECT * FROM candidates ORDER BY overall_match DESC").fetchall()
            return _rows_to_dicts(rows)
        finally:
            conn.close()


def get_candidate(candidate_id: int) -> Optional[Dict[str, Any]]:
    with _lock:
        conn = get_connection()
        try:
            row = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


def delete_candidate(candidate_id: int) -> bool:
    with _lock:
        conn = get_connection()
        try:
            cur = conn.execute("DELETE FROM candidates WHERE id = ?", (candidate_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Resumes
# ---------------------------------------------------------------------------
def add_resume(filename: str, path: str, size: int, candidate_id: Optional[int] = None) -> int:
    with _lock:
        conn = get_connection()
        try:
            cur = conn.execute(
                "INSERT INTO resumes (filename, candidate_id, path, size) VALUES (?, ?, ?, ?)",
                (filename, candidate_id, path, size),
            )
            conn.commit()
            return cur.lastrowid
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Screenings
# ---------------------------------------------------------------------------
def save_screening(screening_id: str, job_title: str, job_description: str,
                   job_analysis: Dict[str, Any], engine: str,
                   analyzed_at: str, result: Dict[str, Any]) -> int:
    with _lock:
        conn = get_connection()
        try:
            cur = conn.execute(
                "INSERT INTO screenings (screening_id, job_title, job_description, job_analysis, engine, analyzed_at, result) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    screening_id, job_title, job_description,
                    json.dumps(job_analysis, default=str), engine, analyzed_at,
                    json.dumps(result, default=str),
                ),
            )
            conn.commit()
            return cur.lastrowid
        finally:
            conn.close()


def list_screenings(limit: int = 100) -> List[Dict[str, Any]]:
    with _lock:
        conn = get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM screenings ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
            return _rows_to_dicts(rows)
        finally:
            conn.close()


def get_screening(screening_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        conn = get_connection()
        try:
            row = conn.execute("SELECT * FROM screenings WHERE screening_id = ?", (screening_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
def add_history(entry: Dict[str, Any]) -> int:
    with _lock:
        conn = get_connection()
        try:
            cur = conn.execute(
                """
                INSERT INTO history (
                    resume_name, candidate_name, candidate_id, screening_date,
                    screening_time, ats_score, recommendation, job_description,
                    job_title, missing_skills, matched_skills, ai_summary,
                    engine, result
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    entry.get("resumeName"), entry.get("candidateName"),
                    entry.get("candidateId"), entry.get("screeningDate"),
                    entry.get("screeningTime"), entry.get("atsScore"),
                    entry.get("recommendation"), entry.get("jobDescription"),
                    entry.get("jobTitle"), json.dumps(entry.get("missingSkills", []), default=str),
                    json.dumps(entry.get("matchedSkills", []), default=str),
                    entry.get("aiSummary"), entry.get("engine"),
                    json.dumps(entry.get("result", {}), default=str),
                ),
            )
            conn.commit()
            return cur.lastrowid
        finally:
            conn.close()


def list_history(limit: int = 200) -> List[Dict[str, Any]]:
    with _lock:
        conn = get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM history ORDER BY created_at DESC, id DESC LIMIT ?", (limit,)
            ).fetchall()
            out = []
            for r in rows:
                d = dict(r)
                for field in ("missing_skills", "matched_skills"):
                    try:
                        d[field] = json.loads(d[field] or "[]")
                    except (ValueError, TypeError):
                        d[field] = []
                try:
                    d["result"] = json.loads(d["result"] or "{}")
                except (ValueError, TypeError):
                    d["result"] = {}
                out.append(d)
            return out
        finally:
            conn.close()


def get_history(history_id: int) -> Optional[Dict[str, Any]]:
    with _lock:
        conn = get_connection()
        try:
            row = conn.execute("SELECT * FROM history WHERE id = ?", (history_id,)).fetchone()
            if not row:
                return None
            d = dict(row)
            for field in ("missing_skills", "matched_skills"):
                try:
                    d[field] = json.loads(d[field] or "[]")
                except (ValueError, TypeError):
                    d[field] = []
            try:
                d["result"] = json.loads(d["result"] or "{}")
            except (ValueError, TypeError):
                d["result"] = {}
            return d
        finally:
            conn.close()


def delete_history(history_id: int) -> bool:
    with _lock:
        conn = get_connection()
        try:
            cur = conn.execute("DELETE FROM history WHERE id = ?", (history_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
def save_report(report_id: str, candidate_name: str, resume_name: str, job_title: str,
                ats_score: float, recommendation: str, report_path: str,
                report_data: Dict[str, Any]) -> int:
    with _lock:
        conn = get_connection()
        try:
            cur = conn.execute(
                "INSERT INTO reports (report_id, candidate_name, resume_name, job_title, "
                "ats_score, recommendation, report_path, report_data, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    report_id, candidate_name, resume_name, job_title,
                    ats_score, recommendation, report_path,
                    json.dumps(report_data, default=str),
                    datetime.now().isoformat(),
                ),
            )
            conn.commit()
            return cur.lastrowid
        finally:
            conn.close()


def list_reports(limit: int = 100) -> List[Dict[str, Any]]:
    with _lock:
        conn = get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM reports ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
            return _rows_to_dicts(rows)
        finally:
            conn.close()


def get_report(report_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        conn = get_connection()
        try:
            row = conn.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
def analytics_overview() -> Dict[str, Any]:
    """Aggregate statistics across candidates + history for the analytics page."""
    with _lock:
        conn = get_connection()
        try:
            cand = conn.execute("SELECT COUNT(*) AS n, AVG(ats_score) AS avg_ats FROM candidates").fetchone()
            hist = conn.execute("SELECT COUNT(*) AS n FROM history").fetchall()
            screen = conn.execute("SELECT COUNT(*) AS n FROM screenings").fetchall()
            return {
                "totalCandidates": cand["n"] or 0,
                "averageATS": round(cand["avg_ats"] or 0, 1),
                "totalScreenings": screen[0]["n"] if screen else 0,
                "totalHistory": hist[0]["n"] if hist else 0,
            }
        finally:
            conn.close()
