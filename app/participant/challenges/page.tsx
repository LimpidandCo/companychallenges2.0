'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui'
import { getEnrolledChallenges } from '@/lib/actions/participants'
import type { EnrolledChallengeWithProgress } from '@/lib/types/database'

export default function ChallengesPage() {
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<EnrolledChallengeWithProgress[]>([])
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    async function load() {
      const result = await getEnrolledChallenges()
      if (result.success) {
        setChallenges(result.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filteredChallenges = challenges.filter(c => {
    if (filter === 'all') return true
    if (filter === 'completed') return c.completed_at !== null
    return c.completed_at === null
  })

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
        <h1 className="text-3xl font-bold text-gray-900">My Challenges</h1>
        <p className="mt-1 text-gray-600">
          Track your progress across all enrolled challenges.
        </p>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Challenge List */}
      {filteredChallenges.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No challenges yet' : `No ${filter.replace('_', ' ')} challenges`}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You haven't enrolled in any challenges yet." 
              : "No challenges match this filter."}
          </p>
          <Link
            href="/participant/challenges/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Available Challenges
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChallenges.map(enrollment => {
            const challenge = (enrollment as any).challenge
            const client = challenge?.client
            const brandColor = challenge?.brand_color || '#3b82f6'
            const title = challenge?.public_title || challenge?.internal_name || 'Challenge'
            const isCompleted = enrollment.completed_at !== null

            return (
              <Link
                key={enrollment.id}
                href={`/c/${challenge?.slug}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 transition-all hover:shadow-lg hover:border-gray-300"
              >
                <div className="flex items-start gap-5">
                  {/* Badge */}
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: brandColor }}
                  >
                    {client?.logo_url ? (
                      <img src={client.logo_url} alt="" className="w-10 h-10 object-contain" />
                    ) : (
                      title.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        {client?.name && (
                          <p className="text-sm text-gray-500">{client.name}</p>
                        )}
                      </div>
                      
                      {isCompleted && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckIcon className="h-3 w-3" />
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">
                          {enrollment.completedCount} of {enrollment.totalCount} assignments completed
                        </span>
                        <span className="font-semibold" style={{ color: brandColor }}>
                          {enrollment.progressPercentage}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${enrollment.progressPercentage}%`,
                            backgroundColor: brandColor
                          }}
                        />
                      </div>
                    </div>

                    {/* Enrolled Date */}
                    <p className="mt-3 text-xs text-gray-400">
                      Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>

                  <ChevronRightIcon className="flex-shrink-0 h-6 w-6 text-gray-400" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Browse More */}
      <div className="mt-8 text-center">
        <Link
          href="/participant/challenges/browse"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          Browse more challenges →
        </Link>
      </div>
    </div>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}
