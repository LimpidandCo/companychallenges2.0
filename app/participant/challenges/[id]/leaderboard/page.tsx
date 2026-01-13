import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, Badge } from '@/components/ui'
import { getChallengeLeaderboard } from '@/lib/actions/participants'
import { getChallenge } from '@/lib/actions/challenges'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LeaderboardPage({ params }: Props) {
  const { id } = await params

  // Fetch challenge details
  const challengeResult = await getChallenge(id)
  if (!challengeResult.success || !challengeResult.data) {
    notFound()
  }

  const challenge = challengeResult.data

  // Fetch leaderboard data
  const leaderboardResult = await getChallengeLeaderboard(id)
  const { leaderboard, currentUserRank, totalParticipants } = leaderboardResult.success
    ? leaderboardResult.data
    : { leaderboard: [], currentUserRank: null, totalParticipants: 0 }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Back link */}
      <Link
        href={`/participant/challenges/${id}`}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors mb-6"
      >
        <BackIcon className="h-4 w-4" />
        Back to Challenge
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏆</span>
          <h1 className="text-3xl font-bold text-[var(--color-fg)] tracking-tight">
            Leaderboard
          </h1>
        </div>
        <p className="text-[var(--color-fg-muted)] text-lg">
          {challenge.public_title || challenge.internal_name}
        </p>
      </div>

      {/* Current User Rank Summary */}
      {currentUserRank !== null && (
        <Card className="mb-6 bg-gradient-to-r from-[var(--color-secondary-subtle)] to-[var(--color-tertiary-subtle)] border-[var(--color-secondary)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-fg-muted)] mb-1">Your Rank</p>
                <p className="text-4xl font-bold text-[var(--color-fg)]">
                  #{currentUserRank}
                  <span className="text-lg font-normal text-[var(--color-fg-muted)] ml-2">
                    of {totalParticipants}
                  </span>
                </p>
              </div>
              <div className="text-right">
                {currentUserRank === 1 && (
                  <Badge variant="success" className="text-sm px-3 py-1">
                    <TrophyIcon className="h-4 w-4 mr-1" />
                    Leader
                  </Badge>
                )}
                {currentUserRank === 2 && (
                  <Badge variant="default" className="text-sm px-3 py-1 bg-gray-300 text-gray-700">
                    2nd Place
                  </Badge>
                )}
                {currentUserRank === 3 && (
                  <Badge variant="default" className="text-sm px-3 py-1 bg-amber-200 text-amber-800">
                    3rd Place
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          icon="👥"
          value={totalParticipants}
          label="Participants"
        />
        <StatCard
          icon="🎯"
          value={leaderboard.filter(e => e.progressPercentage === 100).length}
          label="Completed"
        />
        <StatCard
          icon="📊"
          value={`${Math.round(leaderboard.reduce((acc, e) => acc + e.progressPercentage, 0) / Math.max(totalParticipants, 1))}%`}
          label="Avg Progress"
        />
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wider py-3 px-4 w-16">
                      Rank
                    </th>
                    <th className="text-left text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wider py-3 px-4">
                      Participant
                    </th>
                    <th className="text-left text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wider py-3 px-4 w-32">
                      Progress
                    </th>
                    <th className="text-right text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wider py-3 px-4 w-28">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.participantId}
                      className={`transition-colors ${
                        entry.isCurrentUser
                          ? 'bg-[var(--color-secondary-subtle)]'
                          : 'hover:bg-[var(--color-bg-subtle)]'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center">
                          {entry.rank === 1 && (
                            <span className="text-2xl">🥇</span>
                          )}
                          {entry.rank === 2 && (
                            <span className="text-2xl">🥈</span>
                          )}
                          {entry.rank === 3 && (
                            <span className="text-2xl">🥉</span>
                          )}
                          {entry.rank > 3 && (
                            <span className="text-lg font-semibold text-[var(--color-fg-muted)]">
                              {entry.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-tertiary)] flex items-center justify-center text-white font-semibold">
                            {entry.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-fg)]">
                              {entry.displayName}
                              {entry.isCurrentUser && (
                                <span className="ml-2 text-xs text-[var(--color-secondary)]">(You)</span>
                              )}
                            </p>
                            {entry.completedAt && (
                              <p className="text-xs text-[var(--color-fg-subtle)]">
                                Completed {new Date(entry.completedAt).toLocaleDateString()}
                              </p>
                            )}
                            {!entry.completedAt && entry.lastActivityAt && (
                              <p className="text-xs text-[var(--color-fg-subtle)]">
                                Active {formatRelativeTime(entry.lastActivityAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                entry.progressPercentage === 100
                                  ? 'bg-[var(--color-success)]'
                                  : 'bg-[var(--color-secondary)]'
                              }`}
                              style={{ width: `${entry.progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-[var(--color-fg)] w-10 text-right">
                            {entry.progressPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-[var(--color-fg-muted)]">
                          {entry.completedCount}/{entry.totalCount}
                        </span>
                        {entry.progressPercentage === 100 && (
                          <Badge variant="success" className="ml-2">
                            Done
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-muted)] mx-auto mb-4">
            <span className="text-3xl">🏁</span>
          </div>
          <h3 className="font-semibold text-[var(--color-fg)] mb-2">No participants yet</h3>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Be the first to show up on the leaderboard! Complete some assignments to get ranked.
          </p>
        </Card>
      )}

      {/* Privacy Note */}
      <p className="text-xs text-[var(--color-fg-subtle)] text-center mt-6">
        Only participants who have opted to appear on leaderboards are shown.
        <Link href="/participant/settings" className="text-[var(--color-secondary)] hover:underline ml-1">
          Manage your privacy settings
        </Link>
      </p>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-2xl font-bold text-[var(--color-fg)]">{value}</p>
            <p className="text-sm text-[var(--color-fg-muted)]">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
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
