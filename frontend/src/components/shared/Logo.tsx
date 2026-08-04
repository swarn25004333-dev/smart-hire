import { Sparkles } from 'lucide-react'

export default function Logo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      {showText && (
        <div className="leading-tight">
          <span className="block text-base font-bold tracking-tight text-slate-900">
            Smart Hire
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-500">
            AI Resume Screening
          </span>
        </div>
      )}
    </div>
  )
}
