'use client'

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
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#00E5FF', '#4F46E5', '#7C3AED', '#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']

interface AnalyticsChartsProps {
  candidates: Array<{
    name: string
    overallScore: number
    matchCategory: string
    topSkills: string[]
    experienceYears: number
    educationLevel: string
  }>
}

export function ScoreDistributionChart({ candidates }: { candidates: AnalyticsChartsProps['candidates'] }) {
const data = [
    { name: '90-100', count: candidates.filter((c) => c.overallScore >= 90).length, color: '#00E5FF' },
    { name: '75-89', count: candidates.filter((c) => c.overallScore >= 75 && c.overallScore < 90).length, color: '#4F46E5' },
    { name: '60-74', count: candidates.filter((c) => c.overallScore >= 60 && c.overallScore < 75).length, color: '#7C3AED' },
    { name: 'Below 60', count: candidates.filter((c) => c.overallScore < 60).length, color: '#64748B' },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
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
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SkillsChart({ candidates }: { candidates: AnalyticsChartsProps['candidates'] }) {
  const skillCount: Record<string, number> = {}
  candidates.forEach((c) => {
    c.topSkills.forEach((s) => {
      skillCount[s] = (skillCount[s] || 0) + 1
    })
  })

  const data = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ name: skill, count }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#fff',
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ExperienceChart({ candidates }: { candidates: AnalyticsChartsProps['candidates'] }) {
  const data = candidates.map((c) => ({
    name: c.name.split(' ')[0],
    experience: c.experienceYears,
    score: c.overallScore,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
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
        <Area type="monotone" dataKey="experience" stroke="#00E5FF" strokeWidth={2} fill="url(#colorExp)" />
        <Area type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2} fill="url(#colorExp)" opacity={0.5} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function EducationChart({ candidates }: { candidates: AnalyticsChartsProps['candidates'] }) {
  const eduCount: Record<string, number> = {}
  candidates.forEach((c) => {
    const edu = c.educationLevel.split(',')[0] || 'Unknown'
    eduCount[edu] = (eduCount[edu] || 0) + 1
  })

  const data = Object.entries(eduCount).map(([name, value]) => ({ name, value }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#fff',
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ATSChart({ candidates }: { candidates: AnalyticsChartsProps['candidates'] }) {
  const sorted = [...candidates].sort((a, b) => b.overallScore - a.overallScore)
  const data = sorted.map((c) => ({
    name: c.name.split(' ')[0],
    ats: c.overallScore,
    target: 75,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
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
        <Bar dataKey="ats" radius={[6, 6, 0, 0]} fill="#00E5FF" opacity={0.8} />
        <Bar dataKey="target" radius={[6, 6, 0, 0]} fill="#4F46E5" opacity={0.3} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RankingTrendChart({ candidates }: { candidates: AnalyticsChartsProps['candidates'] }) {
  const sorted = [...candidates].sort((a, b) => b.overallScore - a.overallScore)
  const data = sorted.map((c, i) => ({
    rank: i + 1,
    score: c.overallScore,
    name: c.name.split(' ')[0],
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="rank" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
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
        <Line type="monotone" dataKey="score" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF', r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function AnalyticsDashboard({ candidates }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-300">ATS Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ATSChart candidates={candidates} />
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-300">Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreDistributionChart candidates={candidates} />
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-300">Skills Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsChart candidates={candidates} />
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-300">Experience vs Score</CardTitle>
        </CardHeader>
        <CardContent>
          <ExperienceChart candidates={candidates} />
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-300">Education Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <EducationChart candidates={candidates} />
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-300">Ranking Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <RankingTrendChart candidates={candidates} />
        </CardContent>
      </Card>
    </div>
  )
}