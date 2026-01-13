import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, Badge } from '@/components/ui'
import { getChallengePreview } from '@/lib/actions/participants'
import { EnrollButton } from './enroll-button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EnrollPage({ params }: Props) {
  const { id } = await params

  const result = await getChallengePreview(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const { challenge, isEnrolled, assignmentCount, sprintCount, estimatedDuration } = result.data

  // If already enrolled, redirect to the challenge page
  if (isEnrolled) {
    redirect(`/participant/challenges/${id}`)
  }

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

      <div className="max-w-3xl mx-auto">
        {/* Challenge Header Card */}
        <Card className="overflow-hidden mb-6">
          {/* Brand color banner */}
          {challenge.brand_color && (
            <div
              className="h-3"
              style={{ backgroundColor: challenge.brand_color }}
            />
          )}

          {/* Visual banner */}
          {challenge.visual_url && (
            <div className="h-48 overflow-hidden">
              <img
                src={challenge.visual_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <CardContent className="p-6">
            {/* Client badge */}
            {challenge.client && (
              <div className="flex items-center gap-2 mb-4">
                {challenge.client.logo_url && (
                  <img
                    src={challenge.client.logo_url}
                    alt=""
                    className="h-6 w-6 rounded object-contain"
                  />
                )}
                <span className="text-sm text-[var(--color-fg-muted)]">
                  {challenge.client.name}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-[var(--color-fg)] mb-3">
              {challenge.public_title || challenge.internal_name}
            </h1>

            {/* Description */}
            {challenge.description && (
              <div
                className="prose prose-sm max-w-none text-[var(--color-fg-muted)] mb-6"
                dangerouslySetInnerHTML={{ __html: challenge.description }}
              />
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mb-6">
              <StatBadge
                icon={<FileIcon className="h-4 w-4" />}
                value={assignmentCount}
                label={assignmentCount === 1 ? 'Assignment' : 'Assignments'}
              />
              {sprintCount > 0 && (
                <StatBadge
                  icon={<SprintIcon className="h-4 w-4" />}
                  value={sprintCount}
                  label={sprintCount === 1 ? 'Sprint' : 'Sprints'}
                />
              )}
              <StatBadge
                icon={<ClockIcon className="h-4 w-4" />}
                value={estimatedDuration}
                label="Estimated"
              />
            </div>

            {/* Dates */}
            {(challenge.starts_at || challenge.ends_at) && (
              <div className="flex flex-wrap gap-3 mb-6 text-sm text-[var(--color-fg-muted)]">
                {challenge.starts_at && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Starts: {new Date(challenge.starts_at).toLocaleDateString()}
                  </span>
                )}
                {challenge.ends_at && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Ends: {new Date(challenge.ends_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {/* Enroll CTA */}
            <div className="pt-4 border-t border-[var(--color-border)]">
              <EnrollButton challengeId={id} />
            </div>
          </CardContent>
        </Card>

        {/* What you'll learn section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[var(--color-fg)] mb-4 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              What to Expect
            </h2>
            <ul className="space-y-3">
              <ExpectationItem
                icon="📚"
                title={`${assignmentCount} ${assignmentCount === 1 ? 'Assignment' : 'Assignments'}`}
                description="Complete assignments at your own pace to progress through the challenge."
              />
              {sprintCount > 0 && (
                <ExpectationItem
                  icon="🏃"
                  title={`${sprintCount} ${sprintCount === 1 ? 'Sprint' : 'Sprints'}`}
                  description="Content organized into focused sprints for structured learning."
                />
              )}
              <ExpectationItem
                icon="🏆"
                title="Track Your Progress"
                description="Monitor your completion status and earn achievements along the way."
              />
              <ExpectationItem
                icon="💭"
                title="Reflection Questions"
                description="Some assignments include brief reflection questions to deepen your understanding."
              />
            </ul>
          </CardContent>
        </Card>

        {/* Support info */}
        {challenge.support_info && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-fg)] mb-4 flex items-center gap-2">
                <span className="text-xl">💬</span>
                Support
              </h2>
              <div
                className="prose prose-sm max-w-none text-[var(--color-fg-muted)]"
                dangerouslySetInnerHTML={{ __html: challenge.support_info }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
      <span className="text-[var(--color-fg-muted)]">{icon}</span>
      <span className="font-semibold text-[var(--color-fg)]">{value}</span>
      <span className="text-sm text-[var(--color-fg-muted)]">{label}</span>
    </div>
  )
}

function ExpectationItem({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="font-medium text-[var(--color-fg)]">{title}</p>
        <p className="text-sm text-[var(--color-fg-muted)]">{description}</p>
      </div>
    </li>
  )
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function SprintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}
