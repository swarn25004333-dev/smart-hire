"""Security and rate-limit tests for the Smart Hire backend.

Covers:
- HTTP 429 after a rate limit is exceeded (exact JSON contract).
- API keys loaded from environment variables.
- API keys never exposed in API responses.
- Offline heuristic engine keeps the app working without an API key.
"""

import importlib
import os
import unittest
from unittest import mock

from fastapi.testclient import TestClient

from app.config import Settings, settings
from app.main import app
from app.rate_limit import limiter
from app.services import ai_service
from app.models.schemas import JobAnalysis

client = TestClient(app)

JOB_TEXT = """Senior Fullstack Developer
We are hiring a Senior React and Node.js Developer with 5+ years of
frontend experience. Must know Python, FastAPI and PostgreSQL.
"""

RESUME_TEXT = (
    b"Name: Sarah Connor\n"
    b"Email: sarah@skynet.com\n"
    b"Phone: +1 555 0100\n"
    b"Skills: Python, React, Node.js, PostgreSQL, FastAPI\n"
    b"Work Experience: 4 years as Backend Engineer at Skynet Labs."
)

COMPARE_PAYLOAD = {
    "jobAnalysis": {
        "title": "Senior Developer",
        "requiredSkills": ["Python", "React"],
        "preferredSkills": ["Docker"],
        "experience": "4+ years",
        "education": [],
        "certifications": [],
        "keyResponsibilities": [],
    },
    "candidates": [
        {
            "candidateId": "cand_1",
            "name": "Sarah Connor",
            "email": "sarah@skynet.com",
            "phone": "+1 555 0100",
            "overallScore": 88.0,
            "matchCategory": "good",
            "scoreBreakdown": {
                "requiredSkills": 90.0,
                "experience": 85.0,
                "projects": 80.0,
                "education": 70.0,
                "certifications": 60.0,
                "preferredSkills": 75.0,
            },
            "skillsMatch": ["Python", "React"],
            "missingSkills": [],
            "strengths": [],
            "whyMatches": [],
            "skillGaps": [],
            "recommendation": "Good Match",
            "recommendationExplanation": "",
            "experienceYears": 4.0,
            "educationLevel": "BSc",
            "topSkills": ["Python", "React"],
            "certifications": [],
        }
    ],
}


def _patch_provider_failure():
    """Force AI provider failure so every endpoint uses the heuristic engine.

    Avoids real network calls during tests and keeps them fast/deterministic.
    """
    return mock.patch.object(
        ai_service,
        "_structured_json",
        side_effect=RuntimeError("No AI provider configured"),
    )


class TestRateLimits(unittest.TestCase):
    def _assert_429(self, response):
        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json(),
            {"detail": "Rate limit exceeded. Please try again later."},
        )

    def test_analyze_job_rate_limit(self):
        limiter.reset()
        with _patch_provider_failure():
            for _ in range(10):
                self.assertEqual(
                    client.post("/api/analyze-job", json={"job_description": JOB_TEXT}).status_code,
                    200,
                )
        self._assert_429(client.post("/api/analyze-job", json={"job_description": JOB_TEXT}))

    def test_parse_resume_rate_limit(self):
        limiter.reset()
        files = [("resume", ("sarah.txt", RESUME_TEXT, "text/plain"))]
        for _ in range(20):
            self.assertEqual(client.post("/api/parse-resume", files=files).status_code, 200)
        self._assert_429(client.post("/api/parse-resume", files=files))

    def test_screen_rate_limit(self):
        limiter.reset()
        with _patch_provider_failure():
            data = {"job_description": JOB_TEXT, "blind_screening": "false"}
            files = [("resumes", ("sarah.txt", RESUME_TEXT, "text/plain"))]
            for _ in range(5):
                self.assertEqual(client.post("/api/screen", data=data, files=files).status_code, 200)
        self._assert_429(client.post("/api/screen", data=data, files=files))

    def test_compare_rate_limit(self):
        limiter.reset()
        for _ in range(10):
            self.assertEqual(
                client.post("/api/compare-candidates", json=COMPARE_PAYLOAD).status_code,
                200,
            )
        self._assert_429(client.post("/api/compare-candidates", json=COMPARE_PAYLOAD))

    def test_general_rate_limit(self):
        limiter.reset()
        for _ in range(60):
            self.assertEqual(client.get("/api/health").status_code, 200)
        self._assert_429(client.get("/api/health"))


