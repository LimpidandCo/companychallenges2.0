'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { PasswordGate } from '@/components/public/password-gate'
import { trackChallengeView } from '@/lib/actions/analytics'
import type { Challenge, Assignment, AssignmentUsage } from '@/lib/types/database'

interface ChallengePageClientProps {
  challenge: Challenge
  client: { name: string; logo_url?: string }
  usages: (AssignmentUsage & { assignment: Assignment })[]
  pendingCount: number
  nextRelease?: string
}

export function ChallengePageClient({
  challenge,
  client,
  usages,
  pendingCount,
  nextRelease
}: ChallengePageClientProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string
    title: string
  } | null>(null)
  const hasTrackedView = useRef(false)

  // Track challenge page view on mount (once)
  useEffect(() => {
    if (hasTrackedView.current) return
    hasTrackedView.current = true
    trackChallengeView(challenge.client_id, challenge.id)
  }, [challenge.client_id, challenge.id])

  const title = challenge.show_public_title && challenge.public_title
    ? challenge.public_title
    : client.name

  // Handle password verification
  const handlePasswordSuccess = () => {
    setSelectedAssignment(null)
  }

  // Brand color styling
  const brandColor = challenge.brand_color || '#ff6b4a'
  const brandStyle = {
    '--brand-color': brandColor,
    '--brand-color-light': `${brandColor}15`,
  } as React.CSSProperties

  // Calculate progress
  const totalAssignments = usages.length + pendingCount
  const progress = totalAssignments > 0 ? (usages.length / totalAssignments) * 100 : 0

  return (
    <>
      {/* Password Gate Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-fade-in flex items-center justify-center p-4" onClick={() => setSelectedAssignment(null)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-pop-in w-full max-w-md">
            <PasswordGate
              assignmentId={selectedAssignment.id}
              assignmentTitle={selectedAssignment.title}
              onSuccess={handlePasswordSuccess}
            />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[var(--color-bg)]" style={brandStyle}>
        {/* Decorative background elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: brandColor }}
          />
          <div 
            className="absolute top-1/3 -left-32 w-64 h-64 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: brandColor }}
          />
        </div>

        {/* Header */}
        <header
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
          }}
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill="white" />
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
            {/* Client Logo */}
            {client.logo_url && (
              <div className="mb-6 animate-fade-in-down">
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="h-14 w-auto drop-shadow-lg"
                />
              </div>
            )}

            <h1 className="text-4xl font-bold text-white sm:text-5xl tracking-tight animate-fade-in-up text-balance">
              {title}
            </h1>

            {/* Progress indicator */}
            {totalAssignments > 0 && (
              <div className="mt-6 animate-fade-in-up delay-100">
                <div className="flex items-center gap-3 text-white/90 text-sm font-medium mb-2">
                  <span>{usages.length} of {totalAssignments} available</span>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                      {pendingCount} coming soon
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Visual */}
            {challenge.visual_url && (
              <div className="mt-8 overflow-hidden rounded-2xl shadow-2xl animate-fade-in-up delay-150 ring-1 ring-white/10">
                <img
                  src={challenge.visual_url}
                  alt={title}
                  className="h-auto w-full max-h-72 object-cover"
                />
              </div>
            )}
          </div>
        </header>

        {/* Description */}
        {challenge.description && (
          <section className="relative border-b border-[var(--color-border)]">
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 animate-fade-in-up delay-200">
              <div
                className="prose prose-gray max-w-none dark:prose-invert prose-lg prose-p:text-[var(--color-fg-muted)] prose-headings:text-[var(--color-fg)]"
                dangerouslySetInnerHTML={{ __html: challenge.description }}
              />
            </div>
          </section>
        )}

        {/* Assignment List */}
        <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-fg)] animate-fade-in-up delay-200">
                Your Learning Path
              </h2>
              <p className="text-[var(--color-fg-muted)] mt-1 animate-fade-in-up delay-250">
                Complete each assignment to progress
              </p>
            </div>
          </div>

          {usages.length === 0 && pendingCount === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4 animate-stagger">
              {usages.map((usage, index) => {
                const assignment = usage.assignment
                const hasPassword = !!assignment.password_hash
                const displayTitle = assignment.public_title || assignment.internal_title

                return (
                  <AssignmentCard
                    key={usage.id}
                    index={index + 1}
                    assignment={assignment}
                    label={usage.label}
                    hasPassword={hasPassword}
                    challengeSlug={challenge.slug}
                    brandColor={brandColor}
                    onPasswordRequired={() => setSelectedAssignment({
                      id: assignment.id,
                      title: displayTitle
                    })}
                  />
                )
              })}

              {/* Pending assignments indicator */}
              {pendingCount > 0 && (
                <PendingAssignments 
                  count={pendingCount} 
                  nextRelease={nextRelease}
                  brandColor={brandColor}
                />
              )}
            </div>
          )}
        </main>

        {/* Support Info */}
        {challenge.support_info && (
          <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                >
                  <HelpIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-fg)]">Need Help?</h3>
              </div>
              <div
                className="prose prose-gray max-w-none dark:prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: challenge.support_info }}
              />
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-[var(--color-border)]">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-[var(--color-fg-subtle)]">
              Powered by <span className="font-semibold text-[var(--color-fg-muted)]">Company Challenges</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-pop-in">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--color-bg-muted)] animate-float">
        <span className="text-5xl">📚</span>
      </div>
      <h3 className="text-xl font-bold text-[var(--color-fg)] mb-2">No assignments yet</h3>
      <p className="text-[var(--color-fg-muted)] max-w-sm">
        Content is being prepared for you. Check back soon for new learning materials!
      </p>
    </div>
  )
}

