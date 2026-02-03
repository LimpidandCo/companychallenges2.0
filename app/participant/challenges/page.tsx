import Link from 'next/link'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { getEnrolledChallenges, getAvailableChallenges } from '@/lib/actions/participants'

export default async function ChallengesPage() {
  const [enrolledResult, availableResult] = await Promise.all([
    getEnrolledChallenges(),
    getAvailableChallenges(),
  ])

  const enrolled = enrolledResult.success ? enrolledResult.data : []
  const available = availableResult.success ? availableResult.data : []

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🚀</span>
          <h1 className="text-3xl font-bold text-[var(--color-fg)] tracking-tight">
            Challenges
          </h1>
        </div>
        <p className="text-[var(--color-fg-muted)] text-lg">
          Track your progress and discover new challenges.
        </p>
      </div>

      {/* Stats Summary */}
      {enrolled.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <MiniStat
            label="Active"
            value={enrolled.filter(c => !c.completed_at).length}
            color="teal"
          />
          <MiniStat
            label="Completed"
            value={enrolled.filter(c => c.completed_at).length}
            color="coral"
          />
          <MiniStat
            label="Total Progress"
            value={`${Math.round(
              enrolled.reduce((acc, c) => acc + c.progressPercentage, 0) / Math.max(enrolled.length, 1)
            )}%`}
            color="purple"
          />
        </div>
      )}

      {/* My Challenges Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-fg)] flex items-center gap-2">
            <span className="text-lg">📚</span>
            My Challenges
          </h2>
          <Badge variant="default">{enrolled.length}</Badge>
        </div>

        {enrolled.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {enrolled.map((enrollment) => (
              <EnrolledChallengeCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-muted)] mx-auto mb-4">
              <span className="text-3xl">📭</span>
            </div>
            <h3 className="font-semibold text-[var(--color-fg)] mb-2">No challenges yet</h3>
            <p className="text-sm text-[var(--color-fg-muted)] mb-4">
              Enroll in a challenge below to start your learning journey.
            </p>
          </Card>
        )}
      </section>

      {/* Available Challenges Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-fg)] flex items-center gap-2">
            <span className="text-lg">🎯</span>
            Available Challenges
          </h2>
          <Badge variant="outline">{available.length}</Badge>
        </div>

        {available.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {available.map((challenge) => (
              <AvailableChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-muted)] mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="font-semibold text-[var(--color-fg)] mb-2">All caught up!</h3>
            <p className="text-sm text-[var(--color-fg-muted)]">
              You're enrolled in all available challenges. Check back later for new ones.
            </p>
          </Card>
        )}
      </section>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: 'bg-[var(--color-secondary-subtle)] text-[var(--color-secondary)]',
    coral: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
    purple: 'bg-[var(--color-tertiary-subtle)] text-[var(--color-tertiary)]',
  }

  return (
    <div className={`rounded-xl p-4 ${colorClasses[color] || colorClasses.teal}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  )
}

function EnrolledChallengeCard({ enrollment }: { enrollment: any }) {
  const { challenge, progressPercentage, completedCount, totalCount, completed_at } = enrollment

  return (
    <Link href={`/participant/challenges/${challenge.id}`}>
      <Card className="group h-full overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1">
        {/* Progress Bar at top */}
        <div className="h-1.5 bg-[var(--color-bg-muted)]">
          <div
            className="h-full bg-[var(--color-secondary)] transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-[var(--color-fg)] truncate group-hover:text-[var(--color-secondary)] transition-colors">
                  {challenge.public_title || challenge.internal_name}
                </h3>
              </div>
              {challenge.client && (
                <p className="text-sm text-[var(--color-fg-muted)] truncate">
                  {challenge.client.name}
                </p>
              )}
            </div>
            {completed_at ? (
              <Badge variant="success">Completed</Badge>
            ) : (
              <Badge variant="default">{progressPercentage}%</Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-[var(--color-fg-subtle)]">
              <span className="flex items-center gap-1">
                <CheckIcon className="h-4 w-4" />
                {completedCount}/{totalCount}
              </span>
            </div>

            <div className="flex items-center text-[var(--color-fg-subtle)] group-hover:text-[var(--color-secondary)] transition-colors">
              <span className="text-sm font-medium mr-1">
                {completed_at ? 'Review' : 'Continue'}
              </span>
              <ArrowIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function AvailableChallengeCard({ challenge }: { challenge: any }) {
  return (
    <Link href={`/participant/enroll/${challenge.id}`}>
      <Card className="group h-full overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1 border-dashed hover:border-solid hover:border-[var(--color-secondary)]">
        {/* Brand color accent */}
        {challenge.brand_color && (
          <div
            className="h-1"
            style={{ backgroundColor: challenge.brand_color }}
          />
        )}

        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              {challenge.client && (
                <p className="text-xs text-[var(--color-fg-subtle)] mb-1">
                  {challenge.client.name}
                </p>
              )}
              <h3 className="font-semibold text-[var(--color-fg)] truncate group-hover:text-[var(--color-secondary)] transition-colors">
                {challenge.public_title || challenge.internal_name}
              </h3>
            </div>
            <Badge variant="outline" className="shrink-0">New</Badge>
          </div>

          {challenge.description && (
            <p className="text-sm text-[var(--color-fg-muted)] line-clamp-2 mb-4">
              {stripHtml(challenge.description)}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-fg-subtle)]">
              <FileIcon className="h-4 w-4" />
              <span>{challenge.assignmentCount} assignments</span>
            </div>

            <Button variant="secondary" size="sm" className="group-hover:bg-[var(--color-secondary)] group-hover:text-white transition-colors">
              Enroll
              <ArrowIcon className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').slice(0, 120)
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}
