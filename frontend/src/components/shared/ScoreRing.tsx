export default function ScoreRing({
  score,
  size = 96,
  strokeWidth = 8,
  label,
}: {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circumference - (clamped / 100) * circumference

  const color =
    clamped >= 90
      ? '#059669'
      : clamped >= 75
        ? '#2563eb'
        : clamped >= 60
          ? '#d97706'
          : '#dc2626'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {Math.round(clamped)}
          <span className="text-sm font-semibold text-slate-400">%</span>
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
