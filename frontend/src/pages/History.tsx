import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Trash2, Search, History as HistoryIcon, Loader2, FileText, User } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import EngineBadge from '@/components/shared/EngineBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getHistory, deleteHistoryEntry } from '@/services/api'
import type { HistoryEntry } from '@/types'

export default function History() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getHistory()
      .then((data) => setEntries(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(
      (e) =>
        e.jobTitle?.toLowerCase().includes(q) ||
        (e.candidateName || '').toLowerCase().includes(q),
    )
  }, [entries, search])

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await deleteHistoryEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 pt-24">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
            <HistoryIcon className="h-3.5 w-3.5" />
            Screening History
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">History</h1>
          <p className="mt-2 text-sm text-slate-400">
            {entries.length} saved screenings, persisted in the local database.
          </p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, company, candidate..."
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm font-medium text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400">
            {error} — make sure the backend is running.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-400" />
            Loading history...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-white/5 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <HistoryIcon className="h-10 w-10 text-slate-600" />
              <p className="font-semibold text-slate-400">No screening history found</p>
              <p className="text-sm text-slate-600">Run a screening from the dashboard to see it here.</p>
              <Button className="mt-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500" onClick={() => navigate('/screening')}>
                Start Screening
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <Card
                key={entry.id}
                className="group border-white/5 bg-white/[0.03] transition-colors hover:border-cyan-500/20"
              >
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                  <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/candidates/${entry.candidateId}`)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        <User className="h-3 w-3" /> {entry.candidateName || 'Candidate'}
                      </span>
                      {entry.jobTitle && (
                        <span className="truncate text-sm font-semibold text-white">{entry.jobTitle}</span>
                      )}
                      {entry.atsScore !== undefined && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            entry.atsScore >= 75
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : entry.atsScore >= 60
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          ATS {Math.round(entry.atsScore)}%
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {entry.screeningDate
                        ? `${entry.screeningDate}${entry.screeningTime ? ` · ${entry.screeningTime}` : ''}`
                        : entry.createdAt
                          ? new Date(entry.createdAt).toLocaleString()
                          : 'Unknown date'}
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <EngineBadge engine={entry.engine} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                      onClick={() => navigate(`/candidates/${entry.candidateId}`)}
                      title="View profile"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      title="Delete"
                    >
                      {deleting === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </AuroraBackground>
  )
}
