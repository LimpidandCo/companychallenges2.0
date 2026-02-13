import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getChallengeDetail } from '@/lib/actions/admin-analytics'
import { ChallengeAnalytics } from './challenge-analytics'

interface Props {
  params: Promise<{ challengeId: string }>
}

export default async function ChallengeAnalyticsPage({ params }: Props) {
  const { challengeId } = await params
  const challenge = await getChallengeDetail(challengeId)

  if (!challenge) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <a
          href="/admin/analytics"
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
        >
          Analytics
        </a>
        <span className="text-[var(--color-fg-subtle)]">/</span>
        <span className="text-[var(--color-fg-muted)]">{challenge.clientName}</span>
        <span className="text-[var(--color-fg-subtle)]">/</span>
        <span className="font-medium text-[var(--color-fg)]">
          {challenge.publicTitle || challenge.internalName}
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-fg)]">
          {challenge.publicTitle || challenge.internalName}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Detailed analytics for this challenge — views, engagement, sprint &amp; assignment breakdown.
        </p>
      </div>

      <Suspense fallback={<ChallengeAnalyticsLoadingSkeleton />}>
        <ChallengeAnalytics challengeId={challengeId} challengeName={challenge.publicTitle || challenge.internalName} />
      </Suspense>
    </div>
  )
}

function ChallengeAnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]" />
        ))}
      </div>
      <div className="h-80 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]" />
      <div className="h-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]" />
      <div className="h-96 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]" />
    </div>
  )
}