class TestApiKeyHandling(unittest.TestCase):
    def test_api_key_loaded_from_environment(self):
        import app.config as config_module

        originals = {
            "GEMINI_API_KEY": os.environ.get("GEMINI_API_KEY"),
            "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY"),
        }
        try:
            os.environ["GEMINI_API_KEY"] = "gemini-env-test-key"
            os.environ["OPENAI_API_KEY"] = ""
            importlib.reload(config_module)
            self.assertEqual(config_module.settings.gemini_api_key, "gemini-env-test-key")
            self.assertTrue(config_module.settings.ai_enabled)
        finally:
            for name, value in originals.items():
                if value is None:
                    os.environ.pop(name, None)
                else:
                    os.environ[name] = value
            importlib.reload(config_module)

    def test_api_key_never_exposed_in_any_response(self):
        secret = "SUPER_SECRET_TEST_KEY_ABC123"
        limiter.reset()
        with mock.patch.object(settings, "gemini_api_key", secret), _patch_provider_failure():
            responses = []
            responses.append(client.get("/api/health"))
            responses.append(client.post("/api/analyze-job", json={"job_description": JOB_TEXT}))
            responses.append(
                client.post(
                    "/api/parse-resume",
                    files=[("resume", ("sarah.txt", RESUME_TEXT, "text/plain"))],
                )
            )
            responses.append(
                client.post(
                    "/api/screen",
                    data={"job_description": JOB_TEXT, "blind_screening": "false"},
                    files=[("resumes", ("sarah.txt", RESUME_TEXT, "text/plain"))],
                )
            )
            responses.append(client.post("/api/compare-candidates", json=COMPARE_PAYLOAD))

        for response in responses:
            self.assertEqual(response.status_code, 200)
            self.assertNotIn(secret, response.text)

    def test_redact_secrets_in_logs(self):
        with mock.patch.object(settings, "gemini_api_key", "SK-TOP-SECRET"):
            redacted = ai_service._redact_secrets("Request failed with key SK-TOP-SECRET")
        self.assertNotIn("SK-TOP-SECRET", redacted)
        self.assertIn("[REDACTED]", redacted)


class TestOfflineFallback(unittest.TestCase):
    def test_app_works_without_api_key_offline(self):
        limiter.reset()
        with mock.patch.object(
            Settings, "ai_enabled", new=property(lambda self: False)
        ):
            res = client.post("/api/analyze-job", json={"job_description": JOB_TEXT})
            self.assertEqual(res.status_code, 200)
            self.assertIn("requiredSkills", res.json())

            res = client.post(
                "/api/screen",
                data={"job_description": JOB_TEXT, "blind_screening": "false"},
                files=[("resumes", ("sarah.txt", RESUME_TEXT, "text/plain"))],
            )
            self.assertEqual(res.status_code, 200)
            body = res.json()
            self.assertIn("candidates", body)
            self.assertEqual(len(body["candidates"]), 1)

    def test_provider_failure_falls_back_to_heuristic(self):
        with _patch_provider_failure():
            result = ai_service.analyze_job(JOB_TEXT)
        self.assertIsInstance(result, JobAnalysis)
        self.assertIn("requiredSkills", result.model_dump())

    def test_malformed_provider_response_falls_back(self):
        with mock.patch.object(
            ai_service, "_structured_json", return_value={"unexpected": "payload"}
        ):
            result = ai_service.analyze_job(JOB_TEXT)
        self.assertIsInstance(result, JobAnalysis)
        self.assertNotEqual(result.title, "Untitled Role")


if __name__ == "__main__":
    unittest.main()
