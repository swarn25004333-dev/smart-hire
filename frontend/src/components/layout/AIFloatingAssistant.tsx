'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Bot, X, Loader2, Send, AlertTriangle } from 'lucide-react'
import EngineBadge from '@/components/shared/EngineBadge'
import { useScreening } from '@/context/ScreeningContext'
import { chatWithAI } from '@/services/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  engine?: string
}

const SUGGESTIONS = [
  'Top candidate summary?',
  'Why the low score?',
  'What skills are missing?',
  'Best candidate for Backend?',
  'Interview questions?',
]

function buildContext(result: ReturnType<typeof useScreening>['result']) {
  if (!result) return undefined
  return {
    candidates: (result.candidates ?? []).map((c) => ({
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
    })),
    jobAnalysis: {
      title: result.jobAnalysis?.title ?? 'the role',
      requiredSkills: result.jobAnalysis?.requiredSkills ?? [],
    },
  }
}

export default function AIFloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { result } = useScreening()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, isOpen])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || loading) return
    setInput('')
    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setLoading(true)
    try {
      const ctx = buildContext(result)
      const res = await chatWithAI(message, ctx as Record<string, unknown> | undefined)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, engine: res.engine }])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40"
        >
          <Bot className="h-5 w-5" />
          <span className="hidden sm:inline">AI Assistant</span>
          <Sparkles className="h-3.5 w-3.5" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[calc(100vw-3rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Smart Hire AI</p>
                <p className="text-[10px] text-cyan-400">Assistant Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Hello Recruiter</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {result
                      ? 'Ask me anything about your latest screening.'
                      : 'Run a screening first, then I can explain scores, skills and role fit.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
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
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                      : 'border border-white/5 bg-white/5 text-slate-200'
                  }`}
                >
                  {m.role === 'assistant' && m.engine && (
                    <div className="mb-1">
                      <EngineBadge engine={m.engine} className="scale-90 origin-left" />
                    </div>
                  )}
                  <span className="whitespace-pre-wrap">{m.content}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="flex items-center gap-1 border-t border-red-500/20 bg-red-500/5 px-4 py-2 text-[11px] text-red-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {error}
            </div>
          )}

          <div className="border-t border-white/10 p-3">
            <div className="flex items-end gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    send(input)
                  }
                }}
                placeholder="Ask about candidates..."
                className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/50"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                aria-label="Send message"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
