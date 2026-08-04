import type { ScreeningResult } from '@/types'
import { generateMockResult } from '@/data/mockData'
import type { UploadedFile } from '@/context/ScreeningContext'
import type {
  AnalyticsResponse,
  CandidateListResponse,
  CandidateProfile,
  ChatResponse,
  HistoryEntry,
  SettingsResponse,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true'

export async function checkHealth(timeoutMs = 2500): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export interface ScreenPayload {
  jobDescription: string
  files: UploadedFile[]
  blindScreening: boolean
}

export interface ScreenResponse {
  result: ScreeningResult
  source: 'ai' | 'mock'
}

export async function screenResumes(
  payload: ScreenPayload,
  onProgress?: (step: number) => void,
): Promise<ScreenResponse> {
  console.log('Starting AI screening...')
  onProgress?.(1)

  if (USE_MOCK) {
    console.log('Using mock mode as requested by VITE_USE_MOCK=true')
    return { result: generateMockResult(payload.blindScreening), source: 'mock' }
  }

  onProgress?.(2)

  const form = new FormData()
  form.append('job_description', payload.jobDescription)
  form.append('blind_screening', String(payload.blindScreening))
  payload.files.forEach((f) => {
    form.append('resumes', f.file, f.name)
  })

  const endpoint = `${API_BASE}/screen`
  console.log('Sending screening request to:', endpoint)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: form,
    })

    if (!res.ok) {
      let detail = `HTTP ${res.status}`
      try {
        const errJson = await res.json()
        if (errJson.detail) detail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      } catch {
        // ignore json parse error
      }
      throw new Error(`Screening failed: ${detail}`)
    }

    const data = await res.json()
    console.log('Screening response received:', data)
    return { result: data as ScreeningResult, source: 'ai' }
  } catch (err: any) {
    console.error('Error during AI screening request:', err)
    throw err
  }
}

export function exportScreeningResultJSON(result: ScreeningResult): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', dataStr)
  downloadAnchor.setAttribute('download', `screening_results_${result.jobId}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

export function exportScreeningResultCSV(result: ScreeningResult): void {
  const headers = ['Rank', 'Candidate Name', 'Email', 'Overall Score', 'Match Category', 'Experience (Yrs)', 'Education', 'Skills Matched', 'Missing Skills', 'Recommendation']
  const rows = result.candidates.map((c, idx) => [
    idx + 1,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.email}"`,
    c.overallScore,
    c.matchCategory,
    c.experienceYears,
    `"${c.educationLevel.replace(/"/g, '""')}"`,
    `"${(c.skillsMatch || []).join('; ')}"`,
    `"${(c.missingSkills || []).join('; ')}"`,
    `"${c.recommendation}"`,
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', url)
  downloadAnchor.setAttribute('download', `screening_results_${result.jobId}.csv`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Candidate database
// ---------------------------------------------------------------------------
export interface CandidateFilters {
  search?: string
  skill?: string
  education?: string
  location?: string
  minExperience?: number
  maxExperience?: number
  minAts?: number
  maxAts?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export async function getCandidates(
  filters: CandidateFilters = {},
): Promise<CandidateListResponse> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const res = await fetch(`${API_BASE}/candidates?${params.toString()}`)
  if (!res.ok) throw new Error(`Failed to load candidates (${res.status})`)
  return res.json()
}

export async function getCandidate(id: number | string): Promise<CandidateProfile> {
  const res = await fetch(`${API_BASE}/candidates/${id}`)
  if (!res.ok) throw new Error(`Failed to load candidate (${res.status})`)
  return res.json()
}

export function downloadCandidateResume(id: number | string): void {
  window.open(`${API_BASE}/candidates/${id}/resume`, '_blank')
}

export async function generateCandidateReport(
  id: number | string,
  jobTitle?: string,
): Promise<{ downloadUrl: string; reportId: string; atsScore: number }> {
  const res = await fetch(`${API_BASE}/candidates/${id}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_title: jobTitle }),
  })
  if (!res.ok) throw new Error(`Failed to generate report (${res.status})`)
  return res.json()
}

export function downloadReport(reportId: string): void {
  window.open(`${API_BASE}/reports/${reportId}/download`, '_blank')
}

export interface ReportMeta {
  reportId: string
  candidateName: string
  resumeName: string
  jobTitle: string
  atsScore: number
  recommendation: string
  createdAt: string
  downloadUrl: string
}

export async function getReports(): Promise<ReportMeta[]> {
  const res = await fetch(`${API_BASE}/reports`)
  if (!res.ok) throw new Error(`Failed to load reports (${res.status})`)
  const data = await res.json()
  return data.reports ?? []
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
export async function getHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${API_BASE}/history`)
  if (!res.ok) throw new Error(`Failed to load history (${res.status})`)
  return res.json()
}

export async function getHistoryEntry(id: number): Promise<HistoryEntry> {
  const res = await fetch(`${API_BASE}/history/${id}`)
  if (!res.ok) throw new Error(`Failed to load history entry (${res.status})`)
  return res.json()
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete history entry (${res.status})`)
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export async function getAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${API_BASE}/analytics`)
  if (!res.ok) throw new Error(`Failed to load analytics (${res.status})`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<SettingsResponse> {
  const res = await fetch(`${API_BASE}/settings`)
  if (!res.ok) throw new Error(`Failed to load settings (${res.status})`)
  return res.json()
}

export async function updateSettings(payload: {
  geminiApiKey?: string
  openaiApiKey?: string
  theme?: string
  offlineMode?: boolean
}): Promise<SettingsResponse> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to update settings (${res.status})`)
  return res.json()
}

// ---------------------------------------------------------------------------
// AI chat
// ---------------------------------------------------------------------------
export async function chatWithAI(
  message: string,
  context?: Record<string, unknown>,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  })
  if (!res.ok) throw new Error(`AI chat failed (${res.status})`)
  return res.json()
}

