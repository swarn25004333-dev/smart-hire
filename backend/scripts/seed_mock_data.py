"""Generate Smart Hire mock data assets.

Creates:
  - realistic one-page resume PDFs for every candidate
      backend/mock_data/resumes/<candidate_key>_resume.pdf
  - simple SVG avatar photos
      backend/mock_data/photos/<candidate_key>.svg
  - seeds the SQLite database with the 8 candidate profiles

Run from the backend directory:
    .venv\\Scripts\\python.exe -m scripts.seed_mock_data
"""

import json
import math
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
MOCK_DIR = BACKEND / "mock_data"
RESUMES_DIR = MOCK_DIR / "resumes"
PHOTOS_DIR = MOCK_DIR / "photos"

ACCENT = (0.0, 0.9, 1.0)  # cyan
DARK = (0.07, 0.09, 0.16)
TEXT = (0.22, 0.26, 0.36)
MUTED = (0.45, 0.5, 0.6)


def _hex(color):
    r, g, b = color
    return "#{:02x}{:02x}{:02x}".format(int(r * 255), int(g * 255), int(b * 255))


def generate_resume_pdf(profile: dict, out_path: Path) -> None:
    """Render a clean, single-page professional resume for a candidate."""
    import fitz

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    page.draw_rect((0, 0, 595, 842), color=None, fill=(1, 1, 1))

    # Header band
    page.draw_rect((0, 0, 595, 118), color=None, fill=DARK)
    page.draw_rect((0, 118, 595, 122), color=None, fill=ACCENT)

    name = profile["name"]
    role = profile.get("role", "Professional")
    page.insert_text((42, 52), name.upper(), fontname="hebo", fontsize=22, color=(1, 1, 1))
    page.insert_text((42, 74), role, fontname="helv", fontsize=12, color=ACCENT)

    contact = " | ".join(
        filter(
            None,
            [
                profile.get("email", ""),
                profile.get("phone", ""),
                profile.get("location", ""),
                profile.get("linkedin", ""),
                profile.get("github", ""),
            ],
        )
    )
    page.insert_text((42, 96), contact, fontname="helv", fontsize=9, color=(0.85, 0.88, 0.94))

    y = 150

    def section(title):
        nonlocal y
        page.draw_line((42, y), (120, y), color=ACCENT, width=2)
        page.insert_text((42, y - 8), title.upper(), fontname="hebo", fontsize=12, color=DARK)
        y += 8
        return y

    def body(text, size=9.5, indent=42):
        nonlocal y
        height = fitz.get_text_length(text, fontname="helv", fontsize=size)
        lines = max(1, math.ceil(height / 480))
        page.insert_textbox(
            (indent, y, 545, y + lines * 14 + 10),
            text,
            fontname="helv",
            fontsize=size,
            color=TEXT,
        )
        y += lines * 14 + 4

    def entry(left, right, bold_left=True):
        nonlocal y
        font = "hebo" if bold_left else "helv"
        page.insert_text((42, y), left, fontname=font, fontsize=10.5, color=DARK)
        if right:
            page.insert_text((545 - fitz.get_text_length(right, fontname="helv", fontsize=9.5), y), right,
                             fontname="helv", fontsize=9.5, color=MUTED)
        y += 15

    # Summary
    section("Professional Summary")
    body(profile["resumeSummary"])
    y += 6

    # Skills
    section("Core Skills")
    skills = profile.get("skills", [])
    half = math.ceil(len(skills) / 2)
    left_col = "  \u00b7  ".join(skills[:half])
    right_col = "  \u00b7  ".join(skills[half:])
    page.insert_textbox((42, y, 300, y + 60), left_col, fontname="helv", fontsize=9, color=TEXT)
    page.insert_textbox((320, y, 545, y + 60), right_col, fontname="helv", fontsize=9, color=TEXT)
    y += 60
    y += 4

    # Experience
    section("Professional Experience")
    for exp in profile.get("experienceTimeline", [])[:3]:
        entry(exp["role"], exp.get("duration", ""))
        page.insert_text((42, y), exp["company"], fontname="helv", fontsize=9.5, color=MUTED)
        y += 14
        for bullet in exp.get("description", [])[:3]:
            lines = math.ceil(fitz.get_text_length(bullet, fontname="helv", fontsize=9) / 470)
            page.insert_textbox(
                (58, y, 545, y + lines * 13 + 8),
                bullet,
                fontname="helv",
                fontsize=9,
                color=TEXT,
            )
            y += lines * 13 + 2
        y += 4

    y += 6

    # Projects
    section("Key Projects")
    for proj in profile.get("projects", [])[:3]:
        entry(proj["name"], "")
        page.insert_text((42, y), ", ".join(proj.get("skills", [])[:4]), fontname="helv", fontsize=8.5, color=ACCENT)
        y += 13
        lines = math.ceil(fitz.get_text_length(proj["description"], fontname="helv", fontsize=9) / 470)
        page.insert_textbox(
            (58, y, 545, y + lines * 13 + 8),
            proj["description"],
            fontname="helv",
            fontsize=9,
            color=TEXT,
        )
        y += lines * 13 + 4

    y += 6

    # Education + Certifications
    section("Education")
    for edu in profile.get("educationHistory", [])[:1]:
        entry(edu["degree"], edu.get("year", ""))
        page.insert_text((42, y), edu["institution"], fontname="helv", fontsize=9.5, color=MUTED)
        y += 13

    certs = profile.get("certifications", [])
    if certs:
        y += 6
        section("Certifications")
        page.insert_textbox(
            (42, y, 545, y + 80),
            "\n".join("\u00b7  " + c for c in certs),
            fontname="helv",
            fontsize=9,
            color=TEXT,
        )

    doc.save(str(out_path))
    doc.close()


