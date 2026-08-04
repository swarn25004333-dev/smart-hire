import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, Loader2, Users, Clock, Star } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getReports, downloadReport, type ReportMeta } from '@/services/api'
import { cn } from '@/lib/utils'

export default function Reports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getReports()
      .then((data) => {
        if (!cancelled) setReports(data)
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
  }, [])

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 pt-24">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
            <FileText className="h-3.5 w-3.5" />
            Generated Reports
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Reports</h1>
          <p className="mt-2 text-sm text-slate-400">
            Download detailed candidate screening reports as PDF.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400">
            {error} — make sure the backend is running.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-400" />
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-white/5 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <FileText className="h-10 w-10 text-slate-600" />
              <p className="font-semibold text-slate-400">No reports generated yet</p>
              <p className="text-sm text-slate-600">
                Open a candidate profile and hit &quot;Report&quot; to generate a PDF.
              </p>
              <Button
                className="mt-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                onClick={() => navigate('/candidates')}
              >
                <Users className="mr-2 h-4 w-4" /> Browse Candidates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((r, i) => (
              <Card
                key={r.reportId}
                className="group border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-cyan-500/30 animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                      <FileText className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                        r.atsScore >= 75
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : r.atsScore >= 60
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400',
                      )}
                    >
                      <Star className="h-3 w-3 fill-current" /> ATS {Math.round(r.atsScore)}%
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white">{r.candidateName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {r.jobTitle || r.resumeName || 'General screening report'}
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-600">
                    <Clock className="h-3 w-3" />
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Unknown date'}
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-white/10 bg-white/5 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
                      onClick={() => downloadReport(r.reportId)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
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
