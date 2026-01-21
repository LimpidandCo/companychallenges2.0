'use client'

import { useState, useEffect } from 'react'
import type { Milestone } from '@/lib/types/database'

interface MilestoneCelebrationProps {
  milestone: Milestone
  onClose: () => void
}

export function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true))

    // Show confetti for animation type
    if (milestone.celebration_type === 'animation') {
      setShowConfetti(true)
      // Auto-dismiss confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [milestone.celebration_type])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Confetti Animation */}
      {showConfetti && <ConfettiAnimation />}

      {/* Content */}
      <div 
        className={`relative w-full max-w-md transform transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[var(--color-accent)] to-[#ff8f70] p-8 text-center">
            {/* Decorative circles */}
            <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-white/10" />
            
            {/* Badge/Icon */}
            <div className="relative mb-4">
              {milestone.celebration_type === 'badge' && milestone.celebration_content ? (
                <img 
                  src={milestone.celebration_content} 
                  alt={milestone.name}
                  className="w-24 h-24 mx-auto rounded-2xl shadow-lg object-contain bg-white p-2"
                />
              ) : (
                <div className="w-24 h-24 mx-auto rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-5xl">🏆</span>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">
              {milestone.name}
            </h2>
            {milestone.description && (
              <p className="text-white/80 text-sm">
                {milestone.description}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="p-6 text-center">
            {milestone.celebration_type === 'message' && milestone.celebration_content ? (
              <p className="text-[var(--color-fg)] text-lg leading-relaxed">
                {milestone.celebration_content}
              </p>
            ) : (
              <p className="text-[var(--color-fg-muted)]">
                You've unlocked a new milestone! Keep up the great work.
              </p>
            )}

            <button
              onClick={handleClose}
              className="mt-6 w-full px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple confetti animation using CSS
 */
function ConfettiAnimation() {
  const colors = ['#ff6b4a', '#14b8a6', '#a78bfa', '#fbbf24', '#f87171', '#34d399']
  const confettiCount = 50

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const color = colors[i % colors.length]
        const left = Math.random() * 100
        const delay = Math.random() * 0.5
        const duration = 2 + Math.random() * 2
        const size = 8 + Math.random() * 8

        return (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${left}%`,
              top: '-20px',
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        )
      })}

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )
}

/**
 * Hook to manage milestone celebration queue
 */
export function useMilestoneCelebrations() {
  const [queue, setQueue] = useState<Milestone[]>([])
  const [current, setCurrent] = useState<Milestone | null>(null)

  const addMilestones = (milestones: Milestone[]) => {
    if (milestones.length === 0) return
    setQueue(prev => [...prev, ...milestones])
  }

  const handleClose = () => {
    setCurrent(null)
    // Show next in queue after a short delay
    setTimeout(() => {
      setQueue(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev
          setCurrent(next)
          return rest
        }
        return prev
      })
    }, 300)
  }

  // Process queue
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue
      setCurrent(next)
      setQueue(rest)
    }
  }, [queue, current])

  return {
    currentMilestone: current,
    addMilestones,
    handleClose,
    hasPending: queue.length > 0,
  }
}


