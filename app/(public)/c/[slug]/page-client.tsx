'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { EmailIdentificationForm } from '@/components/public/auth-gate'
import { SupportModal } from '@/components/public/support-modal'
import { ChallengeDescriptionRenderer } from '@/components/public/content-renderer'
import { trackChallengeView } from '@/lib/actions/analytics'
import { gaChallengeView } from '@/lib/analytics/ga'
import { useLabels } from '@/lib/hooks/use-labels'
import type { Challenge, ChallengeLabel, Announcement, Sprint } from '@/lib/types/database'

interface ChallengePageClientProps {
  challenge: Challenge
  client: { name: string; logo_url?: string }
  hasAssignments: boolean
  labels?: ChallengeLabel[]
  announcements?: Announcement[]
  sprints?: Sprint[]
}

export function ChallengePageClient({
  challenge,
  client,
  hasAssignments,
  labels: initialLabels,
  announcements = [],
  sprints = [],
}: ChallengePageClientProps) {
  const hasTrackedView = useRef(false)
  
  const { getLabel } = useLabels({ 
    challengeId: challenge.id, 
    initialLabels 
  })

  useEffect(() => {
    if (hasTrackedView.current) return
    hasTrackedView.current = true
    trackChallengeView(challenge.client_id, challenge.id)
    gaChallengeView(challenge.id, challenge.public_title || challenge.internal_name)
  }, [challenge.client_id, challenge.id, challenge.public_title, challenge.internal_name])

  const title = challenge.show_public_title && challenge.public_title
    ? challenge.public_title
    : client.name

  const brandColor = challenge.brand_color || '#ff6b4a'
  const isIndividualMode = challenge.mode === 'individual' || challenge.mode === 'hybrid'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header
        className="border-b-4"
        style={{ borderColor: brandColor }}
      >
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="h-10 w-auto sm:h-12"
                />
              ) : (
                <span className="text-xl font-bold text-gray-900">{client.name}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasAssignments && !isIndividualMode && (
                <Link
                  href={`/${challenge.slug}/start`}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ 
                    backgroundColor: brandColor,
                    boxShadow: `0 4px 12px -4px ${brandColor}50`
                  }}
                >
                  {getLabel('start')}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}

              {(challenge.support_info || challenge.contact_info) && (
                <SupportModal 
                  supportInfo={challenge.support_info}
                  contactInfo={challenge.contact_info}
                  brandColor={brandColor}
                  variant="icon"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl tracking-tight mb-4">
            {title}
          </h1>

          {/* Individual mode badge */}
          {isIndividualMode && (
            <div className="flex items-center gap-2 mb-8">
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: brandColor }}
              >
                <UserIcon className="h-4 w-4" />
                Self-paced
              </span>
              {sprints.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  <SprintIcon className="h-4 w-4" />
                  {sprints.length} sprint{sprints.length !== 1 ? 's' : ''}
                </span>
              )}
              {challenge.sequential_sprints && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  <LockIcon className="h-4 w-4" />
                  Sequential unlock
                </span>
              )}
            </div>
          )}

          {/* Visual */}
          {challenge.visual_url && (
            <div className="mb-10 overflow-hidden rounded-2xl shadow-lg">
              <img
                src={challenge.visual_url}
                alt={title}
                className="h-auto w-full max-h-80 object-cover"
              />
            </div>
          )}

          {/* Description */}
          {(challenge.description_html || challenge.description) && (
            <div className="prose prose-lg max-w-none mb-10">
              <ChallengeDescriptionRenderer challenge={challenge} />
            </div>
          )}

          {/* Sprint overview for individual mode */}
          {isIndividualMode && sprints.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What you'll cover</h2>
              <div className="space-y-3">
                {sprints.map((sprint, index) => (
                  <div 
                    key={sprint.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <div 
                      className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                      {sprint.subtitle && (
                        <p className="text-sm text-gray-600">{sprint.subtitle}</p>
                      )}
                    </div>
                    {index > 0 && challenge.sequential_sprints && (
                      <LockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual mode: Email form / Continue button */}
          {isIndividualMode && hasAssignments && (
            <div className="mb-10 rounded-2xl border-2 border-gray-200 bg-gray-50 p-8">
              <EmailIdentificationForm
                challengeId={challenge.id}
                challengeSlug={challenge.slug}
                challengeTitle={title}
                brandColor={brandColor}
              />
            </div>
          )}

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="mt-10 space-y-4">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-xl border p-5 ${
                    a.is_pinned
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {a.is_pinned && <span className="text-sm">📌</span>}
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(a.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: a.content }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* No assignments state */}
          {!hasAssignments && (
            <div className="mt-12 flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{getLabel('coming_soon')}</h3>
              <p className="mt-2 text-gray-600 max-w-sm">
                Content is being prepared. Check back soon for {getLabel('assignments').toLowerCase()}!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            {getLabel('powered_by')} <span className="font-semibold text-gray-700">Company Challenges</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
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

function SprintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}
