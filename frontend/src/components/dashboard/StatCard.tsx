'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  trend?: string
  trendUp?: boolean
  delay?: number
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-cyan-500/5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', color)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                trendUp
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400',
              )}
            >
              {trend}
            </span>
          )}
        </div>

        <p className="mt-3 text-3xl font-extrabold text-white counter-value">
          {value}
        </p>

        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <div className="absolute -bottom-10 -right-10 h-20 w-20 rounded-full bg-white/[0.02] blur-2xl" />
      </div>
    </div>
  )
}