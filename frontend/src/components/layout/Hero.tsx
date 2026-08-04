'use client'

import { useState, useEffect } from 'react'
import { UploadCloud, Sparkles, ArrowRight, Zap, Shield, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  duration?: number
}

function AnimatedCounter({ value, suffix = '', duration = 2000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = performance.now()

    function update(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(eased * value))
      if (progress < 1) {
        requestAnimationFrame(update)
      }
    }

    requestAnimationFrame(update)
  }, [value, duration])

  return (
    <span className="counter-value inline-block text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function Hero() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pt-48 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-semibold text-cyan-400 transition-all duration-1000',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Talent Screening
          </div>

          <h1
            className={cn(
              'mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl xl:text-8xl',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
              'transition-all duration-1000 delay-100',
            )}
          >
            Find the Best{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Candidate
            </span>{' '}
            in Seconds
          </h1>

          <p
            className={cn(
              'mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
              'transition-all duration-1000 delay-200',
            )}
          >
            AI-powered resume screening that analyzes, compares and ranks candidates
            using advanced machine learning.
          </p>

          <div
            className={cn(
              'mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
              'transition-all duration-1000 delay-300',
            )}
          >
            <Button
              variant="gradient"
              size="lg"
              className="group w-full sm:w-auto"
            >
              <UploadCloud className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              Upload Resume
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Try Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-8 lg:grid-cols-4',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
            'transition-all duration-1000 delay-500',
          )}
        >
          {[
            { value: 2500, suffix: '+', label: 'Resumes Screened', icon: Zap, color: 'text-cyan-400' },
            { value: 98, suffix: '%', label: 'Matching Accuracy', icon: Shield, color: 'text-emerald-400' },
            { value: 500, suffix: '+', label: 'Companies', icon: Brain, color: 'text-indigo-400' },
            { value: 10000, suffix: '+', label: 'Candidates Ranked', icon: Sparkles, color: 'text-violet-400' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/20 hover:bg-white/[0.04]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <stat.icon className={cn('h-6 w-6 mb-3', stat.color)} />
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}