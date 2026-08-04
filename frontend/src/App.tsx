import { Navigate, Route, Routes } from 'react-router-dom'
import { ScreeningProvider, useScreening } from '@/context/ScreeningContext'
import Dashboard from '@/pages/Dashboard'
import Screening from '@/pages/Screening'
import Results from '@/pages/Results'
import CandidateDetail from '@/pages/CandidateDetail'
import Compare from '@/pages/Compare'
import Candidates from '@/pages/Candidates'
import CandidateProfile from '@/pages/CandidateProfile'
import History from '@/pages/History'
import Analytics from '@/pages/Analytics'
import Reports from '@/pages/Reports'
import SettingsPage from '@/pages/SettingsPage'
import AIChat from '@/pages/AIChat'
import AIFloatingAssistant from '@/components/layout/AIFloatingAssistant'

function RequireResult({ children }: { children: React.ReactNode }) {
  const { result } = useScreening()
  if (!result) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ScreeningProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/screening" element={<Screening />} />
        <Route
          path="/results"
          element={
            <RequireResult>
              <Results />
            </RequireResult>
          }
        />
        <Route
          path="/candidate/:candidateId"
          element={
            <RequireResult>
              <CandidateDetail />
            </RequireResult>
          }
        />
        <Route
          path="/compare"
          element={
            <RequireResult>
              <Compare />
            </RequireResult>
          }
        />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/candidates/:id" element={<CandidateProfile />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AIFloatingAssistant />
    </ScreeningProvider>
  )
}
