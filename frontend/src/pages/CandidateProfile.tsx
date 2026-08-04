import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Mail,
  Download,
  FileText,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Star,
  Wallet,
  Clock,
  UserCheck,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import ScoreRing from '@/components/shared/ScoreRing'
import EngineBadge from '@/components/shared/EngineBadge'
import { MatchBadge, categoryForScore } from '@/components/shared/MatchBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCandidate, downloadCandidateResume, generateCandidateReport, downloadReport } from '@/services/api'
import type { CandidateProfile } from '@/types'
import type { Experience, Project, Education } from '@/types'

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getCandidate(id)
      .then((c) => {
        if (!cancelled) setCandidate(c)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleReport = async () => {
    if (!candidate) return
    setReporting(true)
    try {
      const res = await generateCandidateReport(candidate.id)
      downloadReport(res.reportId)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setReporting(false)
    }
  }

  if (loading) {
    return (
      <AuroraBackground>
        <Navbar />
        <main className="flex items-center justify-center pt-32 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-400" />
          Loading profile...
        </main>
      </AuroraBackground>
    )
  }

  if (error || !candidate) {
    return (
      <AuroraBackground>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-32 text-center">
          <p className="text-red-400">{error || 'Candidate not found'}</p>
          <Button variant="outline" className="mt-4 border-white/10 bg-white/5 text-slate-300" onClick={() => navigate('/candidates')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Candidates
          </Button>
        </main>
      </AuroraBackground>
    )
  }

  const dims = [
    { label: 'Skills', value: candidate.skillMatch ?? 0 },
    { label: 'Experience', value: candidate.experienceMatch ?? 0 },
    { label: 'Education', value: candidate.educationMatch ?? 0 },
    { label: 'Projects', value: candidate.projectsMatch ?? 0 },
  ]

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="pt-24">
          <Button
            variant="ghost"
            className="mb-4 -ml-2 text-slate-400 hover:text-white"
            onClick={() => navigate('/candidates')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Candidates
          </Button>

          <Card className="overflow-hidden border-white/5 bg-white/[0.03] backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900/60 px-6 py-8 sm:px-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5">
                    {candidate.photo ? (
                      <img src={candidate.photo} alt={candidate.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {candidate.name.split(' ').slice(0, 2).map((p) => p[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{candidate.name}</h1>
                      <EngineBadge engine={candidate.engine} poweredBy={candidate.poweredBy} />
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{candidate.role}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-cyan-400" />{candidate.location}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-cyan-400" />{candidate.email}</span>
                      <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5 text-cyan-400" />{candidate.expectedSalary}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-cyan-400" />{candidate.noticePeriod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <ScoreRing score={candidate.atsScore} size={104} strokeWidth={9} label="ATS Score" />
                  <div className="flex flex-col items-center gap-2">
                    <MatchBadge category={categoryForScore(candidate.atsScore)} />
                    {candidate.hireRecommendation && (
                      <Badge
                        className={
                          candidate.hireRecommendation === 'Hire'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : candidate.hireRecommendation === 'Reject'
                              ? 'border-red-500/30 bg-red-500/10 text-red-300'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }
                      >
                        <UserCheck className="mr-1 h-3 w-3" />
                        {candidate.hireRecommendation}
                      </Badge>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-white/10 bg-white/5 text-cyan-300 hover:bg-cyan-500/10"
                        onClick={() => downloadCandidateResume(candidate.id)}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" /> Resume
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                        onClick={handleReport}
                        disabled={reporting}
                      >
                        {reporting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1 h-3.5 w-3.5" />}
                        Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {dims.map((d) => (
                  <div key={d.label} className="rounded-xl bg-white/5 px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{d.label}</p>
                    <p className="mt-0.5 text-lg font-bold text-white">{Math.round(d.value)}%</p>
                  </div>
                ))}
              </div>
            </div>

            <CardContent className="p-6 sm:p-8">
              {candidate.aiSummary && (
                <div className="mb-6 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm leading-relaxed text-slate-300">
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                    <Lightbulb className="h-3.5 w-3.5" /> AI Summary
                  </span>
                  {candidate.aiSummary}
                </div>
              )}

              <Tabs defaultValue="skills" className="w-full">
                <TabsList className="border-white/10 bg-white/5">
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                </TabsList>

                <TabsContent value="skills" className="pt-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-slate-300">Matched Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {(candidate.skillsMatch ?? []).map((s) => (
                          <Badge key={s} className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-slate-300">Missing Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {(candidate.missingSkills ?? []).map((s) => (
                          <Badge key={s} className="border-red-500/30 bg-red-500/10 text-red-300">
                            <XCircle className="mr-1 h-3 w-3" /> {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <h3 className="mb-3 text-sm font-semibold text-slate-300">All Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((s) => (
                          <span key={s} className="rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="pt-6">
                  <ExperienceTimeline items={candidate.experienceTimeline ?? []} />
                </TabsContent>

                <TabsContent value="projects" className="pt-6">
                  <ProjectsTimeline projects={candidate.projects ?? []} />
                </TabsContent>

                <TabsContent value="education" className="pt-6">
                  <EducationTimeline items={candidate.educationHistory ?? []} />
                </TabsContent>

                <TabsContent value="assessment" className="pt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-white/5 bg-white/[0.02]">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold text-slate-300">Soft Skills Assessment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <SoftSkillBar label="Communication" value={candidate.communication ?? 0} />
                        <SoftSkillBar label="Leadership" value={candidate.leadership ?? 0} />
                        <SoftSkillBar label="Problem Solving" value={candidate.problemSolving ?? 0} />
                        <SoftSkillBar label="AI Confidence" value={candidate.aiConfidence ?? 0} />
                      </CardContent>
                    </Card>

                    <Card className="border-white/5 bg-white/[0.02]">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold text-slate-300">Strengths & Weaknesses</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <Star className="h-3.5 w-3.5" /> Strengths
                          </h4>
                          <ul className="space-y-1.5">
                            {(candidate.strengths ?? []).map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" /> Weaknesses
                          </h4>
                          <ul className="space-y-1.5">
                            {(candidate.weaknesses ?? []).map((w, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuroraBackground>
  )
}

function SoftSkillBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped >= 80 ? '#059669' : clamped >= 60 ? '#2563eb' : clamped >= 40 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-400">{label}</span>
        <span className="font-bold" style={{ color }}>{Math.round(clamped)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function ExperienceTimeline({ items }: { items: Experience[] }) {
  if (!items.length) return <p className="text-sm text-slate-500">No experience data available.</p>
  return (
    <div className="space-y-4">
      {items.map((e, i) => (
        <div key={i} className="relative flex gap-4 pl-5">
          <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
          <div className="w-full rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{e.role}</p>
                <p className="text-xs text-slate-400">{e.company}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                {e.duration || (e.years ? `${e.years} yrs` : '')}
              </span>
            </div>
            {(e.description ?? []).length > 0 && (
              <ul className="mt-2 space-y-1">
                {(e.description as string[]).map((line, j) => (
                  <li key={j} className="text-sm leading-relaxed text-slate-400">
                    <span className="mr-1.5 text-cyan-500">•</span>
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectsTimeline({ projects }: { projects: Project[] }) {
  if (!projects.length) return <p className="text-sm text-slate-500">No projects available.</p>
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((p, i) => (
        <Card key={i} className="border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
              <Briefcase className="h-4 w-4 text-cyan-400" /> {p.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-400">
            <p className="leading-relaxed">{p.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {(p.skills ?? []).map((t) => (
                <span key={t} className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
                  {t}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EducationTimeline({ items }: { items: Education[] }) {
  if (!items.length) return <p className="text-sm text-slate-500">No education data available.</p>
  return (
    <div className="space-y-4">
      {items.map((e, i) => (
        <div key={i} className="relative flex gap-4 pl-5">
          <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-400 ring-4 ring-blue-500/20" />
          <div className="w-full rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{e.degree}</p>
                <p className="text-xs text-slate-400">{e.institution}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <GraduationCap className="h-3 w-3" /> {e.year}
              </span>
            </div>
            {'details' in e && (e as Education & { details?: string }).details && (
              <p className="mt-1 text-xs text-slate-500">{(e as Education & { details?: string }).details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
