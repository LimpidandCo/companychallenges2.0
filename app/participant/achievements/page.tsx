'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui'
import { getAchievements } from '@/lib/actions/participants'

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const result = await getAchievements()
      if (result.success) {
        setAchievements(result.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Achievements</h1>
        <p className="mt-1 text-gray-600">
          Celebrate your learning milestones and accomplishments.
        </p>
      </header>

      {achievements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <TrophyIcon className="h-12 w-12 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No achievements yet
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Complete challenges and milestones to earn achievements. 
            They'll appear here as you progress through your learning journey.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map(achievement => {
            const milestone = achievement.milestone
            const celebrationType = milestone?.celebration_type || 'badge'
            
            return (
              <div
                key={achievement.id}
                className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow"
              >
                {/* Badge Visual */}
                <div className="relative inline-block mb-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    celebrationType === 'badge' 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : celebrationType === 'animation'
                        ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                        : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                  }`}>
                    {celebrationType === 'badge' ? (
                      <TrophyIcon className="h-10 w-10 text-white" />
                    ) : celebrationType === 'animation' ? (
                      <SparklesIcon className="h-10 w-10 text-white" />
                    ) : (
                      <StarIcon className="h-10 w-10 text-white" />
                    )}
                  </div>
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-30 ${
                    celebrationType === 'badge'
                      ? 'bg-amber-400'
                      : celebrationType === 'animation'
                        ? 'bg-purple-400'
                        : 'bg-blue-400'
                  }`} />
                </div>

                {/* Achievement Info */}
                <h3 className="font-semibold text-gray-900 mb-1">
                  {milestone?.name || 'Achievement'}
                </h3>
                
                {milestone?.celebration_content && (
                  <p className="text-sm text-gray-500 mb-3">
                    {milestone.celebration_content}
                  </p>
                )}

                <p className="text-xs text-gray-400">
                  Earned {formatDate(achievement.achieved_at)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Motivational Footer */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <RocketIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Keep going!</h4>
            <p className="text-sm text-gray-600">
              Continue completing challenges to unlock more achievements and reach your learning goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.999 0" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  )
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  )
}
