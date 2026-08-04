import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { BarChart3, Users, FileSearch, TrendingUp, Loader2, AlertTriangle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAnalytics } from '@/services/api'
import type { AnalyticsResponse } from '@/types'

const COLORS = ['#00E5FF', '#4F46E5', '#7C3AED', '#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getAnalytics()
      .then((d) => {
        if (!cancelled) setData(d)
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
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics Dashboard
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Analytics</h1>
          <p className="mt-2 text-sm text-slate-400">
            Aggregate insights from the candidate pool and screening history.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400">
            {error} — make sure the backend is running.
          </div>
        )}

        {loading || !data ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-400" />
            Crunching analytics...
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="Total Candidates"
                value={data.overview.totalCandidates}
                accent="from-cyan-500/20 to-blue-500/5 text-cyan-300"
              />
              <StatCard
                icon={<FileSearch className="h-5 w-5" />}
                label="Total Screenings"
                value={data.overview.totalScreenings}
                accent="from-violet-500/20 to-fuchsia-500/5 text-violet-300"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Average ATS"
                value={`${data.overview.averageATS}%`}
                accent="from-emerald-500/20 to-teal-500/5 text-emerald-300"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-slate-300">Resume Upload Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.uploadTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="value" stroke="#00E5FF" strokeWidth={2} fill="url(#gradTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-slate-300">Hiring Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.overview.recommendations}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={(p) => `${p.name}`}
                      >
                        {data.overview.recommendations.map((entry) => (
                          <Cell key={entry.name} fill={COLORS[data.overview.recommendations.indexOf(entry) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-slate-300">Top Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.topSkills} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {data.topSkills.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-slate-300">Most Common Missing Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.missingSkills.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.missingSkills} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {data.missingSkills.map((entry) => (
                            <Cell key={entry.name} fill="#F59E0B" opacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-slate-500">
                      <AlertTriangle className="h-8 w-8" />
                      <p className="text-sm">No missing skills recorded yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-slate-300">Experience Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.experienceDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#4F46E5" opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-slate-300">Education Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.educationDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {data.educationDistribution.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </AuroraBackground>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  accent: string
}) {
  return (
    <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="text-2xl font-extrabold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
