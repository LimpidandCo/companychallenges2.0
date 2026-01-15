'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { PasswordGate } from '@/components/public/password-gate'
import { ChallengeDescriptionRenderer } from '@/components/public/content-renderer'
import { AuthGate } from '@/components/public/auth-gate'
import { trackChallengeView } from '@/lib/actions/analytics'
import type { Challenge, Assignment, AssignmentUsage, Sprint, Announcement } from '@/lib/types/database'

interface ChallengePageClientProps {
  challenge: Challenge
  client: { name: string; logo_url?: string }
  usages: (AssignmentUsage & { assignment: Assignment })[]
  sprints: Sprint[]
  announcements: Announcement[]
  pendingCount: number
  nextRelease?: string
}

export function ChallengePageClient({
  challenge,
  client,
  usages,
  sprints,
  announcements,
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

  // Group usages by sprint
  const sprintMap = new Map<string | null, (AssignmentUsage & { assignment: Assignment })[]>()
  usages.forEach(usage => {
    const key = usage.sprint_id || null
    if (!sprintMap.has(key)) {
      sprintMap.set(key, [])
    }
    sprintMap.get(key)!.push(usage)
  })

  // Get pinned announcements
  const pinnedAnnouncements = announcements.filter(a => a.is_pinned)
  const recentAnnouncements = announcements.filter(a => !a.is_pinned).slice(0, 3)

  return (
    <AuthGate
      challengeId={challenge.id}
      challengeMode={challenge.mode || 'collective'}
      challengeTitle={title}
      brandColor={brandColor}
    >
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

        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <section className="relative border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="space-y-4">
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementCard 
                    key={announcement.id} 
                    announcement={announcement} 
                    brandColor={brandColor}
                    isPinned
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Description with Editor Styling */}
        {(challenge.description_html || challenge.description) && (
          <DescriptionSection challenge={challenge} brandColor={brandColor} />
        )}

        {/* Recent Announcements (non-pinned) */}
        {recentAnnouncements.length > 0 && (
          <section className="relative border-b border-[var(--color-border)]">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 mb-4">
                <div style={{ color: brandColor }}>
                  <MegaphoneIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-fg)]">Announcements</h2>
              </div>
              <div className="space-y-3">
                {recentAnnouncements.map((announcement) => (
                  <AnnouncementCard 
                    key={announcement.id} 
                    announcement={announcement} 
                    brandColor={brandColor}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Learning Path with Sprints */}
        <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-fg)] animate-fade-in-up delay-200">
                Your Learning Path
              </h2>
              <p className="text-[var(--color-fg-muted)] mt-1 animate-fade-in-up delay-250">
                {sprints.length > 0 
                  ? `${sprints.length} sprint${sprints.length !== 1 ? 's' : ''} to complete`
                  : 'Complete each assignment to progress'
                }
              </p>
            </div>
          </div>

          {usages.length === 0 && pendingCount === 0 ? (
            <EmptyState />
          ) : sprints.length > 0 ? (
            // Render assignments grouped by sprint
            <div className="space-y-10">
              {sprints.map((sprint, sprintIndex) => {
                const sprintUsages = sprintMap.get(sprint.id) || []
                if (sprintUsages.length === 0) return null

                return (
                  <SprintSection
                    key={sprint.id}
                    sprint={sprint}
                    sprintIndex={sprintIndex + 1}
                    usages={sprintUsages}
                    brandColor={brandColor}
                    challengeSlug={challenge.slug}
                    onPasswordRequired={(id, title) => setSelectedAssignment({ id, title })}
                  />
                )
              })}

              {/* Assignments without a sprint */}
              {sprintMap.has(null) && sprintMap.get(null)!.length > 0 && (
                <div className="space-y-4">
                  {sprints.length > 0 && (
                    <h3 className="text-lg font-semibold text-[var(--color-fg-muted)]">
                      Additional Content
                    </h3>
                  )}
                  {sprintMap.get(null)!.map((usage, index) => (
                    <AssignmentCard
                      key={usage.id}
                      index={index + 1}
                      assignment={usage.assignment}
                      label={usage.label}
                      hasPassword={!!usage.assignment.password_hash}
                      challengeSlug={challenge.slug}
                      brandColor={brandColor}
                      onPasswordRequired={() => setSelectedAssignment({
                        id: usage.assignment.id,
                        title: usage.assignment.public_title || usage.assignment.internal_title
                      })}
                    />
                  ))}
                </div>
              )}

              {/* Pending assignments indicator */}
              {pendingCount > 0 && (
                <PendingAssignments 
                  count={pendingCount} 
                  nextRelease={nextRelease}
                  brandColor={brandColor}
                />
              )}
            </div>
          ) : (
            // No sprints - render flat list
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
                className="prose prose-gray max-w-none prose-sm"
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
    </AuthGate>
  )
}

// =============================================================================
// Sprint Section Component
// =============================================================================

interface SprintSectionProps {
  sprint: Sprint
  sprintIndex: number
  usages: (AssignmentUsage & { assignment: Assignment })[]
  brandColor: string
  challengeSlug: string
  onPasswordRequired: (id: string, title: string) => void
}

function SprintSection({
  sprint,
  sprintIndex,
  usages,
  brandColor,
  challengeSlug,
  onPasswordRequired
}: SprintSectionProps) {
  const [showVideo, setShowVideo] = useState(false)

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${sprintIndex * 100}ms` }}>
      {/* Sprint Header */}
      <div 
        className="rounded-2xl p-6 mb-4"
        style={{ 
          background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)`,
          borderLeft: `4px solid ${brandColor}`
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: brandColor }}
              >
                Sprint {sprintIndex}
              </span>
              {sprint.starts_at && new Date(sprint.starts_at) > new Date() && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)] text-xs font-medium">
                  Coming Soon
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-[var(--color-fg)]">
              {sprint.name}
            </h3>
            {sprint.description && (
              <p className="mt-2 text-[var(--color-fg-muted)]">
                {sprint.description}
              </p>
            )}

            {/* Sprint Progress */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${100}%`, // TODO: Calculate actual completion
                    backgroundColor: brandColor 
                  }}
                />
              </div>
              <span className="text-sm font-medium text-[var(--color-fg-muted)]">
                {usages.length} assignment{usages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Intro Video Button */}
          {sprint.intro_video_url && (
            <button
              onClick={() => setShowVideo(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{ 
                backgroundColor: `${brandColor}15`,
                color: brandColor
              }}
            >
              <PlayIcon className="h-4 w-4" />
              Watch Intro
            </button>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && sprint.intro_video_url && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowVideo(false)}
        >
          <div 
            className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl animate-pop-in"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src={getEmbedUrl(sprint.intro_video_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Sprint Assignments */}
      <div className="space-y-3 ml-2">
        {usages.map((usage, index) => (
          <AssignmentCard
            key={usage.id}
            index={index + 1}
            assignment={usage.assignment}
            label={usage.label}
            hasPassword={!!usage.assignment.password_hash}
            challengeSlug={challengeSlug}
            brandColor={brandColor}
            compact
            onPasswordRequired={() => onPasswordRequired(
              usage.assignment.id,
              usage.assignment.public_title || usage.assignment.internal_title
            )}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Announcement Component
// =============================================================================

function AnnouncementCard({ 
  announcement, 
  brandColor,
  isPinned 
}: { 
  announcement: Announcement
  brandColor: string
  isPinned?: boolean
}) {
  return (
    <div 
      className={`rounded-xl p-4 ${isPinned ? 'ring-2' : ''}`}
      style={{ 
        backgroundColor: isPinned ? `${brandColor}10` : 'var(--color-bg-elevated)',
        // Use box-shadow for ring color since CSS ringColor doesn't exist
        boxShadow: isPinned ? `0 0 0 2px ${brandColor}50` : undefined
      }}
    >
      <div className="flex items-start gap-3">
        {isPinned && (
          <div 
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
          >
            <PinIcon className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-[var(--color-fg)]">{announcement.title}</h4>
            <span className="text-xs text-[var(--color-fg-subtle)]">
              {formatRelativeDate(announcement.published_at)}
            </span>
          </div>
          {announcement.content_html ? (
            <div 
              className="text-sm text-[var(--color-fg-muted)] prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: announcement.content_html }}
            />
          ) : (
            <p className="text-sm text-[var(--color-fg-muted)]">{announcement.content}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Description Section Component - Clean Island Layout
// =============================================================================

function DescriptionSection({ 
  challenge, 
  brandColor 
}: { 
  challenge: Challenge
  brandColor: string 
}) {
  // Extract page background color from editor JSON
  const json = challenge.description_json
  const pageBgColor = json?.attributes?.pageBackgroundColor as string | undefined

  return (
    <section className="relative py-10 sm:py-14">
      {/* Content container */}
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Content card */}
        <div 
          className="rounded-2xl shadow-lg overflow-hidden animate-fade-in-up"
          style={{ backgroundColor: pageBgColor || '#ffffff' }}
        >
          <div className="p-8 sm:p-10 lg:p-12">
            <ChallengeDescriptionRenderer 
              challenge={challenge}
              className="prose-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// Assignment Card Component
// =============================================================================

interface AssignmentCardProps {
  index: number
  assignment: Assignment
  label?: string | null
  hasPassword: boolean
  challengeSlug: string
  brandColor: string
  compact?: boolean
  onPasswordRequired: () => void
}

function AssignmentCard({
  index,
  assignment,
  label,
  hasPassword,
  challengeSlug,
  brandColor,
  compact,
}: AssignmentCardProps) {
  const title = assignment.public_title || assignment.internal_title
  const href = `/a/${assignment.slug}?from=${challengeSlug}`

  if (compact) {
    return (
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 transition-all duration-200 hover:border-transparent hover:shadow-md hover:-translate-y-0.5"
      >
        <div 
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
        >
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-[var(--color-fg)] truncate group-hover:text-[var(--color-accent)] transition-colors">
              {title}
            </h4>
            {hasPassword && <LockIcon className="h-3.5 w-3.5 text-[var(--color-warning)]" />}
            {label && (
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
              >
                {label}
              </span>
            )}
          </div>
          {assignment.subtitle && (
            <p className="text-sm text-[var(--color-fg-muted)] truncate mt-0.5">{assignment.subtitle}</p>
          )}
        </div>
        <ChevronRightIcon className="h-5 w-5 text-[var(--color-fg-subtle)] group-hover:translate-x-1 transition-transform" />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="group relative flex items-start gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-transparent hover:shadow-[var(--shadow-lg)] hover:-translate-y-1"
    >
      {/* Gradient border on hover */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${brandColor}30, ${brandColor}10)` }}
      />

      {/* Index Number */}
      <div 
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
      >
        {index}
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
          <p className="mt-2 text-[var(--color-fg-muted)] line-clamp-2">{assignment.subtitle}</p>
        )}

        {label && (
          <span 
            className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
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
        style={{ backgroundColor: `${brandColor}10`, color: brandColor }}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </div>
    </Link>
  )
}

