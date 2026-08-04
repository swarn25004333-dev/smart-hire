import { Bot, Cpu, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const ENGINES: Record<string, { label: string; icon: typeof Bot; className: string }> = {
  groq: {
    label: 'Powered by Groq',
    icon: Sparkles,
    className: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  },
  gemini: {
    label: 'Powered by Gemini AI',
    icon: Sparkles,
    className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  },
  openai: {
    label: 'Powered by OpenAI',
    icon: Sparkles,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  offline: {
    label: 'Offline AI Mode',
    icon: Cpu,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
}

export default function EngineBadge({
  engine,
  poweredBy,
  className,
}: {
  engine?: string
  poweredBy?: string
  className?: string
}) {
  const key = engine === 'groq' || engine === 'gemini' || engine === 'openai' || engine === 'offline' ? engine : 'offline'
  const cfg = ENGINES[key]
  const label = poweredBy || cfg.label
  const Icon = cfg.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide',
        cfg.className,
        className,
      )}
      title={label}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