def generate_avatar_svg(profile: dict, out_path: Path) -> None:
    """Write a simple, colorful initial-based SVG avatar."""
    name = profile["name"]
    initials = "".join(part[0] for part in name.split()[:2]).upper()
    palettes = [
        ("#00E5FF", "#4F46E5"),
        ("#7C3AED", "#EC4899"),
        ("#10B981", "#06B6D4"),
        ("#F59E0B", "#EF4444"),
    ]
    g1, g2 = palettes[(profile["id"] or 0) % len(palettes)]
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{g1}"/>
      <stop offset="100%" stop-color="{g2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="150" fill="url(#g)"/>
  <text x="150" y="176" font-family="Segoe UI, Arial, sans-serif" font-size="110"
        font-weight="bold" fill="rgba(255,255,255,0.95)" text-anchor="middle">{initials}</text>
</svg>"""
    out_path.write_text(svg, encoding="utf-8")


def load_profiles() -> list:
    with open(MOCK_DIR / "candidates.json", "r", encoding="utf-8") as fh:
        return json.load(fh)


def main() -> int:
    sys.path.insert(0, str(BACKEND))
    from app.database import init_db, upsert_candidate

    RESUMES_DIR.mkdir(parents=True, exist_ok=True)
    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    init_db()

    profiles = load_profiles()
    for profile in profiles:
        pdf_name = profile["resumePdf"]
        pdf_path = RESUMES_DIR / pdf_name
        if not pdf_path.exists():
            generate_resume_pdf(profile, pdf_path)
            print("generated resume:", pdf_path.name)
        else:
            print("resume exists:", pdf_path.name)

        photo_name = profile["photo"]
        photo_path = PHOTOS_DIR / photo_name
        if not photo_path.exists():
            generate_avatar_svg(profile, photo_path)
            print("generated photo:", photo_path.name)
        else:
            print("photo exists:", photo_path.name)

        profile["resumePdfPath"] = str(pdf_path)
        profile["photoPath"] = str(photo_path)
        upsert_candidate(profile)
        print("seeded candidate:", profile["name"])

    print("Done. %d candidates seeded." % len(profiles))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
