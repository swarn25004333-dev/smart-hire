import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Logo from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { useScreening } from '@/context/ScreeningContext'

export default function Header({
  onNewScreening,
}: {
  onNewScreening?: () => void
}) {
  const navigate = useNavigate()
  const { reset, isScreening } = useScreening()

  const handleNew = () => {
    reset()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 nav-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3"
          aria-label="Smart Hire home"
        >
          <Logo />
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <span className="hidden text-sm font-medium text-slate-300 sm:block">
            AI Resume Screening
          </span>
        </button>
        <div className="flex items-center gap-3">
          {!isScreening && (
            <Button
              variant="gradient"
              size="sm"
              onClick={onNewScreening ?? handleNew}
              className="rounded-xl"
            >
              <Plus className="h-4 w-4" />
              New Screening
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}