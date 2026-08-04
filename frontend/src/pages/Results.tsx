'use client'

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Trophy,
  Gauge,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Medal,
  ChevronRight,
  Search,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Target,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import EngineBadge from '@/components/shared/EngineBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useScreening } from '@/context/ScreeningContext'
import type { MatchCategory, ScreeningResult } from '@/types'
import { exportScreeningResultCSV, exportScreeningResultJSON } from '@/services/api'
import CandidateCard from '@/components/dashboard/CandidateCard'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsCharts'

type FilterKey = 'all' | MatchCategory
type SortKey = 'high' | 'low'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'strong', label: 'Strong Match' },
  { key: 'good', label: 'Good Match' },
  { key: 'needs-review', label: 'Needs Review' },
  { key: 'low', label: 'Low Match' },
]

export default function Results() {
  const navigate = useNavigate()
  const {
    result,
    blindScreening,
    setBlindScreening,
    compareIds,
    setCompareIds,
  } = useScreening()

  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('high')
  const [selectMode, setSelectMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const candidates = result?.candidates ?? []

  const filtered = useMemo(() => {
    let list = [...candidates]
    if (filter !== 'all') {
      list = list.filter((c) => c.matchCategory === filter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.skillsMatch || []).some((s) => s.toLowerCase().includes(q)) ||
          (c.topSkills || []).some((s) => s.toLowerCase().includes(q)),
      )
    }
    list.sort((a, b) =>
      sort === 'high'
        ? b.overallScore - a.overallScore
        : a.overallScore - b.overallScore,
    )
    return list
  }, [candidates, filter, sort, searchQuery])

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((x) => x !== id))
    } else if (compareIds.length < 4) {
      setCompareIds([...compareIds, id])
    }
  }

  if (!result) return null

  const stats = [
    {
      label: 'Total Candidates',
      value: result.totalCandidates,
      icon: Users,
      color: 'bg-cyan-500/10 text-cyan-400',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Strong Matches',
      value: result.strongMatches,
      icon: Trophy,
      color: 'bg-emerald-500/10 text-emerald-400',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Average ATS',
      value: `${result.averageScore}%`,
      icon: Gauge,
      color: 'bg-indigo-500/10 text-indigo-400',
      trend: '+3%',
      trendUp: true,
    },
    {
      label: 'Shortlisted',
      value: result.shortlisted,
      icon: CheckCircle2,
      color: 'bg-violet-500/10 text-violet-400',
      trend: 'Ready',
      trendUp: true,
    },
  ]

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-24">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
              <BarChart3 className="h-3.5 w-3.5" />
              Screening Complete &middot; {result.jobTitle}
              <EngineBadge engine={result.engine} poweredBy={result.poweredBy} />
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
              Candidate Rankings
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              AI-powered analysis of {result.totalCandidates} candidates based on job requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJobDetails((v) => !v)}
              className="gap-1.5 text-xs border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            >
              <Briefcase className="h-3.5 w-3.5 text-cyan-400" />
              {showJobDetails ? 'Hide Criteria' : 'Job Criteria'}
              {showJobDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportScreeningResultCSV(result)}
              className="gap-1.5 text-xs border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportScreeningResultJSON(result)}
              className="gap-1.5 text-xs border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              Export JSON
            </Button>
          </div>
        </div>

        {showJobDetails && result.jobAnalysis && (
          <Card className="mb-8 border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm animate-fade-in-up">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 font-bold text-white text-sm">
                <Target className="h-4 w-4 text-cyan-400" />
                Parsed Job Description Criteria ({result.jobTitle})
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <p className="font-semibold text-slate-300 mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.jobAnalysis.requiredSkills?.map((s) => (
                      <Badge key={s} variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[11px]">
                        {s}
                      </Badge>
                    )) ?? <span className="text-slate-500">None specified</span>}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-300 mb-2">Experience &amp; Education:</p>
                  <p className="text-slate-400">
                    <span className="font-medium">Experience:</span> {result.jobAnalysis.experience || 'Not specified'}
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    <span className="font-medium">Education:</span> {(result.jobAnalysis.education || []).join(', ') || 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Card
              key={s.label}
              className="glass-card-hover overflow-hidden border-white/5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.color)}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  {s.trend && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        s.trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
                      )}
                    >
                      {s.trend}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-3xl font-bold text-white counter-value">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {s.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {result.autoCompare && <AutoCompareBanner autoCompare={result.autoCompare} />}

        <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search candidate or skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 text-sm font-medium text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                      filter === f.key
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Eye className="h-3.5 w-3.5" />
                  Blind
                  <Switch
                    checked={blindScreening}
                    onCheckedChange={setBlindScreening}
                    className="scale-90"
                    aria-label="Blind screening"
                  />
                  <EyeOff className="h-3.5 w-3.5" />
                </div>

                <div className="relative">
                  <ArrowUpDown className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="h-9 cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 text-xs font-medium text-slate-300 outline-none transition-colors hover:border-white/20 focus:border-cyan-500/50"
                  >
                    <option value="high">Highest Score</option>
                    <option value="low">Lowest Score</option>
                  </select>
                  {sort === 'high' ? (
                    <ArrowUp className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  ) : (
                    <ArrowDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectMode((v) => !v)}
                  className={cn(
                    selectMode && 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
                    'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
                  )}
                >
                  <Medal className="h-4 w-4" />
                  {selectMode ? 'Cancel Compare' : 'Compare'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalytics((v) => !v)}
                  className={cn(
                    showAnalytics && 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
                    'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </div>
            </div>

            {compareIds.length > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-violet-500/10 px-4 py-3 border border-white/5">
                <p className="text-sm font-medium text-slate-300">
                  {compareIds.length}/4 candidates selected
                </p>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => navigate('/compare')}
                >
                  Compare Candidates
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {showAnalytics && (
          <div className="mt-6 animate-fade-in-up">
            <AnalyticsDashboard candidates={candidates} />
          </div>
        )}

        <div className="mt-6 space-y-3">
          {filtered.length === 0 && (
            <Card className="border-white/5 bg-white/[0.03]">
              <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                <Users className="h-10 w-10 text-slate-600" />
                <p className="font-semibold text-slate-400">No candidates in this category</p>
                <p className="text-sm text-slate-600">Try a different filter to see more candidates.</p>
              </CardContent>
            </Card>
          )}

          {filtered.map((candidate, idx) => (
            <CandidateCard
              key={candidate.candidateId}
              candidate={candidate}
              rank={idx + 1}
              selectMode={selectMode}
              selected={compareIds.includes(candidate.candidateId)}
              blind={blindScreening}
              onToggleSelect={() => toggleCompare(candidate.candidateId)}
              onView={() => navigate(`/candidate/${candidate.candidateId}`)}
            />
          ))}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            90–100% Strong Match
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            75–89% Good Match
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            60–74% Needs Review
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            Below 60% Low Match
          </div>
        </div>
      </main>
    </AuroraBackground>
  )
}

function AutoCompareBanner({ autoCompare }: { autoCompare: NonNullable<ScreeningResult['autoCompare']> }) {
  const navigate = useNavigate()
  const { topMatch } = autoCompare

  const dimensions = [
    { label: 'Skills', value: topMatch.skillMatch },
    { label: 'Experience', value: topMatch.experienceMatch },
    { label: 'Education', value: topMatch.educationMatch },
    { label: 'Projects', value: topMatch.projectsMatch },
  ]

  return (
    <Card className="mb-8 overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-indigo-500/[0.06] to-violet-500/[0.08] backdrop-blur-sm animate-fade-in-up">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Medal className="h-4 w-4 text-amber-400" />
            Auto-Compare &middot; Most Similar to Uploaded Resume
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              Similarity {Math.round(topMatch.similarity)}%
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              Match {Math.round(topMatch.overallMatch)}%
            </span>
          </div>
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <button
            onClick={() => navigate(`/candidates/${topMatch.candidateId.replace('cand_', '')}`)}
            className="flex min-w-0 items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-left transition-colors hover:border-cyan-500/30"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
              {topMatch.photo ? (
                <img src={topMatch.photo} alt={topMatch.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-bold text-white">{topMatch.name.split(' ').map((p) => p[0]).join('')}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-white">{topMatch.name}</p>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">TOP MATCH</span>
              </div>
              <p className="truncate text-xs text-slate-400">{topMatch.role} &middot; {topMatch.location}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {topMatch.matchedSkills.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">{s}</span>
                ))}
              </div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {dimensions.map((d) => (
              <div key={d.label} className="rounded-xl bg-white/[0.03] px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{d.label}</p>
                <p className="text-sm font-bold text-white">{Math.round(d.value)}%</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Top 3 Similar Profiles</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {autoCompare.top3.map((m, i) => (
              <button
                key={m.candidateId}
                onClick={() => navigate(`/candidates/${m.candidateId.replace('cand_', '')}`)}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-cyan-500/30"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[11px] font-bold text-cyan-400">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{m.name}</p>
                  <p className="text-[11px] text-slate-500">Similarity {Math.round(m.similarity)}%</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}