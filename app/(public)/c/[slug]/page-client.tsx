'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PasswordGate } from '@/components/public/password-gate'
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

  const title = challenge.show_public_title && challenge.public_title
    ? challenge.public_title
    : client.name

  // Handle password verification
  const handlePasswordSuccess = () => {
    setSelectedAssignment(null)
    // The cookie is set, user can now access the assignment
  }

  // Brand color styling
  const brandStyle = challenge.brand_color
    ? { '--brand-color': challenge.brand_color } as React.CSSProperties
    : {}

  return (
    <>
      {/* Password Gate Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setSelectedAssignment(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <PasswordGate
              assignmentId={selectedAssignment.id}
              assignmentTitle={selectedAssignment.title}
              onSuccess={handlePasswordSuccess}
            />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[var(--color-bg)]" style={brandStyle}>
        {/* Header */}
        <header
          className="border-b border-[var(--color-border)]"
          style={{
            backgroundColor: challenge.brand_color || 'var(--color-bg-subtle)'
          }}
        >
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Client Logo */}
            {client.logo_url && (
              <img
                src={client.logo_url}
                alt={client.name}
                className="mb-4 h-12 w-auto"
              />
            )}

            <h1
              className="text-3xl font-bold sm:text-4xl"
              style={{
                color: challenge.brand_color ? '#ffffff' : 'var(--color-fg)'
              }}
            >
              {title}
            </h1>

            {/* Visual */}
            {challenge.visual_url && (
              <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)]">
                <img
                  src={challenge.visual_url}
                  alt={title}
                  className="h-auto w-full max-h-64 object-cover"
                />
              </div>
            )}
          </div>
        </header>

        {/* Description */}
        {challenge.description && (
          <section className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
              <div
                className="prose prose-gray max-w-none dark:prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: challenge.description }}
              />
            </div>
          </section>
        )}

        {/* Assignment List */}
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-semibold text-[var(--color-fg)]">
            Assignments
          </h2>

          {usages.length === 0 && pendingCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-muted)]">
                <ListIcon className="h-8 w-8 text-[var(--color-fg-muted)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--color-fg)]">No assignments yet</h3>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                Check back soon for new content.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
                    onPasswordRequired={() => setSelectedAssignment({
                      id: assignment.id,
                      title: displayTitle
                    })}
                  />
                )
              })}

              {/* Pending assignments indicator */}
              {pendingCount > 0 && (
                <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-6 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2 text-[var(--color-fg-muted)]">
                    <ClockIcon className="h-5 w-5" />
                    <span className="font-medium">
                      {pendingCount} more assignment{pendingCount !== 1 ? 's' : ''} coming soon
                    </span>
                  </div>
                  {nextRelease && (
                    <p className="text-sm text-[var(--color-fg-subtle)]">
                      Next release: {formatDate(nextRelease)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Support Info */}
        {challenge.support_info && (
          <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
              <h3 className="mb-3 text-sm font-medium text-[var(--color-fg)]">Need Help?</h3>
              <div
                className="prose prose-gray max-w-none dark:prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: challenge.support_info }}
              />
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-[var(--color-fg-muted)]">
              Powered by Company Challenges
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}

interface AssignmentCardProps {
  index: number
  assignment: Assignment
  label?: string | null
  hasPassword: boolean
  challengeSlug: string
  onPasswordRequired: () => void
}

function AssignmentCard({
  index,
  assignment,
  label,
  hasPassword,
  challengeSlug,
}: AssignmentCardProps) {
  const title = assignment.public_title || assignment.internal_title
  const href = `/a/${assignment.slug}?from=${challengeSlug}`

  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 transition-all hover:border-[var(--color-accent)] hover:shadow-sm"
    >
      {/* Index Number */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-sm font-medium text-[var(--color-fg-muted)] group-hover:bg-[var(--color-accent-subtle)] group-hover:text-[var(--color-accent)]">
        {index}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent)]">
            {title}
          </h3>
          {hasPassword && (
            <LockIcon className="h-4 w-4 shrink-0 text-[var(--color-fg-muted)]" />
          )}
        </div>

        {assignment.subtitle && (
          <p className="mt-1 text-sm text-[var(--color-fg-muted)] line-clamp-2">
            {assignment.subtitle}
          </p>
        )}

        {label && (
          <span className="mt-2 inline-block rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs text-[var(--color-fg-muted)]">
            {label}
          </span>
        )}
      </div>

      {/* Visual Preview */}
      {assignment.visual_url && (
        <div className="hidden shrink-0 sm:block">
          <img
            src={assignment.visual_url}
            alt=""
            className="h-16 w-24 rounded-[var(--radius-md)] object-cover"
          />
        </div>
      )}

      {/* Arrow */}
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)]" />
    </Link>
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
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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
