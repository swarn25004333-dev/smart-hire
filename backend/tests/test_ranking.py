"""Unit tests for Smart Hire ranking engine."""

import unittest
from app.models.schemas import JobAnalysis, ParsedResume, Experience, Education
from app.services.ranking_service import (
    compute_analysis,
    category_for_score,
    recommendation_for_score,
)


class TestRankingService(unittest.TestCase):

    def setUp(self):
        self.job = JobAnalysis(
            title="Senior Python Engineer",
            requiredSkills=["Python", "FastAPI", "Docker", "PostgreSQL"],
            preferredSkills=["AWS", "Kubernetes"],
            experience="4+ years",
            education=["Bachelor's in Computer Science"],
            certifications=[],
            keyResponsibilities=["Develop REST APIs", "Manage databases"],
        )

        self.strong_resume = ParsedResume(
            filename="strong.pdf",
            name="John Doe",
            email="john@example.com",
            phone="+1234567890",
            address="New York, NY",
            summary="Experienced Python Backend Developer.",
            skills=["Python", "FastAPI", "Docker", "PostgreSQL", "AWS"],
            workExperience=[
                Experience(
                    role="Senior Backend Developer",
                    company="Tech Corp",
                    years=5.0,
                    description=["Built microservices using Python & FastAPI."],
                )
            ],
            education=[
                Education(
                    degree="B.S. Computer Science",
                    institution="Columbia University",
                )
            ],
            projects=[],
            certifications=["AWS Certified Developer"],
            achievements=[],
        )

    def test_category_and_recommendation_scoring(self):
        self.assertEqual(category_for_score(92.0), "strong")
        self.assertEqual(category_for_score(80.0), "good")
        self.assertEqual(category_for_score(65.0), "needs-review")
        self.assertEqual(category_for_score(45.0), "low")

        self.assertEqual(recommendation_for_score(92.0), "Strong Match")
        self.assertEqual(recommendation_for_score(78.0), "Good Match")

    def test_compute_analysis_strong_candidate(self):
        analysis = compute_analysis(self.job, self.strong_resume, 0)
        self.assertGreaterEqual(analysis.overallScore, 70.0)
        self.assertIn(analysis.matchCategory, ["strong", "good"])
        self.assertIn("Python", analysis.skillsMatch)
        self.assertEqual(analysis.candidateId, "cand_1")
        self.assertTrue(len(analysis.whyMatches) > 0)


if __name__ == "__main__":
    unittest.main()
