from app.models.schemas import CandidateAnalysis


def anonymize_candidate(candidate: CandidateAnalysis, index: int) -> CandidateAnalysis:
    """Strip personally identifiable information for blind screening."""
    candidate.name = f"Candidate {index}"
    candidate.email = "Hidden"
    candidate.phone = "Hidden"
    candidate.address = None
    return candidate
