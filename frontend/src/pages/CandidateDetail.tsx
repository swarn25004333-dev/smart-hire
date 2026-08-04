'use client'

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Star,
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
  Target,
  Award,
  FolderKanban,
  Lightbulb,
  Medal,
  Printer,
  Copy,
  Check,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import ScoreRing from '@/components/shared/ScoreRing'
import { MatchBadge, categoryForScore } from '@/components/shared/MatchBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useScreening } from '@/context/ScreeningContext'
import { cn, displayName } from '@/lib/utils'
import type { ScoreBreakdown } from '@/types'

const BREAKDOWN_META: Array<{
  key: keyof ScoreBreakdown
  label: string
  icon: typeof Target
  color: string
}> = [
  { key: 'requiredSkills', label: 'Required Skills', icon: Target, color: 'bg-cyan-500' },
  { key: 'experience', label: 'Experience', icon: Briefcase, color: 'bg-indigo-500' },
  { key: 'projects', label: 'Projects', icon: FolderKanban, color: 'bg-violet-500' },
  { key: 'education', label: 'Education', icon: GraduationCap, color: 'bg-sky-500' },
  { key: 'certifications', label: 'Certifications', icon: Award, color: 'bg-emerald-500' },
  { key: 'preferredSkills', label: 'Preferred Skills', icon: Lightbulb, color: 'bg-amber-500' },
]

export default function CandidateDetail() {
  const navigate = useNavigate()
  const { candidateId } = useParams<{ candidateId: string }>()
  const { result, blindScreening, compareIds, setCompareIds } = useScreening()

  const candidate = useMemo(
    () => result?.candidates.find((c) => c.candidateId === candidateId) ?? null,
    [result, candidateId],
  )

  if (!candidate) {
    return (
      <AuroraBackground>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-24 text-center">
          <p className="text-slate-400">Candidate not found.</p>
          <Button className="mt-4" variant="gradient" onClick={() => navigate('/results')}>
            Back to results
          </Button>
        </main>
      </AuroraBackground>
    )
  }

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!candidate) return
    const text = `Candidate Evaluation Summary:
Name: ${candidate.name}
Overall Score: ${candidate.overallScore}% (${candidate.matchCategory})
Recommendation: ${candidate.recommendation}
Experience: ${candidate.experienceYears} yrs
Education: ${candidate.educationLevel}
Skills Matched: ${candidate.skillsMatch.join(', ')}
Key Strengths: ${candidate.strengths.join('; ')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const selected = compareIds.includes(candidate.candidateId)
  const canSelect = compareIds.length < 4

  const toggleCompare = () => {
    if (selected) setCompareIds(compareIds.filter((x) => x !== candidate.candidateId))
    else if (canSelect) setCompareIds([...compareIds, candidate.candidateId])
  }

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate('/results')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to rankings
        </button>

        <div className="animate-fade-in-up overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm shadow-2xl shadow-black/30">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900/50 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg',
                    blindScreening
                      ? 'bg-slate-600'
                      : 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500',
                  )}
                >
                  {blindScreening
                    ? '?'
                    : displayName(candidate, blindScreening)
                        .split(' ')
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      {displayName(candidate, blindScreening)}
                    </h1>
                    <MatchBadge category={categoryForScore(candidate.overallScore)} />
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {blindScreening
                      ? 'Identity hidden (blind screening)'
                      : `${candidate.email} · ${candidate.phone}`}
                  </p>
                  {!blindScreening && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {candidate.address}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-5">
                <ScoreRing score={candidate.overallScore} size={88} strokeWidth={8} label="Overall" />
                <div className="hidden flex-col gap-2 sm:flex">
                  <Button variant="gradient" size="sm" onClick={toggleCompare}>
                    <Medal className="h-4 w-4" />
                    {selected ? 'Remove from Compare' : 'Add to Compare'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/compare')}
                    className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    View Comparison
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Badge variant="secondary" className="w-fit bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                <Briefcase className="mr-1 h-3 w-3" />
                {candidate.experienceYears} years experience
              </Badge>
              <Badge variant="secondary" className="w-fit bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                <GraduationCap className="mr-1 h-3 w-3" />
                {candidate.educationLevel}
              </Badge>
              <Badge variant="secondary" className="w-fit bg-violet-500/10 text-violet-400 border-violet-500/20">
                <Award className="mr-1 h-3 w-3" />
                {candidate.certifications && candidate.certifications.length > 0
                  ? `${candidate.certifications.length} certification(s)`
                  : 'No certifications found'}
              </Badge>
            </div>

            <section className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <Target className="h-5 w-5 text-cyan-400" />
                Score Breakdown
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {BREAKDOWN_META.map((meta) => (
                  <div
                    key={meta.key}
                    className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <meta.icon className="h-4 w-4 text-slate-500" />
                        {meta.label}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {candidate.scoreBreakdown[meta.key]}%
                      </span>
                    </div>
                    <Progress
                      value={candidate.scoreBreakdown[meta.key]}
                      className={cn('h-2', meta.color)}
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Why This Candidate Matches
                </h2>
                <ul className="space-y-2.5">
                  {candidate.whyMatches.map((item) => (
                    <li key={item.reason} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          {item.reason}
                        </p>
                        <p className="text-xs text-slate-500">{item.evidence}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Skill Gaps
                </h2>
                {candidate.skillGaps.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    All required skills are covered.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {candidate.skillGaps.map((gap) => (
                      <li key={gap.skill} className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                        <span className="text-sm font-medium text-slate-200">
                          {gap.skill}
                        </span>
                        <Badge
                          variant={
                            gap.severity === 'critical' ? 'destructive' : 'secondary'
                          }
                          className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20"
                        >
                          {gap.severity === 'critical' ? 'Critical' : 'Preferred'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <Separator className="my-8 bg-white/5" />

            <section className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <Star className="h-5 w-5 text-amber-400" />
                Candidate Strengths
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {candidate.strengths.map((strength) => (
                  <li
                    key={strength}
                    className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3.5 text-sm text-slate-300"
                  >
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                    {strength}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <Sparkles className="h-5 w-5 text-violet-400" />
                AI Recommendation
              </h2>
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-violet-500/10 p-6 border border-white/5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className="border border-white/20 bg-white/10 text-white">
                    {candidate.recommendation}
                  </Badge>
                  <span className="text-sm font-medium text-slate-300">
                    {candidate.overallScore}% overall match
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  {candidate.recommendationExplanation}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Recommendations are AI-suggested only. Final decisions should include human review.
                </p>
              </div>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/results')} variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
                Back to Rankings
              </Button>
              <Button variant="gradient" onClick={() => navigate('/compare')}>
                <Medal className="h-4 w-4" />
                Compare Candidates
              </Button>
              <Button variant="outline" onClick={handleCopy} className="gap-1.5 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied Summary' : 'Copy Summary'}
              </Button>
              <Button variant="outline" onClick={handlePrint} className="gap-1.5 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </Button>
            </div>
          </CardContent>
        </div>
      </main>
    </AuroraBackground>
  )
}