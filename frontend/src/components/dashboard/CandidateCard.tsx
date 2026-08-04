'use client'

import { useNavigate } from 'react-router-dom'
import {
  Eye,
  TrendingUp,
} from 'lucide-react'
import { cn, displayName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import ScoreRing from '@/components/shared/ScoreRing'
import { MatchBadge, categoryForScore } from '@/components/shared/MatchBadge'
import type { CandidateAnalysis } from '@/types'

interface CandidateCardProps {
  candidate: CandidateAnalysis
  rank: number
  selectMode?: boolean
  selected?: boolean
  blind?: boolean
  onToggleSelect?: () => void
  onView?: () => void
  animate?: boolean
}

export default function CandidateCard({
  candidate,
  rank,
  selectMode = false,
  selected = false,
  blind = false,
  onToggleSelect,
  onView,
  animate = true,
}: CandidateCardProps) {
  const navigate = useNavigate()

  const handleView = () => {
    if (onView) {
      onView()
    } else {
      navigate(`/candidate/${candidate.candidateId}`)
    }
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-500 hover:border-cyan-500/20 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1',
        selected && 'border-cyan-500/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/10',
        animate && 'animate-fade-in-up',
      )}
      style={{ animationDelay: `${Math.min(rank, 8) * 50}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <CardContent className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4 sm:w-1/3">
            {selectMode ? (
              <button
                onClick={onToggleSelect}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-all',
                  selected
                    ? 'border-cyan-500 bg-cyan-500 text-white'
                    : 'border-slate-600 text-transparent hover:border-cyan-500/50',
                )}
                aria-label="Toggle selection"
              >
                {rank <= 4 ? rank : '✓'}
              </button>
            ) : (
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                  rank === 1 && 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20',
                  rank === 2 && 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800',
                  rank === 3 && 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/20',
                  rank > 3 && 'bg-slate-700/50 text-slate-400',
                )}
              >
                {rank}
              </span>
            )}

            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg',
                  blind
                    ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                    : 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500',
                )}
              >
                {blind ? '?' : displayName(candidate, blind).split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {displayName(candidate, blind)}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {blind ? 'Identity hidden' : candidate.email}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 sm:flex sm:items-center sm:justify-center">
            <ScoreRing score={candidate.overallScore} size={72} strokeWidth={6} />
          </div>

          <div className="flex flex-1 flex-wrap gap-2 sm:w-1/3">
            {candidate.topSkills.slice(0, 4).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
              >
                {skill}
              </Badge>
            ))}
            {candidate.topSkills.length > 4 && (
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                +{candidate.topSkills.length - 4}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 sm:w-[26%] sm:justify-end">
            <div className="sm:hidden">
              <ScoreRing score={candidate.overallScore} size={56} strokeWidth={5} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp className="h-3 w-3" />
                {candidate.experienceYears} yrs
              </div>
              <MatchBadge category={categoryForScore(candidate.overallScore)} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              className="rounded-lg text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}