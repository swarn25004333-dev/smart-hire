"""Integration tests for FastAPI endpoints."""

import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestRoutes(unittest.TestCase):

    def test_health_endpoint(self):
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("aiProvider", data)

    def test_analyze_job_endpoint(self):
        payload = {
            "job_description": "We are hiring a Senior React & Node.js Developer with 5+ years of frontend experience."
        }
        response = client.post("/api/analyze-job", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("title", data)
        self.assertIn("requiredSkills", data)

    def test_screen_resumes_endpoint(self):
        job_desc = "We are seeking a Python Developer with Docker and SQL experience."
        file_content = b"Name: Sarah Connor\nEmail: sarah@skynet.com\nSkills: Python, Docker, SQL, Git\nWork Experience: 4 years as Backend Engineer."

        response = client.post(
            "/api/screen",
            data={"job_description": job_desc, "blind_screening": "false"},
            files=[("resumes", ("sarah_resume.txt", file_content, "text/plain"))],
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("jobId", data)
        self.assertIn("candidates", data)
        self.assertEqual(len(data["candidates"]), 1)
        self.assertEqual(data["candidates"][0]["name"], "Sarah Connor")

    def test_compare_candidates_endpoint(self):
        job_desc = "We are seeking a Fullstack Developer with React and Node.js."
        file_content = b"Name: Mike Ross\nEmail: mike@law.com\nSkills: React, Node.js, Express, MongoDB\n"

        screen_res = client.post(
            "/api/screen",
            data={"job_description": job_desc, "blind_screening": "false"},
            files=[("resumes", ("mike_resume.txt", file_content, "text/plain"))],
        )
        body = screen_res.json()
        candidate = body["candidates"][0]

        compare_req = {
            "jobAnalysis": body["jobAnalysis"],
            "candidates": [candidate],
        }
        res = client.post("/api/compare-candidates", json=compare_req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("metrics", data)
        self.assertEqual(len(data["candidates"]), 1)


if __name__ == "__main__":
    unittest.main()
