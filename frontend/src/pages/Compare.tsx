'use client'

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Medal,
  Target,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Award,
  Lightbulb,
  AlertTriangle,
  Users,
} from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import ScoreRing from '@/components/shared/ScoreRing'
import { MatchBadge, categoryForScore } from '@/components/shared/MatchBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useScreening } from '@/context/ScreeningContext'
import { initials, cn, displayName } from '@/lib/utils'
import type { ScoreBreakdown } from '@/types'

const COLORS = ['#00E5FF', '#7C3AED', '#10B981', '#F59E0B']

const METRICS: Array<{
  key: keyof ScoreBreakdown
  label: string
  icon: typeof Target
}> = [
  { key: 'requiredSkills', label: 'Required Skills', icon: Target },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'certifications', label: 'Certifications', icon: Award },
  { key: 'preferredSkills', label: 'Preferred Skills', icon: Lightbulb },
]

export default function Compare() {
  const navigate = useNavigate()
  const { result, compareIds, blindScreening } = useScreening()

  const candidates = useMemo(() => {
    const selected = (result?.candidates ?? []).filter((c) =>
      compareIds.includes(c.candidateId),
    )
    return selected.sort((a, b) => b.overallScore - a.overallScore)
  }, [result, compareIds])

  const radarData = useMemo(() => {
    return METRICS.map((m) => {
      const point: Record<string, number | string> = { metric: m.label }
      candidates.forEach((c) => {
        point[displayName(c, blindScreening)] = c.scoreBreakdown[m.key]
      })
      return point
    })
  }, [candidates, blindScreening])

  const comparisonData = useMemo(() => {
    return METRICS.map((m) => ({
      metric: m.label,
      ...Object.fromEntries(
        candidates.map((c) => [displayName(c, blindScreening), c.scoreBreakdown[m.key]])
      ),
    }))
  }, [candidates, blindScreening])

  if (candidates.length === 0) {
    return (
      <AuroraBackground>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-24 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-600" />
          <h1 className="mt-4 text-2xl font-bold text-white">
            No candidates selected
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Select 2–4 candidates from the rankings to compare them side by side.
          </p>
          <Button className="mt-6" variant="gradient" onClick={() => navigate('/results')}>
            Go to Rankings
          </Button>
        </main>
      </AuroraBackground>
    )
  }

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="pt-24">
          <button
            onClick={() => navigate('/results')}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to rankings
          </button>

          <div className="mb-8">
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-white">
              <Medal className="h-8 w-8 text-amber-400" />
              Candidate Comparison
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Comparing {candidates.length} candidate{candidates.length > 1 ? 's' : ''} against the job requirements.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  Skills Radar
                </h3>
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      {candidates.map((c, i) => (
                        <Radar
                          key={c.candidateId}
                          name={displayName(c, blindScreening)}
                          dataKey={displayName(c, blindScreening)}
                          stroke={COLORS[i % COLORS.length]}
                          fill={COLORS[i % COLORS.length]}
                          fillOpacity={0.12}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontSize: 12,
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          color: '#fff',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  Score Comparison
                </h3>
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          color: '#fff',
                          fontSize: 12,
                        }}
                      />
                      {candidates.map((c, i) => (
                        <Bar
                          key={c.candidateId}
                          dataKey={displayName(c, blindScreening)}
                          fill={COLORS[i % COLORS.length]}
                          radius={[4, 4, 0, 0]}
                          opacity={0.8}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 overflow-hidden border-white/5">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-4 text-left font-semibold text-slate-400">
                      Metric
                    </th>
                    {candidates.map((c, i) => (
                      <th key={c.candidateId} className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white',
                              blindScreening
                                ? 'bg-slate-600'
                                : 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500',
                            )}
                          >
                            {blindScreening ? '?' : initials(displayName(c, blindScreening))}
                          </div>
                          <span className="max-w-[110px] truncate font-semibold text-slate-200">
                            {displayName(c, blindScreening)}
                          </span>
                          <span className="text-xs text-slate-500">#{i + 1}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td className="px-4 py-4 font-medium text-slate-300">
                      Overall Score
                    </td>
                    {candidates.map((c) => (
                      <td key={c.candidateId} className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <ScoreRing score={c.overallScore} size={56} strokeWidth={5} />
                          <MatchBadge category={categoryForScore(c.overallScore)} />
                        </div>
                      </td>
                    ))}
                  </tr>

                  {METRICS.map((m) => (
                    <tr
                      key={m.key}
                      className="border-b border-white/5 bg-white/[0.02] transition-colors hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-4 font-medium text-slate-300">
                        <span className="flex items-center gap-2">
                          <m.icon className="h-4 w-4 text-slate-500" />
                          {m.label}
                        </span>
                      </td>
                      {candidates.map((c) => (
                        <td key={c.candidateId} className="px-4 py-4">
                          <div className="mx-auto max-w-[160px]">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="font-semibold text-slate-200">
                                {c.scoreBreakdown[m.key]}%
                              </span>
                            </div>
                            <Progress
                              value={c.scoreBreakdown[m.key]}
                              className="h-2"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td className="px-4 py-4 font-medium text-slate-300">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        Skill Gaps
                      </span>
                    </td>
                    {candidates.map((c) => (
                      <td key={c.candidateId} className="px-4 py-4">
                        <div className="flex flex-wrap justify-center gap-1">
                          {c.skillGaps.length === 0 ? (
                            <span className="text-xs font-medium text-emerald-400">
                              No gaps
                            </span>
                          ) : (
                            c.skillGaps.slice(0, 3).map((g) => (
                              <Badge key={g.skill} variant="outline" className="text-[10px] border-white/10 text-slate-400">
                                {g.skill}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-white/[0.02]">
                    <td className="px-4 py-4 font-medium text-slate-300">Action</td>
                    {candidates.map((c) => (
                      <td key={c.candidateId} className="px-4 py-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/candidate/${c.candidateId}`)}
                          className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        >
                          View Analysis
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </AuroraBackground>
  )
}