from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class Education(BaseModel):
    degree: str = "Not Found"
    institution: str = "Not Found"
    year: Optional[str] = None


class Experience(BaseModel):
    role: str = "Not Found"
    company: str = "Not Found"
    duration: Optional[str] = None
    description: List[str] = Field(default_factory=list)
    years: Optional[float] = None


class Project(BaseModel):
    name: str = "Not Found"
    description: str = "Not Found"
    skills: List[str] = Field(default_factory=list)


class ParsedResume(BaseModel):
    name: str = "Not Found"
    email: str = "Not Found"
    phone: str = "Not Found"
    address: Optional[str] = None
    summary: Optional[str] = None
    education: List[Education] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    workExperience: List[Experience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)


class JobAnalysis(BaseModel):
    title: str = "Untitled Role"
    requiredSkills: List[str] = Field(default_factory=list)
    preferredSkills: List[str] = Field(default_factory=list)
    experience: str = "Not Specified"
    education: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    keyResponsibilities: List[str] = Field(default_factory=list)


class ScoreBreakdown(BaseModel):
    requiredSkills: float = 0
    experience: float = 0
    projects: float = 0
    education: float = 0
    certifications: float = 0
    preferredSkills: float = 0


class MatchReason(BaseModel):
    reason: str
    evidence: str


class SkillGap(BaseModel):
    skill: str
    severity: Literal["critical", "preferred", "informational"] = "informational"


class CandidateAnalysis(BaseModel):
    candidateId: str
    name: str = "Not Found"
    email: str = "Not Found"
    phone: str = "Not Found"
    address: Optional[str] = None
    overallScore: float = 0
    matchCategory: Literal["strong", "good", "needs-review", "low"] = "needs-review"
    scoreBreakdown: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    skillsMatch: List[str] = Field(default_factory=list)
    missingSkills: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    whyMatches: List[MatchReason] = Field(default_factory=list)
    evidence: str = "Not Found"
    skillGaps: List[SkillGap] = Field(default_factory=list)
    recommendation: str = "Needs Review"
    recommendationExplanation: str = ""
    experienceYears: float = 0
    educationLevel: str = "Not Found"
    topSkills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)

    # --- Extended AI fields -------------------------------------------------
    communication: float = 0
    leadership: float = 0
    problemSolving: float = 0
    expectedSalary: str = "Not Specified"
    noticePeriod: str = "Not Specified"
    location: Optional[str] = None
    photo: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    resumeUrl: Optional[str] = None
    resumePdfPath: Optional[str] = None
    projects: List[Project] = Field(default_factory=list)
    aiSummary: str = ""
    interviewQuestions: List[str] = Field(default_factory=list)
    confidence: float = 0
    hireRecommendation: Literal["Hire", "Maybe", "Reject"] = "Maybe"
    skillMatch: float = 0
    educationMatch: float = 0
    experienceMatch: float = 0
    projectsMatch: float = 0
    overallMatch: float = 0
    matchedSkills: List[str] = Field(default_factory=list)


class ScreeningResult(BaseModel):
    jobId: str
    jobTitle: str
    analyzedAt: str
    totalCandidates: int
    strongMatches: int
    averageScore: float
    shortlisted: int
    jobAnalysis: JobAnalysis
    candidates: List[CandidateAnalysis] = Field(default_factory=list)
    engine: str = "offline"
    poweredBy: str = "Offline AI Mode"
    autoCompare: Optional["AutoCompareResult"] = None


class AutoCompareMatch(BaseModel):
    candidateId: str
    name: str
    photo: Optional[str] = None
    role: str = "Professional"
    location: Optional[str] = None
    experience: int = 0
    overallMatch: float = 0
    similarity: float = 0
    skillMatch: float = 0
    experienceMatch: float = 0
    educationMatch: float = 0
    projectsMatch: float = 0
    matchedSkills: List[str] = Field(default_factory=list)
    missingSkills: List[str] = Field(default_factory=list)


class AutoCompareResult(BaseModel):
    topMatch: AutoCompareMatch
    top3: List[AutoCompareMatch] = Field(default_factory=list)
    rankings: List[AutoCompareMatch] = Field(default_factory=list)


class CandidateProfile(BaseModel):
    id: int
    candidateId: str
    name: str
    photo: Optional[str] = None
    email: str = "Not Found"
    phone: str = "Not Found"
    location: Optional[str] = None
    role: str = "Professional"
    experience: int = 0
    education: str = "Not Found"
    university: str = "Not Found"
    educationHistory: List[Education] = Field(default_factory=list)
    experienceTimeline: List[Experience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    github: Optional[str] = None
    linkedin: Optional[str] = None
    resumeSummary: str = ""
    atsScore: float = 0
    communication: float = 0
    leadership: float = 0
    problemSolving: float = 0
    expectedSalary: str = "Not Specified"
    noticePeriod: str = "Not Specified"
    resumePdf: str = ""
    overallMatch: float = 0
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    aiSummary: str = ""
    hireRecommendation: Literal["Hire", "Maybe", "Reject"] = "Maybe"


class HistoryEntry(BaseModel):
    id: int
    resumeName: str = ""
    candidateName: str = ""
    candidateId: str = ""
    screeningDate: str = ""
    screeningTime: str = ""
    atsScore: float = 0
    recommendation: str = ""
    jobDescription: str = ""
    jobTitle: str = ""
    missingSkills: List[str] = Field(default_factory=list)
    matchedSkills: List[str] = Field(default_factory=list)
    aiSummary: str = ""
    engine: str = "offline"
    result: Dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
    engine: str = "offline"


class SettingsUpdate(BaseModel):
    geminiApiKey: Optional[str] = None
    openaiApiKey: Optional[str] = None
    theme: Optional[str] = None
    offlineMode: Optional[bool] = None


class SettingsResponse(BaseModel):
    geminiConfigured: bool = False
    openaiConfigured: bool = False
    theme: str = "dark"
    offlineMode: bool = False


class CompareRequest(BaseModel):
    jobAnalysis: JobAnalysis
    candidates: List[CandidateAnalysis]


class CompareMetric(BaseModel):
    label: str
    values: List[float]


class CompareResult(BaseModel):
    candidates: List[CandidateAnalysis]
    metrics: List[CompareMetric]


class HealthResponse(BaseModel):
    status: str
    aiProvider: str
    aiEnabled: bool
