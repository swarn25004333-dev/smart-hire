import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import type { ScreeningResult } from '@/types'

export interface UploadedFile {
  id: string
  name: string
  size: number
  file: File
}

interface ScreeningContextValue {
  jobDescription: string
  setJobDescription: (value: string) => void
  uploadedFiles: UploadedFile[]
  addFiles: (files: UploadedFile[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  blindScreening: boolean
  setBlindScreening: (value: boolean) => void
  result: ScreeningResult | null
  setResult: (result: ScreeningResult | null) => void
  isScreening: boolean
  setIsScreening: (value: boolean) => void
  compareIds: string[]
  setCompareIds: (ids: string[]) => void
  reset: () => void
}

const ScreeningContext = createContext<ScreeningContextValue | null>(null)

export function ScreeningProvider({ children }: { children: ReactNode }) {
  const [jobDescription, setJobDescription] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [blindScreening, setBlindScreening] = useState(false)
  const [result, setResult] = useState<ScreeningResult | null>(null)
  const [isScreening, setIsScreening] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const addFiles = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }
  const clearFiles = () => setUploadedFiles([])

  const reset = () => {
    setJobDescription('')
    setUploadedFiles([])
    setBlindScreening(false)
    setResult(null)
    setIsScreening(false)
    setCompareIds([])
  }

  return (
    <ScreeningContext.Provider
      value={{
        jobDescription,
        setJobDescription,
        uploadedFiles,
        addFiles,
        removeFile,
        clearFiles,
        blindScreening,
        setBlindScreening,
        result,
        setResult,
        isScreening,
        setIsScreening,
        compareIds,
        setCompareIds,
        reset,
      }}
    >
      {children}
    </ScreeningContext.Provider>
  )
}

export function useScreening() {
  const ctx = useContext(ScreeningContext)
  if (!ctx) {
    throw new Error('useScreening must be used within ScreeningProvider')
  }
  return ctx
}
