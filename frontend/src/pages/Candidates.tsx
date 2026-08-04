import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  MapPin,
  Briefcase,
  SlidersHorizontal,
  Download,
  Users,
  Loader2,
  ArrowUpDown,
  GraduationCap,
  Star,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import ScoreRing from '@/components/shared/ScoreRing'
import { MatchBadge, categoryForScore } from '@/components/shared/MatchBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getCandidates, downloadCandidateResume, type CandidateFilters } from '@/services/api'
import type { CandidateProfile } from '@/types'

const ALL_SKILLS = ['Python', 'React', 'Java', 'AWS', 'Docker', 'Machine Learning', 'Flutter', 'MongoDB', 'DevOps', 'SQL']
const ALL_LOCATIONS = ['Bengaluru', 'Pune', 'Hyderabad', 'Mumbai', 'Gurugram', 'Delhi', 'Jaipur']

export default function Candidates() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [skill, setSkill] = useState('')
  const [location, setLocation] = useState('')
  const [minExperience, setMinExperience] = useState('')
  const [sortBy, setSortBy] = useState('atsScore')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const filters: CandidateFilters = {
      search: search || undefined,
      skill: skill || undefined,
      location: location || undefined,
      minExperience: minExperience ? Number(minExperience) : undefined,
      sortBy,
      order,
    }
    getCandidates(filters)
      .then((data) => {
        if (!cancelled) setCandidates(data.candidates)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [search, skill, location, minExperience, sortBy, order])

  const stats = useMemo(() => {
    if (!candidates.length) return { avg: 0, strong: 0, top: '-' }
    const avg = Math.round(candidates.reduce((s, c) => s + c.atsScore, 0) / candidates.length)
    const strong = candidates.filter((c) => c.atsScore >= 75).length
    return { avg, strong, top: candidates[0]?.name }
  }, [candidates])

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 pt-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
                <Users className="h-3.5 w-3.5" />
                Candidate Database
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                Browse Candidates
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {candidates.length} profiles &middot; average ATS {stats.avg}% &middot; {stats.strong} strong matches
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-white/5 bg-white/[0.03] backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, role, skill..."
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm font-medium text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <select
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="h-10 cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 text-xs font-medium text-slate-300 outline-none focus:border-cyan-500/50"
                >
                  <option value="">All Skills</option>
                  {ALL_SKILLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 text-xs font-medium text-slate-300 outline-none focus:border-cyan-500/50"
                >
                  <option value="">All Locations</option>
                  {ALL_LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <select
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  className="h-10 cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 text-xs font-medium text-slate-300 outline-none focus:border-cyan-500/50"
                >
                  <option value="">Any Experience</option>
                  <option value="1">1+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="7">7+ years</option>
                </select>
              </div>

              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 text-xs font-medium text-slate-300 outline-none focus:border-cyan-500/50"
                >
                  <option value="atsScore">Sort: ATS Score</option>
                  <option value="name">Sort: Name</option>
                  <option value="experience">Sort: Experience</option>
                  <option value="communication">Sort: Communication</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
                className="h-10 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              >
                {order === 'desc' ? 'High → Low' : 'Low → High'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400">
            {error} — make sure the backend is running.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-400" />
            Loading candidates...
          </div>
        ) : candidates.length === 0 ? (
          <Card className="border-white/5 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Users className="h-10 w-10 text-slate-600" />
              <p className="font-semibold text-slate-400">No candidates match your filters</p>
              <p className="text-sm text-slate-600">Try adjusting the search or clearing filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {candidates.map((c, i) => (
              <CandidateGridCard key={c.id} candidate={c} index={i} onOpen={() => navigate(`/candidates/${c.id}`)} />
            ))}
          </div>
        )}
      </main>
    </AuroraBackground>
  )
}

function CandidateGridCard({
  candidate,
  index,
  onOpen,
}: {
  candidate: CandidateProfile
  index: number
  onOpen: () => void
}) {
  const isTop = index === 0
  return (
    <Card
      onClick={onOpen}
      className={cn(
        'group cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10 animate-fade-in-up',
        isTop && 'border-amber-500/30',
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900/60 px-5 pb-4 pt-6">
        {isTop && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            <Star className="h-3 w-3 fill-amber-400" /> TOP MATCH
          </span>
        )}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5">
            {candidate.photo ? (
              <img src={candidate.photo} alt={candidate.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">{candidate.name.split(' ').slice(0, 2).map((p) => p[0]).join('')}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-white">{candidate.name}</p>
            <p className="truncate text-xs text-slate-400">{candidate.role}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin className="h-3 w-3" /> {candidate.location}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <ScoreRing score={candidate.atsScore} size={64} strokeWidth={6} label="ATS" />
          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-white/5 text-slate-300 border-white/10">
              <Briefcase className="mr-1 h-3 w-3 text-cyan-400" />
              {candidate.experience} yrs
            </Badge>
            <MatchBadge category={categoryForScore(candidate.atsScore)} />
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {candidate.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
              {s}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">
              +{candidate.skills.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <GraduationCap className="h-3 w-3" /> {candidate.university}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              downloadCandidateResume(candidate.id)
            }}
            className="h-7 px-2 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
          >
            <Download className="h-3.5 w-3.5" />
            Resume
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
