export type MatchCategory =
  | 'strong'
  | 'good'
  | 'needs-review'
  | 'low'

export interface JobAnalysis {
  title: string
  requiredSkills: string[]
  preferredSkills: string[]
  experience: string
  education: string[]
  certifications: string[]
  keyResponsibilities: string[]
}

export interface ParsedResume {
  name: string
  email: string
  phone: string
  address?: string
  education: Education[]
  skills: string[]
  workExperience: Experience[]
  projects: Project[]
  certifications: string[]
  achievements: string[]
  summary?: string
  [key: string]: unknown
}

export interface Education {
  degree: string
  institution: string
  year?: string
}

export interface Experience {
  role: string
  company: string
  duration?: string
  description: string[]
  years?: number
}

export interface Project {
  name: string
  description: string
  skills?: string[]
}

export interface ScoreBreakdown {
  requiredSkills: number
  experience: number
  projects: number
  education: number
  certifications: number
  preferredSkills: number
}

export interface MatchReason {
  reason: string
  evidence: string
}

export interface SkillGap {
  skill: string
  severity: 'critical' | 'preferred' | 'informational'
}

export interface CandidateAnalysis {
  candidateId: string
  name: string
  email: string
  phone: string
  address?: string
  overallScore: number
  matchCategory: MatchCategory
  scoreBreakdown: ScoreBreakdown
  skillsMatch: string[]
  missingSkills: string[]
  strengths: string[]
  weaknesses: string[]
  whyMatches: MatchReason[]
  evidence: string
  skillGaps: SkillGap[]
  recommendation: 'Strong Match' | 'Good Match' | 'Needs Review' | 'Low Match'
  recommendationExplanation: string
  experienceYears: number
  educationLevel: string
  topSkills: string[]
  certifications: string[]
  // Extended AI fields
  communication?: number
  leadership?: number
  problemSolving?: number
  expectedSalary?: string
  noticePeriod?: string
  location?: string
  photo?: string
  github?: string
  linkedin?: string
  resumeUrl?: string
  resumePdfPath?: string
  projects?: Project[]
  aiSummary?: string
  interviewQuestions?: string[]
  confidence?: number
  hireRecommendation?: 'Hire' | 'Maybe' | 'Reject'
  skillMatch?: number
  educationMatch?: number
  experienceMatch?: number
  projectsMatch?: number
  overallMatch?: number
  matchedSkills?: string[]
}

export interface AutoCompareMatch {
  candidateId: string
  name: string
  photo?: string
  role: string
  location?: string
  experience: number
  overallMatch: number
  similarity: number
  skillMatch: number
  experienceMatch: number
  educationMatch: number
  projectsMatch: number
  matchedSkills: string[]
  missingSkills: string[]
}

export interface AutoCompareResult {
  topMatch: AutoCompareMatch
  top3: AutoCompareMatch[]
  rankings: AutoCompareMatch[]
}

export interface ScreeningResult {
  jobId: string
  jobTitle: string
  analyzedAt: string
  totalCandidates: number
  strongMatches: number
  averageScore: number
  shortlisted: number
  jobAnalysis: JobAnalysis
  candidates: CandidateAnalysis[]
  engine: string
  poweredBy: string
  autoCompare?: AutoCompareResult
}

export interface CandidateProfile {
  id: number
  candidateId: string
  name: string
  photo?: string
  email: string
  phone: string
  location?: string
  role: string
  experience: number
  education: string
  university: string
  educationHistory: Education[]
  experienceTimeline: Experience[]
  projects: Project[]
  skills: string[]
  certifications: string[]
  github?: string
  linkedin?: string
  resumeSummary: string
  atsScore: number
  communication: number
  leadership: number
  problemSolving: number
  expectedSalary?: string
  noticePeriod?: string
  resumePdf: string
  overallMatch: number
  strengths: string[]
  weaknesses: string[]
  aiSummary: string
  hireRecommendation: 'Hire' | 'Maybe' | 'Reject'
  resumeUrl?: string
  skillMatch?: number
  experienceMatch?: number
  educationMatch?: number
  projectsMatch?: number
  aiConfidence?: number
  skillsMatch?: string[]
  missingSkills?: string[]
  engine?: string
  poweredBy?: string
}

export interface CandidateListResponse {
  total: number
  candidates: CandidateProfile[]
}

export interface HistoryEntry {
  id: number
  resumeName: string
  candidateName: string
  candidateId: string
  screeningDate: string
  screeningTime: string
  atsScore: number
  recommendation: string
  jobDescription: string
  jobTitle: string
  missingSkills: string[]
  matchedSkills: string[]
  aiSummary: string
  engine: string
  result?: ScreeningResult
  createdAt?: string
}
export interface AnalyticsResponse {
  overview: {
    totalCandidates: number
    totalScreenings: number
    averageATS: number
    recommendations: ChartDataPoint[]
  }
  uploadTrend: ChartDataPoint[]
  topSkills: ChartDataPoint[]
  missingSkills: ChartDataPoint[]
  mostCommonTechnologies: ChartDataPoint[]
  experienceDistribution: ChartDataPoint[]
  educationDistribution: ChartDataPoint[]
}

export interface SettingsResponse {
  geminiConfigured: boolean
  openaiConfigured: boolean
  theme: string
  offlineMode: boolean
}

export interface ChatResponse {
  reply: string
  engine: string
}

export interface CompareRow {
  label: string
  key: keyof ScoreBreakdown
  score: number
}

export interface ScreeningProgressEvent {
  step: number
  totalSteps: number
  message: string
  status: 'pending' | 'active' | 'done'
}

export interface DashboardStat {
  label: string
  value: string | number
  icon: string
  color: string
  trend?: string
  trendUp?: boolean
}

export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface SkillDistribution {
  skill: string
  count: number
  percentage: number
}

export interface HiringRecommendation {
  topCandidate: CandidateAnalysis
  reason: string
  confidence: number
  keyStrengths: string[]
  concerns: string[]
}

export interface ResumeQualityMetrics {
  overall: number
  formatting: number
  content: number
  keywords: number
  experience: number
  education: number
}

export interface AIAssistantMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}