// =============================================================================
// Helper Components
// =============================================================================

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
        <div className="mt-3">
          <p className="text-sm text-[var(--color-fg-muted)] mb-2">
            Next release: <span className="font-medium" style={{ color: brandColor }}>{formatDate(nextRelease)}</span>
          </p>
          <CountdownTimer targetDate={nextRelease} brandColor={brandColor} />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Countdown Timer Component
// =============================================================================

function CountdownTimer({ targetDate, brandColor }: { targetDate: string; brandColor: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = getTimeLeft(targetDate)
      setTimeLeft(newTimeLeft)
      
      // Stop timer when countdown reaches zero
      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  // Don't show if already past
  if (timeLeft.total <= 0) {
    return (
      <p className="text-sm font-medium" style={{ color: brandColor }}>
        Available now! Refresh to see.
      </p>
    )
  }

  return (
    <div className="inline-flex items-center gap-2">
      <CountdownUnit value={timeLeft.days} label="d" brandColor={brandColor} />
      <span className="text-[var(--color-fg-subtle)]">:</span>
      <CountdownUnit value={timeLeft.hours} label="h" brandColor={brandColor} />
      <span className="text-[var(--color-fg-subtle)]">:</span>
      <CountdownUnit value={timeLeft.minutes} label="m" brandColor={brandColor} />
      <span className="text-[var(--color-fg-subtle)]">:</span>
      <CountdownUnit value={timeLeft.seconds} label="s" brandColor={brandColor} />
    </div>
  )
}

function CountdownUnit({ value, label, brandColor }: { value: number; label: string; brandColor: string }) {
  return (
    <div 
      className="flex items-center gap-0.5 px-2 py-1 rounded-lg"
      style={{ backgroundColor: `${brandColor}10` }}
    >
      <span className="text-lg font-bold tabular-nums" style={{ color: brandColor }}>
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-xs text-[var(--color-fg-muted)]">{label}</span>
    </div>
  )
}

function getTimeLeft(targetDate: string) {
  const target = new Date(targetDate).getTime()
  const now = new Date().getTime()
  const total = target - now

  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

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

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getEmbedUrl(url: string): string {
  // Convert YouTube URLs to embed format
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`
  }
  // Convert Vimeo URLs to embed format
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
  }
  return url
}

// =============================================================================
// Icons
// =============================================================================

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

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
    </svg>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
