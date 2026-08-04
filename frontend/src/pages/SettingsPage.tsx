import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, KeyRound, Zap, Power, Palette, Check, Loader2, AlertTriangle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuroraBackground from '@/components/layout/AuroraBackground'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getSettings, updateSettings } from '@/services/api'
import type { SettingsResponse } from '@/types'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [theme, setTheme] = useState('dark')
  const [offlineMode, setOfflineMode] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getSettings()
      .then((s) => {
        if (cancelled) return
        setSettings(s)
        setTheme(s.theme || 'dark')
        setOfflineMode(s.offlineMode)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const payload: Record<string, string | boolean> = { theme, offlineMode }
      if (geminiKey.trim()) payload.geminiApiKey = geminiKey.trim()
      if (openaiKey.trim()) payload.openaiApiKey = openaiKey.trim()
      const updated = await updateSettings(payload)
      setSettings(updated)
      setGeminiKey('')
      setOpenaiKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuroraBackground>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 pt-24">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
            <SettingsIcon className="h-3.5 w-3.5" />
            Application Settings
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Settings</h1>
          <p className="mt-2 text-sm text-slate-400">
            Configure AI providers, theme and runtime behavior. Values persist in the local database.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {loading || !settings ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-400" />
            Loading settings...
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                  <KeyRound className="h-4 w-4 text-cyan-400" /> AI Provider Keys
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Keys are stored in the local database and never returned by the API.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">Google Gemini API Key</label>
                    <StatusPill configured={settings.geminiConfigured} />
                  </div>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={settings.geminiConfigured ? '•••••••• (configured — enter to replace)' : 'Enter Gemini API key...'}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">OpenAI API Key</label>
                    <StatusPill configured={settings.openaiConfigured} />
                  </div>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={settings.openaiConfigured ? '•••••••• (configured — enter to replace)' : 'Enter OpenAI API key...'}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Zap className="h-4 w-4 text-cyan-400" /> Runtime Behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Power className="h-4 w-4 text-amber-400" /> Offline AI Mode
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Force the deterministic heuristic engine instead of calling AI providers.
                    </p>
                  </div>
                  <Toggle checked={offlineMode} onChange={setOfflineMode} />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <Palette className="h-3.5 w-3.5 text-cyan-400" /> Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
                    {['dark', 'light'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          'rounded-lg border px-4 py-2.5 text-sm font-semibold capitalize transition-colors',
                          theme === t
                            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10',
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="flex items-center gap-1 text-sm text-emerald-400">
                  <Check className="h-4 w-4" /> Settings saved
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 text-white hover:from-cyan-400 hover:to-blue-500"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </main>
    </AuroraBackground>
  )
}

function StatusPill({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-500">
      <AlertTriangle className="h-3 w-3" /> Not set
    </span>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-cyan-500' : 'bg-white/10',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
