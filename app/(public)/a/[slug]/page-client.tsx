'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordGate } from '@/components/public/password-gate'
import { trackAssignmentView, trackAssignmentComplete, trackMediaPlay } from '@/lib/actions/analytics'
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
  const hasTrackedView = useRef(false)
  const hasTrackedMediaPlay = useRef(false)

  const title = assignment.public_title || assignment.internal_title
  const challengeSlug = navContext?.challenge.slug
  const brandColor = navContext?.challenge.brandColor || '#ff6b4a'

  // Track assignment view on mount
  useEffect(() => {
    if (hasTrackedView.current) return
    if (!navContext || !isReleased || (requiresPassword && !hasAccess)) return

    hasTrackedView.current = true
    trackAssignmentView(
      navContext.challenge.clientId,
      navContext.challenge.id,
      assignment.id,
      navContext.sprintId
    )
  }, [navContext, isReleased, requiresPassword, hasAccess, assignment.id])

  const handleComplete = () => {
    if (!navContext) return
    trackAssignmentComplete(
      navContext.challenge.clientId,
      navContext.challenge.id,
      assignment.id,
      navContext.sprintId
    )
  }

  const handleMediaPlay = () => {
    if (hasTrackedMediaPlay.current || !navContext) return
    hasTrackedMediaPlay.current = true
    trackMediaPlay(
      navContext.challenge.clientId,
      navContext.challenge.id,
      assignment.id,
      { mediaType: assignment.media_url?.includes('youtube') ? 'youtube' : assignment.media_url?.includes('vimeo') ? 'vimeo' : 'video' }
    )
  }

  // Show password gate if required
  if (requiresPassword && !hasAccess) {
    return (
      <PasswordGate
        assignmentId={assignment.id}
        assignmentTitle={title}
        onSuccess={() => {
          setHasAccess(true)
          router.refresh()
        }}
        analyticsContext={navContext ? {
          clientId: navContext.challenge.clientId,
          challengeId: navContext.challenge.id
        } : undefined}
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
            style={{ backgroundColor: brandColor }}
          >
            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
              <Link
                href={`/c/${challengeSlug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Back to {navContext.challenge.publicTitle || navContext.challenge.internalName}
              </Link>
            </div>
          </nav>
        )}

        {/* Scheduled Release Message */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center animate-pop-in">
            <div 
              className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl animate-float"
              style={{ backgroundColor: `${brandColor}15` }}
            >
              <span className="text-5xl">📅</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-fg)] mb-3">{title}</h1>
            <p className="text-lg text-[var(--color-fg-muted)] mb-6">
              This assignment will be available on
            </p>
            <p 
              className="text-2xl font-bold mb-8"
              style={{ color: brandColor }}
            >
              {formatDate(releaseAt)}
            </p>
            {navContext && (
              <Link
                href={`/c/${challengeSlug}`}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ 
                  backgroundColor: brandColor,
                  boxShadow: `0 4px 16px -4px ${brandColor}60`
                }}
              >
                <ChevronLeftIcon className="h-5 w-5" />
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
          className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md"
          style={{ backgroundColor: `${brandColor}f0` }}
        >
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link
                href={`/c/${challengeSlug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors group"
              >
                <ChevronLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="hidden sm:inline">
                  {navContext.challenge.publicTitle || navContext.challenge.internalName}
                </span>
                <span className="sm:hidden">Back</span>
              </Link>

              {/* Progress Indicator */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: navContext.totalCount }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i + 1 <= navContext.currentPosition
                          ? 'bg-white'
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-white">
                  {navContext.currentPosition}/{navContext.totalCount}
                </span>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
          <h1 className="text-3xl font-bold text-[var(--color-fg)] sm:text-4xl tracking-tight animate-fade-in-up">
            {title}
          </h1>
          {assignment.subtitle && (
            <p className="mt-3 text-xl text-[var(--color-fg-muted)] animate-fade-in-up delay-100">
              {assignment.subtitle}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Visual */}
        {assignment.visual_url && (
          <div className="mb-10 overflow-hidden rounded-2xl shadow-lg animate-fade-in-up delay-150">
            <img
              src={assignment.visual_url}
              alt={title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        {/* Media */}
        {assignment.media_url && (
          <div className="mb-10 animate-fade-in-up delay-200">
            <div className="aspect-video overflow-hidden rounded-2xl bg-[var(--color-bg-muted)] shadow-lg ring-1 ring-[var(--color-border)]">
              {isYouTubeUrl(assignment.media_url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(assignment.media_url)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={handleMediaPlay}
                />
              ) : isVimeoUrl(assignment.media_url) ? (
                <iframe
                  src={getVimeoEmbedUrl(assignment.media_url)}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  onLoad={handleMediaPlay}
                />
              ) : (
                <video
                  src={assignment.media_url}
                  controls
                  className="h-full w-full"
                  onPlay={handleMediaPlay}
                />
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {assignment.description && (
          <div
            className="prose prose-gray max-w-none dark:prose-invert prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-a:text-[var(--color-accent)] animate-fade-in-up delay-300"
            dangerouslySetInnerHTML={{ __html: assignment.description }}
          />
        )}

        {/* Empty state */}
        {!assignment.description && !assignment.media_url && !assignment.visual_url && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-pop-in">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-muted)] animate-float">
              <span className="text-4xl">📄</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-fg)]">No content yet</h2>
            <p className="mt-2 text-[var(--color-fg-muted)]">
              This assignment doesn't have any content.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {navContext && (
        <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-md">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Previous */}
              <div className="flex-1">
                {navContext.prevAssignment ? (
                  <Link
                    href={`/a/${navContext.prevAssignment.slug}?from=${challengeSlug}`}
                    className="group inline-flex items-center gap-2 rounded-xl border-[1.5px] border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-fg)] transition-all duration-200 hover:border-[var(--color-border-hover)] hover:shadow-sm"
                  >
                    <ChevronLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    <span className="hidden sm:inline truncate max-w-32">{navContext.prevAssignment.title}</span>
                    <span className="sm:hidden">Prev</span>
                  </Link>
                ) : (
                  <div />
                )}
              </div>

              {/* Complete / Return to Overview */}
              <Link
                href={`/c/${challengeSlug}`}
                onClick={handleComplete}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: brandColor,
                  boxShadow: `0 4px 12px -4px ${brandColor}50`
                }}
              >
                <CheckIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Complete</span>
              </Link>

              {/* Next */}
              <div className="flex-1 flex justify-end">
                {navContext.nextAssignment ? (
                  <Link
                    href={`/a/${navContext.nextAssignment.slug}?from=${challengeSlug}`}
                    className="group inline-flex items-center gap-2 rounded-xl border-[1.5px] border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-fg)] transition-all duration-200 hover:border-[var(--color-border-hover)] hover:shadow-sm"
                  >
                    <span className="hidden sm:inline truncate max-w-32">{navContext.nextAssignment.title}</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-[var(--color-fg-subtle)]">
              Powered by <span className="font-semibold text-[var(--color-fg-muted)]">Company Challenges</span>
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
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
