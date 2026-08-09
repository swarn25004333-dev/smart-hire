"""Unit tests for Smart Hire resume parser."""

import unittest
from app.services.resume_parser import (
    _matches,
    _guess_name,
    _extract_skills,
    parse_resume_bytes,
)


class TestResumeParser(unittest.TestCase):

    def test_matches_skill_boundary(self):
        text = "Experienced Senior Python Developer with React and AWS skills."
        self.assertTrue(_matches(text, "Python"))
        self.assertTrue(_matches(text, "React"))
        self.assertTrue(_matches(text, "AWS"))
        self.assertFalse(_matches(text, "Go"))

    def test_guess_name(self):
        text = "Name: John Doe\nEmail: john.doe@example.com\nPhone: +1 555-0199"
        name = _guess_name(text)
        self.assertEqual(name, "John Doe")

    def test_extract_skills(self):
        lines = ["Skills:", "Python, FastAPI, Docker, PostgreSQL, TypeScript"]
        skills = [s.lower() for s in _extract_skills(lines)]
        self.assertIn("python", skills)
        self.assertIn("fastapi", skills)
        self.assertIn("docker", skills)
        self.assertIn("postgresql", skills)
        self.assertIn("typescript", skills)

    def test_parse_resume_txt_bytes(self):
        resume_text = (
            "Name: Alex Mercer\n"
            "alex.mercer@example.com | +1 (555) 123-4567\n"
            "Summary:\n"
            "Innovative Full Stack Developer with 5 years experience.\n"
            "Education:\n"
            "B.S. in Computer Science - Stanford University\n"
            "Experience:\n"
            "Software Engineer at Acme Corp (2020-2023)\n"
            "Skills:\n"
            "Python, JavaScript, React, Docker, Kubernetes, AWS\n"
        )
        parsed = parse_resume_bytes(resume_text.encode("utf-8"), "alex_mercer.txt")
        self.assertEqual(parsed.name, "Alex Mercer")
        self.assertEqual(parsed.email, "alex.mercer@example.com")
        skills_lower = [s.lower() for s in parsed.skills]
        self.assertIn("python", skills_lower)


if __name__ == "__main__":
    unittest.main()
