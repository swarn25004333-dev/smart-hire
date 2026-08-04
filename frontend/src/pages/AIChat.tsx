import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import EngineBadge from '@/components/shared/EngineBadge'
import { Button } from '@/components/ui/button'
import { useScreening } from '@/context/ScreeningContext'
import { chatWithAI } from '@/services/api'
import type { ChatResponse } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  engine?: string
}

const SUGGESTIONS = [
  'Why did the top candidate score only that much?',
  'What skills are missing for the top candidate?',
  'Which candidate fits a Backend role best?',
  'Generate interview questions for the top candidate.',
  'Rank all candidates by ATS score.',
]

function buildContext(result: NonNullable<ReturnType<typeof useScreening>['result']>) {
  const candidates = (result.candidates ?? []).map((c) => ({
    name: c.name,
    overallScore: c.overallScore,
    skillsMatch: c.skillsMatch,
    matchedSkills: c.matchedSkills,
    missingSkills: c.missingSkills,
    strengths: c.strengths,
    weaknesses: c.weaknesses,
    recommendation: c.recommendation,
    experienceYears: c.experienceYears,
    interviewQuestions: c.interviewQuestions,
    educationLevel: c.educationLevel,
  }))
  return {
    candidates,
    jobAnalysis: {
      title: result.jobAnalysis?.title ?? 'the role',
      requiredSkills: result.jobAnalysis?.requiredSkills ?? [],
    },
  }
}

export default function AIChat() {
  const { result } = useScreening()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || loading) return
    setInput('')
    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setLoading(true)
    try {
      const ctx = result ? buildContext(result) : undefined
      const res: ChatResponse = await chatWithAI(message, ctx as Record<string, unknown>)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, engine: res.engine }])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into a problem reaching the AI service. Please try again.', engine: 'offline' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI Recruiter Assistant
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">AI Chat</h1>
          <p className="mt-2 text-sm text-slate-400">
            Ask about scores, missing skills, role fit and interview questions.
            {result ? ' Your latest screening is attached as context.' : ' Run a screening to attach context.'}
          </p>
        </div>

        <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                <Bot className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="text-sm font-semibold text-white">Smart Hire Assistant</span>
            </div>
            <EngineBadge engine={messages.length ? (messages[messages.length - 1].engine ?? 'offline') : 'offline'} />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10">
                  <Bot className="h-8 w-8 text-cyan-400" />
                </div>
                <p className="max-w-sm text-sm text-slate-400">
                  Hello! I'm your AI recruitment assistant. Ask me anything about the screening results.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                      : 'border border-white/5 bg-white/5 text-slate-200'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-400">
                      <Sparkles className="h-3 w-3" /> AI
                    </span>
                  )}
                  <span className="whitespace-pre-wrap">{m.content}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="border-t border-red-500/20 bg-red-500/5 px-5 py-2 text-xs text-red-400">
              <AlertTriangle className="mr-1 inline h-3 w-3" />
              {error}
            </div>
          )}

          <div className="border-t border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder="Ask about a candidate or the screening..."
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
              <Button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 p-0 text-white hover:from-cyan-400 hover:to-blue-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </AuroraBackground>
  )
}
