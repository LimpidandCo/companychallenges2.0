'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui'
import { getAvailableChallenges, enrollInChallenge } from '@/lib/actions/participants'

interface AvailableChallenge {
  id: string
  slug: string
  internal_name: string
  public_title?: string
  brand_color?: string
  visual_url?: string
  mode: string
  assignmentCount: number
  client?: {
    name: string
    logo_url?: string
  }
}

export default function BrowseChallengesPage() {
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<AvailableChallenge[]>([])
  const [enrolling, setEnrolling] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const result = await getAvailableChallenges()
      if (result.success) {
        setChallenges(result.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleEnroll = async (challengeId: string, slug: string) => {
    setEnrolling(challengeId)
    const result = await enrollInChallenge(challengeId)
    if (result.success) {
      // Navigate to the challenge
      window.location.href = `/${slug}`
    }
    setEnrolling(null)
  }

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
        <Link 
          href="/participant/challenges"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to My Challenges
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Browse Challenges</h1>
        <p className="mt-1 text-gray-600">
          Discover new learning opportunities and enroll to start tracking your progress.
        </p>
      </header>

      {challenges.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No challenges available
          </h3>
          <p className="text-gray-500">
            You've already enrolled in all available challenges, or no challenges exist yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {challenges.map(challenge => {
            const brandColor = challenge.brand_color || '#3b82f6'
            const title = challenge.public_title || challenge.internal_name

            return (
              <div
                key={challenge.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-lg hover:border-gray-300"
              >
                {/* Visual Header */}
                {challenge.visual_url ? (
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={challenge.visual_url} 
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="h-32 flex items-center justify-center"
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    <span 
                      className="text-6xl font-bold opacity-30"
                      style={{ color: brandColor }}
                    >
                      {title.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      {challenge.client?.logo_url ? (
                        <img src={challenge.client.logo_url} alt="" className="w-6 h-6 object-contain" />
                      ) : (
                        title.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
                      {challenge.client?.name && (
                        <p className="text-sm text-gray-500">{challenge.client.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <BookIcon className="h-4 w-4" />
                      {challenge.assignmentCount} assignments
                    </span>
                    <span className="flex items-center gap-1">
                      {challenge.mode === 'individual' ? (
                        <>
                          <UserIcon className="h-4 w-4" />
                          Individual
                        </>
                      ) : challenge.mode === 'collective' ? (
                        <>
                          <UsersIcon className="h-4 w-4" />
                          Collective
                        </>
                      ) : (
                        <>
                          <UsersIcon className="h-4 w-4" />
                          Hybrid
                        </>
                      )}
                    </span>
                  </div>

                  {/* Enroll Button */}
                  <button
                    onClick={() => handleEnroll(challenge.id, challenge.slug)}
                    disabled={enrolling === challenge.id}
                    className="w-full py-2.5 px-4 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: brandColor }}
                  >
                    {enrolling === challenge.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner size="sm" />
                        Enrolling...
                      </span>
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}