interface AssignmentCardProps {
  index: number
  assignment: Assignment
  label?: string | null
  hasPassword: boolean
  challengeSlug: string
  brandColor: string
  onPasswordRequired: () => void
}

function AssignmentCard({
  index,
  assignment,
  label,
  hasPassword,
  challengeSlug,
  brandColor,
}: AssignmentCardProps) {
  const title = assignment.public_title || assignment.internal_title
  const href = `/a/${assignment.slug}?from=${challengeSlug}`

  return (
    <Link
      href={href}
      className="group relative flex items-start gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-transparent hover:shadow-[var(--shadow-lg)] hover:-translate-y-1"
      style={{
        '--hover-border-color': brandColor,
      } as React.CSSProperties}
    >
      {/* Gradient border on hover */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${brandColor}30, ${brandColor}10)`,
        }}
      />

      {/* Index Number */}
      <div 
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{
          backgroundColor: `${brandColor}15`,
          color: brandColor,
        }}
      >
        <span className="transition-transform duration-300 group-hover:scale-110">
          {index}
        </span>
      </div>

      {/* Content */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-[var(--color-fg)] text-lg transition-colors group-hover:text-[var(--color-accent)]">
            {title}
          </h3>
          {hasPassword && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--color-warning-fg)]">
              <LockIcon className="h-3 w-3" />
              Protected
            </span>
          )}
        </div>

        {assignment.subtitle && (
          <p className="mt-2 text-[var(--color-fg-muted)] line-clamp-2">
            {assignment.subtitle}
          </p>
        )}

        {label && (
          <span 
            className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${brandColor}15`,
              color: brandColor,
            }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Visual Preview */}
      {assignment.visual_url && (
        <div className="relative hidden shrink-0 sm:block overflow-hidden rounded-xl">
          <img
            src={assignment.visual_url}
            alt=""
            className="h-20 w-28 object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      )}

      {/* Arrow */}
      <div 
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1"
        style={{
          backgroundColor: `${brandColor}10`,
          color: brandColor,
        }}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </div>
    </Link>
  )
}

function PendingAssignments({ 
  count, 
  nextRelease, 
  brandColor 
}: { 
  count: number
  nextRelease?: string
  brandColor: string
}) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50 p-8 text-center animate-fade-in">
      <div className="mb-4 flex items-center justify-center">
        <div 
          className="flex h-16 w-16 items-center justify-center rounded-2xl animate-float"
          style={{ backgroundColor: `${brandColor}15` }}
        >
          <span className="text-3xl">⏳</span>
        </div>
      </div>
      <h4 className="font-bold text-lg text-[var(--color-fg)] mb-1">
        {count} more assignment{count !== 1 ? 's' : ''} coming soon
      </h4>
      {nextRelease && (
        <p className="text-sm text-[var(--color-fg-muted)]">
          Next release: <span className="font-medium" style={{ color: brandColor }}>{formatDate(nextRelease)}</span>
        </p>
      )}
    </div>
  )
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// Icons
function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  )
}
