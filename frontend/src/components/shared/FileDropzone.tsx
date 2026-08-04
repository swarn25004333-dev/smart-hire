'use client'

import { useCallback, useRef, useState } from 'react'
import { UploadCloud, FileText, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/utils'
import type { UploadedFile } from '@/context/ScreeningContext'
import { Badge } from '@/components/ui/badge'

const ACCEPTED = ['.pdf', '.docx', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

function ext(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot).toLowerCase() : ''
}

interface FileDropzoneProps {
  files: UploadedFile[]
  onAdd: (files: UploadedFile[]) => void
  onRemove: (id: string) => void
  isUploading?: boolean
  uploadProgress?: number
}

export default function FileDropzone({
  files,
  onAdd,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)

  const toUploaded = useCallback(
    (list: FileList | File[]): UploadedFile[] => {
      const next: UploadedFile[] = []
      Array.from(list).forEach((file) => {
        if (!ACCEPTED.includes(ext(file.name)) && !ACCEPTED.includes(file.type)) {
          setError(`"${file.name}" is not supported. Please upload PDF or DOCX.`)
          return
        }
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          size: file.size,
          file,
        })
      })
      return next
    },
    [],
  )

  const handleFiles = (list: FileList | File[]) => {
    setError(null)
    const valid = toUploaded(list)
    if (valid.length > 0) {
      onAdd(valid)
      if (valid.length > 0) {
        setScanning(true)
        setTimeout(() => {
          setScanning(false)
          setScanComplete(true)
          setTimeout(() => setScanComplete(false), 3000)
        }, 1500)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all duration-300',
          dragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02] shadow-lg shadow-cyan-500/10'
            : 'border-slate-600 bg-slate-800/30 hover:border-cyan-500/40 hover:bg-cyan-500/5',
          isUploading && 'pointer-events-none opacity-60',
        )}
      >
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-sm font-medium text-cyan-400">Scanning Resume...</p>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full w-1/3 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent bg-[length:200%_100%]" />
              </div>
            </div>
          </div>
        )}

        {scanComplete && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-emerald-400">Scan Complete</p>
            </div>
          </div>
        )}

        <div
          className={cn(
            'relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-violet-500/20 shadow-lg shadow-indigo-500/20 transition-transform',
            dragging && 'scale-110',
          )}
        >
          <UploadCloud className="h-8 w-8 text-cyan-400" />
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-200">
            Drag &amp; drop resumes here or{' '}
            <span className="text-cyan-400 underline underline-offset-2">
              click to upload
            </span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Supports PDF &amp; DOCX &middot; Multiple files allowed &middot; Max 10MB each
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs font-medium text-red-400">
          {error}
        </p>
      )}

      {isUploading && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-cyan-400">Uploading...</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-cyan-400">{Math.min(uploadProgress, 100)}%</span>
          </div>
        </div>
      )}

      {files.length > 0 && !isUploading && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="animate-fade-in-up flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all hover:border-cyan-500/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20">
                <FileText className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{f.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(f.size)}</p>
              </div>
              <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                {ext(f.name).slice(1).toUpperCase()}
              </Badge>
              <button
                onClick={() => onRemove(f.id)}
                className="shrink-0 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}