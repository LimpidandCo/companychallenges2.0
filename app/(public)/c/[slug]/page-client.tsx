'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { UsernameIdentificationForm } from '@/components/public/auth-gate'
import { SupportModal } from '@/components/public/support-modal'
import { ChallengeDescriptionRenderer } from '@/components/public/content-renderer'
import { trackChallengeView } from '@/lib/actions/analytics'
import { gaChallengeView } from '@/lib/analytics/ga'
import { useLabels } from '@/lib/hooks/use-labels'
import type { Challenge, ChallengeLabel, Announcement } from '@/lib/types/database'

interface ChallengePageClientProps {
  challenge: Challenge
  client: { name: string; logo_url?: string }
  hasAssignments: boolean
  labels?: ChallengeLabel[]
  announcements?: Announcement[]
}

export function ChallengePageClient({
  challenge,
  client,
  hasAssignments,
  labels: initialLabels,
  announcements = [],
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

  const showTitle = challenge.show_public_title !== false
  const title = showTitle && challenge.public_title
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
          {showTitle && (
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl tracking-tight mb-4">
              {title}
            </h1>
          )}

          {/* Pinned announcements — prominent position at top */}
          {announcements.filter(a => a.is_pinned).length > 0 && (
            <div className="mb-8 space-y-3">
              {announcements.filter(a => a.is_pinned).map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">📌</span>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(a.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: a.content_html || a.content }}
                  />
                </div>
              ))}
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

          {/* Individual mode: Username form / Continue button */}
          {isIndividualMode && hasAssignments && (
            <div className="mb-10 rounded-2xl border-2 border-gray-200 bg-gray-50 p-8">
              <UsernameIdentificationForm
                challengeId={challenge.id}
                challengeSlug={challenge.slug}
                challengeTitle={title}
                brandColor={brandColor}
              />
            </div>
          )}

          {/* Non-pinned announcements */}
          {announcements.filter(a => !a.is_pinned).length > 0 && (
            <div className="mt-10 space-y-4">
              {announcements.filter(a => !a.is_pinned).map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(a.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: a.content_html || a.content }}
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

