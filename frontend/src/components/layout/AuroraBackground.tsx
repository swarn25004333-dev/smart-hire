'use client'

import { useEffect, useRef, useState } from 'react'

export default function AuroraBackground({
  children,
  className = '',
}: {
  children?: React.ReactNode
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number; opacity: number; color: string }>>([])

  useEffect(() => {
    const colors = [
      'rgba(0, 229, 255, 0.3)',
      'rgba(79, 70, 229, 0.3)',
      'rgba(124, 58, 237, 0.2)',
      'rgba(0, 188, 212, 0.2)',
    ]

    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      })
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove, { passive: true })
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-aurora-gradient" />

      <div className="absolute inset-0 bg-grid-pattern opacity-40" />

      <div className="absolute inset-0 bg-dot-pattern opacity-30" />

      <div className="absolute left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px] animate-orb-drift-1" />
      <div className="absolute right-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px] animate-orb-drift-2" />
      <div className="absolute bottom-[10%] left-[30%] h-[350px] w-[350px] rounded-full bg-violet-500/8 blur-[90px] animate-orb-drift-3" />
      <div className="absolute right-[20%] bottom-[20%] h-[300px] w-[300px] rounded-full bg-cyan-400/5 blur-[80px] animate-orb-drift-1" />

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            animation: `particle-float ${8 + particle.speed * 10}s linear infinite`,
            animationDelay: `${particle.id * 0.3}s`,
          }}
        />
      ))}

      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(0, 229, 255, 0.06), transparent 40%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}