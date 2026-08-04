import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatScore(score: number): number {
  return Math.round(score)
}

export function initials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function displayName(
  candidate: { candidateId: string; name: string },
  blind: boolean,
): string {
  if (!blind) return candidate.name
  const num = candidate.candidateId.replace(/\D/g, '') || '1'
  return `Candidate ${num}`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

export function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#059669'
  if (score >= 75) return '#2563eb'
  if (score >= 60) return '#d97706'
  return '#dc2626'
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Strong Match'
  if (score >= 75) return 'Good Match'
  if (score >= 60) return 'Needs Review'
  return 'Low Match'
}

export function getMatchCategoryColor(category: string): string {
  switch (category) {
    case 'strong':
      return 'text-emerald-400'
    case 'good':
      return 'text-blue-400'
    case 'needs-review':
      return 'text-amber-400'
    case 'low':
      return 'text-red-400'
    default:
      return 'text-slate-400'
  }
}

export function getMatchCategoryBg(category: string): string {
  switch (category) {
    case 'strong':
      return 'bg-emerald-500/10 border-emerald-500/20'
    case 'good':
      return 'bg-blue-500/10 border-blue-500/20'
    case 'needs-review':
      return 'bg-amber-500/10 border-amber-500/20'
    case 'low':
      return 'bg-red-500/10 border-red-500/20'
    default:
      return 'bg-slate-500/10 border-slate-500/20'
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function animateValue(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void,
): void {
  const startTime = performance.now()
  const diff = to - from

  function update(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(progress)
    callback(from + diff * eased)
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trim() + '...'
}

export function pluralize(count: number, singular: string, plural?: string): string {
  const p = plural ?? `${singular}s`
  return count === 1 ? singular : p
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export function calculateWeightedScore(
  weights: Record<string, number>,
  scores: Record<string, number>,
): number {
  let totalWeight = 0
  let weightedSum = 0

  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key] ?? 0
    weightedSum += score * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0
}

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'layout-dashboard' },
  { label: 'Candidates', href: '/results', icon: 'users' },
  { label: 'Analytics', href: '/analytics', icon: 'chart-bar' },
  { label: 'Reports', href: '/reports', icon: 'file-text' },
  { label: 'History', href: '/history', icon: 'clock' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
] as const

export type NavItem = typeof NAV_ITEMS[number]