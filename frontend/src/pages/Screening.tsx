'use client'

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileSearch,
  ListChecks,
  FileText,
  Users,
  Calculator,
  Trophy,
  Loader2,
  CheckCircle2,
  ScanSearch,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import { useScreening } from '@/context/ScreeningContext'
import { screenResumes } from '@/services/api'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Reading Resume', icon: FileText, color: 'from-cyan-500 to-blue-500' },
  { label: 'Extracting Skills', icon: ListChecks, color: 'from-blue-500 to-indigo-500' },
  { label: 'Matching Candidates', icon: Users, color: 'from-indigo-500 to-violet-500' },
  { label: 'Calculating ATS', icon: Calculator, color: 'from-violet-500 to-purple-500' },
  { label: 'Generating Report', icon: FileSearch, color: 'from-purple-500 to-pink-500' },
  { label: 'Complete', icon: Trophy, color: 'from-pink-500 to-rose-500' },
]

export default function Screening() {
  const navigate = useNavigate()
  const { isScreening, setIsScreening, jobDescription, uploadedFiles, blindScreening, setResult } =
    useScreening()
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isScreening) {
      navigate('/', { replace: true })
      return
    }

    if (startedRef.current) return
    startedRef.current = true

    const run = async () => {
      setError(null)
      const stepInterval = setInterval(() => {
        setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev))
      }, 1000)

      try {
        const { result } = await screenResumes(
          { jobDescription, files: uploadedFiles, blindScreening },
          (step) => {
            if (step < STEPS.length) setActiveStep(step)
          },
        )
        clearInterval(stepInterval)
        setActiveStep(STEPS.length - 1)
        setResult(result)
        setIsScreening(false)
        navigate('/results', { replace: true })
      } catch (err: any) {
        clearInterval(stepInterval)
        const msg = err?.message || 'Failed to connect to screening server.'
        setError(msg)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doneSteps = activeStep

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-4 py-16">
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-6">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-cyan-500/30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-violet-500 shadow-xl shadow-indigo-500/30">
              <ScanSearch className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Analyzing Resumes
          </h1>
          <p className="mt-2 max-w-md text-center text-sm text-slate-400">
            Our AI is reading your job description and evaluating{' '}
            {uploadedFiles.length}{' '}
            resume{uploadedFiles.length > 1 ? 's' : ''} in real time.
          </p>
        </div>

        <div className="w-full space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 shadow-2xl shadow-black/30">
          {STEPS.map((step, index) => {
            const state =
              index < doneSteps
                ? 'done'
                : index === activeStep
                  ? 'active'
                  : 'pending'
            return (
              <div
                key={step.label}
                className={cn(
                  'flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-500',
                  state === 'active' && 'bg-cyan-500/10 ring-1 ring-cyan-500/20',
                  state === 'done' && 'bg-emerald-500/10',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                    state === 'active' && 'bg-cyan-500 text-white',
                    state === 'done' && 'bg-emerald-500 text-white',
                    state === 'pending' && 'bg-white/5 text-slate-500',
                  )}
                >
                  {state === 'done' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : state === 'active' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </span>
                <span
                  className={cn(
                    'flex-1 text-sm font-medium transition-colors',
                    state === 'pending' && 'text-slate-500',
                    state === 'active' && 'text-cyan-300',
                    state === 'done' && 'text-emerald-300',
                  )}
                >
                  {step.label}
                </span>
                {state === 'active' && (
                  <span className="h-1.5 w-20 overflow-hidden rounded-full bg-cyan-500/20">
                    <span className="block h-full w-1/3 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent bg-[length:200%_100%]" />
                  </span>
                )}
                {state === 'done' && (
                  <span className="text-xs font-semibold text-emerald-400">
                    Done
                  </span>
                )}
              </div>
            )
          })}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
              <p className="text-sm font-semibold text-red-400">Screening Failed</p>
              <p className="mt-1 text-xs text-red-400/70">{error}</p>
              <button
                onClick={() => {
                  setIsScreening(false)
                  navigate('/', { replace: true })
                }}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        {!error && (
          <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            This usually takes less than a minute
          </p>
        )}
      </main>
    </AuroraBackground>
  )
}