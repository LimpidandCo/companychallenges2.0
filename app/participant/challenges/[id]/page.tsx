import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { getChallengeAssignmentsWithProgress, getEnrolledChallenges } from '@/lib/actions/participants'
import { getChallenge } from '@/lib/actions/challenges'
import { getSprintsForChallenge } from '@/lib/actions/sprints'
import { getAnnouncementsForChallenge } from '@/lib/actions/announcements'
import { ChallengeDescriptionRenderer } from '@/components/public/content-renderer'
import { ChallengeProgressClient } from './page-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChallengePage({ params }: Props) {
  const { id } = await params

  // Fetch challenge details
  const challengeResult = await getChallenge(id)
  if (!challengeResult.success || !challengeResult.data) {
    notFound()
  }

  const challenge = challengeResult.data

  // Fetch all required data in parallel
  const [assignmentsResult, sprintsResult, announcementsResult, enrollmentsResult] = await Promise.all([
    getChallengeAssignmentsWithProgress(id),
    getSprintsForChallenge(id),
    getAnnouncementsForChallenge(id),
    getEnrolledChallenges(),
  ])

  const assignments = assignmentsResult.success ? assignmentsResult.data : []
  const sprints = sprintsResult.success ? sprintsResult.data : []
  const announcements = announcementsResult.success ? announcementsResult.data : []

  // Find enrollment for this challenge
  const enrollment = enrollmentsResult.success
    ? enrollmentsResult.data.find(e => e.challenge.id === id)
    : null

  // Calculate stats
  const completedCount = assignments.filter(a => a.progress?.status === 'completed').length
  const totalCount = assignments.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Group assignments by sprint
  const sprintAssignments = new Map<string | null, typeof assignments>()
  assignments.forEach(assignment => {
    const sprintId = assignment.sprint_id
    const existing = sprintAssignments.get(sprintId) || []
    sprintAssignments.set(sprintId, [...existing, assignment])
  })

  // Sort sprints by position
  const sortedSprints = [...sprints].sort((a, b) => a.position - b.position)

  // Pinned announcements
  const pinnedAnnouncements = announcements.filter(a => a.is_pinned)

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Back link */}
      <Link
        href="/participant/challenges"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors mb-6"
      >
        <BackIcon className="h-4 w-4" />
        Back to Challenges
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-fg)] tracking-tight mb-2">
              {challenge.public_title || challenge.internal_name}
            </h1>
            {(challenge.description_html || challenge.description) && (
              <div className="max-w-2xl">
                <ChallengeDescriptionRenderer challenge={challenge} />
              </div>
            )}
          </div>

          {/* Progress Card */}
          <Card className="lg:w-72 shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--color-fg-muted)]">Progress</span>
                <span className="text-2xl font-bold text-[var(--color-fg)]">{progressPercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-[var(--color-secondary)] transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-fg-subtle)] mb-3">
                {completedCount} of {totalCount} assignments completed
              </p>
              <Link
                href={`/participant/challenges/${id}/leaderboard`}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-fg)] transition-colors"
              >
                <TrophyIcon className="h-4 w-4 text-[var(--color-warning)]" />
                View Leaderboard
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="mb-8 space-y-3">
          {pinnedAnnouncements.map(announcement => (
            <div
              key={announcement.id}
              className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-subtle)]"
            >
              <span className="text-xl">📢</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--color-fg)] mb-1">{announcement.title}</h3>
                <div
                  className="text-sm text-[var(--color-fg-muted)] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignments */}
      <ChallengeProgressClient
        challengeId={id}
        assignments={assignments}
        sprints={sortedSprints}
        sprintAssignments={Object.fromEntries(sprintAssignments)}
      />
    </div>
  )
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.927 0" />
    </svg>
  )
}
