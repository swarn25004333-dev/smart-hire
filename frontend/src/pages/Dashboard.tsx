'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Briefcase,
  UploadCloud,
  Brain,
  Trophy,
  ClipboardList,
  Eye,
  ArrowRight,
  Shield,
  Zap,
  Star,
  Rocket,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import FileDropzone from '@/components/shared/FileDropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useScreening } from '@/context/ScreeningContext'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Paste the Job Description',
    desc: 'Add the JD and let AI extract requirements.',
  },
  {
    icon: UploadCloud,
    title: 'Upload Resumes',
    desc: 'Drop multiple PDF or DOCX resumes at once.',
  },
  {
    icon: Brain,
    title: 'AI Analyzes',
    desc: 'AI parses skills, experience & projects.',
  },
  {
    icon: Trophy,
    title: 'Rank Candidates',
    desc: 'Get scores, rankings and detailed analysis.',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    jobDescription,
    setJobDescription,
    uploadedFiles,
    addFiles,
    removeFile,
    blindScreening,
    setBlindScreening,
    setIsScreening,
  } = useScreening()

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const canSubmit = jobDescription.trim().length > 20 && uploadedFiles.length > 0

  const handleStart = () => {
    if (!canSubmit) return
    setIsScreening(true)
    navigate('/screening')
  }

  const handleUploadFiles = (files: { id: string; name: string; size: number; file: File }[]) => {
    setIsUploading(true)
    setUploadProgress(0)
    addFiles(files)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prev + Math.random() * 30
      })
    }, 200)
  }

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="pt-28 pb-16 sm:pt-36 sm:pb-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-5 py-2 text-xs font-semibold text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Talent Screening
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Find the Best{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Candidate
              </span>{' '}
              in Seconds
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
              AI-powered resume screening that analyzes, compares and ranks candidates
              using advanced machine learning.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                variant="gradient"
                size="lg"
                className="group w-full sm:w-auto"
                onClick={() => {
                  const el = document.getElementById('upload-section')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <UploadCloud className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                Upload Resume
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Rocket className="h-4 w-4" />
                Try Demo
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-5" id="upload-section">
          <Card className="glass-card-hover overflow-hidden lg:col-span-3">
            <div className="border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-indigo-500/5 px-6 py-4">
              <h2 className="text-base font-bold text-white">Create New Screening</h2>
              <p className="text-xs text-slate-500">No sign-up needed. Start screening instantly.</p>
            </div>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Briefcase className="h-4 w-4 text-cyan-400" />
                  Job Description
                </Label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste your job description here..."
                  className="min-h-[160px] resize-y bg-white/5 border-white/10 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus-visible:ring-cyan-500/50"
                />
                <p className="text-right text-xs text-slate-500">
                  {jobDescription.trim().length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <UploadCloud className="h-4 w-4 text-cyan-400" />
                  Upload Resumes
                </Label>
                <FileDropzone
                  files={uploadedFiles}
                  onAdd={handleUploadFiles}
                  onRemove={removeFile}
                  isUploading={isUploading}
                  uploadProgress={Math.min(uploadProgress, 100)}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Eye className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Blind Screening</p>
                    <p className="text-xs text-slate-500">
                      Hide names &amp; personal details. Rank on qualifications only.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={blindScreening}
                  onCheckedChange={setBlindScreening}
                  aria-label="Blind screening"
                />
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} resume${uploadedFiles.length > 1 ? 's' : ''} ready to screen`
                    : 'Add a job description and at least one resume'}
                </p>
                <Button
                  variant="gradient"
                  size="lg"
                  disabled={!canSubmit}
                  onClick={handleStart}
                  className="group"
                >
                  <Zap className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  Start AI Screening
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card className="glass-card">
              <CardContent className="p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  How it works
                </h3>
                <ol className="space-y-5">
                  {STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                        <step.icon className="h-4.5 w-4.5" />
                        {i < STEPS.length - 1 && (
                          <span className="absolute left-1/2 top-9 h-[calc(100%+8px)] w-px -translate-x-1/2 bg-white/10" />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-semibold text-slate-200">{step.title}</p>
                        <p className="text-xs text-slate-500">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  Why Smart Hire
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: Shield, text: 'Blind screening eliminates bias', color: 'text-cyan-400' },
                    { icon: Zap, text: 'Results in under 60 seconds', color: 'text-amber-400' },
                    { icon: Star, text: '98% matching accuracy', color: 'text-emerald-400' },
                    { icon: Brain, text: 'Powered by Gemini & OpenAI', color: 'text-violet-400' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <item.icon className={cn('h-5 w-5', item.color)} />
                      <span className="text-sm text-slate-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="mt-16 border-t border-white/5 pt-6 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
            Built with <Sparkles className="h-3 w-3 text-cyan-500" /> React,
            FastAPI &amp; AI &middot; Smart Hire Portfolio Project
          </p>
        </footer>
      </main>
    </AuroraBackground>
  )
}