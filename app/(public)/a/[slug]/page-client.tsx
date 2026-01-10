'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordGate } from '@/components/public/password-gate'
import type { Assignment } from '@/lib/types/database'
import type { AssignmentNavContext } from '@/lib/actions/public'

interface AssignmentPageClientProps {
  assignment: Assignment
  requiresPassword: boolean
  initialHasAccess: boolean
  isReleased: boolean
  releaseAt?: string
  navContext?: AssignmentNavContext
}

export function AssignmentPageClient({
  assignment,
  requiresPassword,
  initialHasAccess,
  isReleased,
  releaseAt,
  navContext
}: AssignmentPageClientProps) {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(initialHasAccess)

  const title = assignment.public_title || assignment.internal_title
  const challengeSlug = navContext?.challenge.slug

  // Show password gate if required and not yet verified
  if (requiresPassword && !hasAccess) {
    return (
      <PasswordGate
        assignmentId={assignment.id}
        assignmentTitle={title}
        onSuccess={() => {
          setHasAccess(true)
          router.refresh()
        }}
      />
    )
  }

  // Show release date message if not yet released
  if (!isReleased && releaseAt) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        {/* Navigation Bar */}
        {navContext && (
          <nav
            className="border-b border-[var(--color-border)]"
            style={{ backgroundColor: navContext.challenge.brandColor || 'var(--color-bg-subtle)' }}
          >
            <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
              <Link
                href={`/c/${challengeSlug}`}
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: navContext.challenge.brandColor ? '#ffffff' : 'var(--color-fg)' }}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Back to {navContext.challenge.publicTitle || navContext.challenge.internalName}
              </Link>
            </div>
          </nav>
        )}

        {/* Scheduled Release Message */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
              <CalendarIcon className="h-10 w-10 text-[var(--color-accent)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-fg)] mb-2">{title}</h1>
            <p className="text-lg text-[var(--color-fg-muted)] mb-4">
              This assignment will be available on
            </p>
            <p className="text-xl font-semibold text-[var(--color-accent)]">
              {formatDate(releaseAt)}
            </p>
            {navContext && (
              <Link
                href={`/c/${challengeSlug}`}
                className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Return to Challenge
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render the assignment content
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Navigation Bar */}
      {navContext && (
        <nav
          className="sticky top-0 z-40 border-b border-[var(--color-border)]"
          style={{ backgroundColor: navContext.challenge.brandColor || 'var(--color-bg-subtle)' }}
        >
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link
                href={`/c/${challengeSlug}`}
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: navContext.challenge.brandColor ? '#ffffff' : 'var(--color-fg)' }}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {navContext.challenge.publicTitle || navContext.challenge.internalName}
                </span>
                <span className="sm:hidden">Back</span>
              </Link>

              {/* Progress Indicator */}
              <div
                className="text-sm font-medium"
                style={{ color: navContext.challenge.brandColor ? 'rgba(255,255,255,0.9)' : 'var(--color-fg-muted)' }}
              >
                {navContext.currentPosition} of {navContext.totalCount}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[var(--color-fg)] sm:text-3xl">
            {title}
          </h1>
          {assignment.subtitle && (
            <p className="mt-2 text-lg text-[var(--color-fg-muted)]">
              {assignment.subtitle}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Visual */}
        {assignment.visual_url && (
          <div className="mb-8 overflow-hidden rounded-[var(--radius-lg)]">
            <img
              src={assignment.visual_url}
              alt={title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        {/* Media */}
        {assignment.media_url && (
          <div className="mb-8">
            <div className="aspect-video overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-muted)]">
              {isYouTubeUrl(assignment.media_url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(assignment.media_url)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isVimeoUrl(assignment.media_url) ? (
                <iframe
                  src={getVimeoEmbedUrl(assignment.media_url)}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={assignment.media_url}
                  controls
                  className="h-full w-full"
                />
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {assignment.description && (
          <div
            className="prose prose-gray max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: assignment.description }}
          />
        )}

        {/* Empty state */}
        {!assignment.description && !assignment.media_url && !assignment.visual_url && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-muted)]">
              <FileIcon className="h-8 w-8 text-[var(--color-fg-muted)]" />
            </div>
            <h2 className="text-lg font-medium text-[var(--color-fg)]">No content yet</h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              This assignment doesn't have any content.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {navContext && (
        <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Previous */}
              <div className="flex-1">
                {navContext.prevAssignment ? (
                  <Link
                    href={`/a/${navContext.prevAssignment.slug}?from=${challengeSlug}`}
                    className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-subtle)]"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    <span className="hidden sm:inline truncate max-w-32">{navContext.prevAssignment.title}</span>
                    <span className="sm:hidden">Previous</span>
                  </Link>
                ) : (
                  <div />
                )}
              </div>

              {/* Complete / Return to Overview */}
              <Link
                href={`/c/${challengeSlug}`}
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: navContext.challenge.brandColor || 'var(--color-accent)' }}
              >
                <CheckIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Complete</span>
              </Link>

              {/* Next */}
              <div className="flex-1 flex justify-end">
                {navContext.nextAssignment ? (
                  <Link
                    href={`/a/${navContext.nextAssignment.slug}?from=${challengeSlug}`}
                    className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-subtle)]"
                  >
                    <span className="hidden sm:inline truncate max-w-32">{navContext.nextAssignment.title}</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer - only show if no nav context */}
      {!navContext && (
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-[var(--color-fg-muted)]">
              Powered by Company Challenges
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}

// Helper functions
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isVimeoUrl(url: string): boolean {
  return url.includes('vimeo.com')
}

function getYouTubeEmbedUrl(url: string): string {
  let videoId = ''

  if (url.includes('youtube.com/watch')) {
    const urlParams = new URL(url).searchParams
    videoId = urlParams.get('v') || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || ''
  }

  return `https://www.youtube.com/embed/${videoId}`
}

function getVimeoEmbedUrl(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/)
  const videoId = match?.[1] || ''
  return `https://player.vimeo.com/video/${videoId}`
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}
