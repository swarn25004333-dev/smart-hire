import { Badge } from '@/components/ui/badge'
import type { MatchCategory } from '@/types'

const config: Record<
  MatchCategory,
  { label: string; variant: 'success' | 'info' | 'warning' | 'destructive' }
> = {
  strong: { label: 'Strong Match', variant: 'success' },
  good: { label: 'Good Match', variant: 'info' },
  'needs-review': { label: 'Needs Review', variant: 'warning' },
  low: { label: 'Low Match', variant: 'destructive' },
}

export function categoryForScore(score: number): MatchCategory {
  if (score >= 90) return 'strong'
  if (score >= 75) return 'good'
  if (score >= 60) return 'needs-review'
  return 'low'
}

export function MatchBadge({
  category,
  className,
}: {
  category: MatchCategory
  className?: string
}) {
  const cfg = config[category]
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  )
}
