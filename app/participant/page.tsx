import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import {
  getParticipantDashboardStats,
  getEnrolledChallenges,
  getRecentActivity,
} from '@/lib/actions/participants'

export default async function ParticipantDashboard() {
  const [statsResult, challengesResult, activityResult] = await Promise.all([
    getParticipantDashboardStats(),
    getEnrolledChallenges(),
    getRecentActivity(5),
  ])

  const stats = statsResult.success ? statsResult.data : {
    enrolledChallenges: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    achievementsEarned: 0,
    currentStreak: 0,
  }

  const challenges = challengesResult.success ? challengesResult.data : []
  const activities = activityResult.success ? activityResult.data : []

  const progressPercentage = stats.totalAssignments > 0
    ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
    : 0

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header with greeting */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl animate-float">👋</span>
          <h1 className="text-3xl font-bold text-[var(--color-fg)] tracking-tight">
            Welcome back!
          </h1>
        </div>
        <p className="text-[var(--color-fg-muted)] text-lg">
          Track your progress and continue your learning journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-stagger mb-10">
        <StatCard
          title="Active Challenges"
          value={stats.enrolledChallenges}
          description="Currently enrolled"
          icon={<FlagIconSmall />}
          color="teal"
        />
        <StatCard
          title="Completed"
          value={stats.completedAssignments}
          description={`of ${stats.totalAssignments} assignments`}
          icon={<CheckIconSmall />}
          color="coral"
          progress={progressPercentage}
        />
        <StatCard
          title="Achievements"
          value={stats.achievementsEarned}
          description="Milestones unlocked"
          icon={<TrophyIconSmall />}
          color="purple"
        />
        <StatCard
          title="Current Streak"
          value={stats.currentStreak}
          description={stats.currentStreak === 1 ? 'day' : 'days'}
          icon={<FireIconSmall />}
          color="amber"
          trend={stats.currentStreak > 0 ? 'Keep it up!' : undefined}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Active Challenges - Takes 3 columns */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden animate-slide-up delay-200">
            <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚀</span>
                  <CardTitle>My Challenges</CardTitle>
                </div>
                <Link href="/participant/challenges">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              <CardDescription>Continue where you left off</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {challenges.length > 0 ? (
                <div className="divide-y divide-[var(--color-border)]">
                  {challenges.slice(0, 4).map((enrollment) => (
                    <ChallengeCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              ) : (
                <EmptyChallenges />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="h-full animate-slide-up delay-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-xl">🕐</span>
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Your latest progress</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <ActivityItem key={index} activity={activity} index={index} />
                  ))}
                </div>
              ) : (
                <EmptyActivity />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Motivational Footer */}
      <div className="mt-8 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50 animate-slide-up delay-500">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-secondary-subtle)] text-[var(--color-secondary)]">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[var(--color-fg)] mb-1">Keep pushing forward!</p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              {stats.completedAssignments === 0
                ? "Start your first assignment to begin tracking your progress. Every journey begins with a single step!"
                : stats.currentStreak > 0
                  ? `You're on a ${stats.currentStreak}-day streak! Keep the momentum going to unlock more achievements.`
                  : "Complete an assignment today to start building your streak!"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Color configs for stat cards
const statColors = {
  coral: {
    bg: 'bg-gradient-to-br from-[#fff1ed] to-[#ffe4dc]',
    icon: 'bg-[var(--color-accent)] text-white shadow-[0_4px_12px_-2px_rgba(255,107,74,0.4)]',
    text: 'text-[var(--color-accent)]',
  },
  teal: {
    bg: 'bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5]',
    icon: 'bg-[var(--color-secondary)] text-white shadow-[0_4px_12px_-2px_rgba(20,184,166,0.4)]',
    text: 'text-[var(--color-secondary)]',
  },
  purple: {
    bg: 'bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe]',
    icon: 'bg-[var(--color-tertiary)] text-white shadow-[0_4px_12px_-2px_rgba(167,139,250,0.4)]',
    text: 'text-[var(--color-tertiary)]',
  },
  amber: {
    bg: 'bg-gradient-to-br from-[#fffbeb] to-[#fef3c7]',
    icon: 'bg-[var(--color-warning)] text-white shadow-[0_4px_12px_-2px_rgba(245,158,11,0.4)]',
    text: 'text-[var(--color-warning)]',
  },
}

function StatCard({
  title,
  value,
  description,
  icon,
  color = 'coral',
  trend,
  progress,
}: {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  color?: keyof typeof statColors
  trend?: string
  progress?: number
}) {
  const colors = statColors[color]

  return (
    <Card className="group overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors.icon} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            {icon}
          </div>
          {trend && (
            <span className="text-xs font-medium text-[var(--color-success)] bg-[var(--color-success-subtle)] px-2 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--color-fg-muted)]">{title}</p>
          <p className="text-4xl font-bold text-[var(--color-fg)] tabular-nums tracking-tight">
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)]">{description}</p>
        </div>
        {typeof progress === 'number' && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">{progress}% complete</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChallengeCard({ enrollment }: { enrollment: any }) {
  const { challenge, progressPercentage, completedCount, totalCount } = enrollment

  return (
    <Link
      href={`/participant/challenges/${challenge.id}`}
      className="group flex items-center gap-4 p-5 transition-all duration-200 hover:bg-[var(--color-bg-subtle)]"
    >
      {/* Progress Ring */}
      <div className="relative h-14 w-14 shrink-0">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="var(--color-bg-muted)"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${progressPercentage * 1.5} 150`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-[var(--color-fg)]">{progressPercentage}%</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-[var(--color-fg)] truncate group-hover:text-[var(--color-secondary)] transition-colors">
            {challenge.public_title || challenge.internal_name}
          </h3>
          {enrollment.completed_at && (
            <Badge variant="success">Completed</Badge>
          )}
        </div>
        <p className="text-sm text-[var(--color-fg-muted)]">
          {completedCount} of {totalCount} assignments completed
        </p>
        {challenge.client && (
          <p className="text-xs text-[var(--color-fg-subtle)] mt-0.5">
            {challenge.client.name}
          </p>
        )}
      </div>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-fg-subtle)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-secondary)]">
        <ArrowIcon className="h-5 w-5" />
      </div>
    </Link>
  )
}

function ActivityItem({
  activity,
  index
}: {
  activity: { type: string; title: string; timestamp: string }
  index: number
}) {
  const timeAgo = getTimeAgo(activity.timestamp)

  const iconConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    assignment_completed: {
      icon: <CheckIconSmall />,
      color: 'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
    },
    milestone_achieved: {
      icon: <TrophyIconSmall />,
      color: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
    },
  }

  const config = iconConfig[activity.type] || iconConfig.assignment_completed

  return (
    <div
      className="group flex items-start gap-3 p-3 -mx-3 rounded-xl transition-colors hover:bg-[var(--color-bg-subtle)]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.color} transition-transform duration-200 group-hover:scale-110`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-fg)] truncate">{activity.title}</p>
        <p className="text-xs text-[var(--color-fg-subtle)]">{timeAgo}</p>
      </div>
    </div>
  )
}

function EmptyChallenges() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-muted)] mb-4 animate-float">
        <span className="text-3xl">🎯</span>
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-1">No challenges yet</h3>
      <p className="text-xs text-[var(--color-fg-muted)] mb-4">
        Enroll in a challenge to start your learning journey
      </p>
      <Link href="/participant/challenges">
        <Button variant="secondary" size="sm">
          Browse Challenges
        </Button>
      </Link>
    </div>
  )
}

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-muted)] mb-4 animate-float">
        <span className="text-3xl">📭</span>
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-1">No activity yet</h3>
      <p className="text-xs text-[var(--color-fg-muted)]">
        Complete assignments to see your progress here
      </p>
    </div>
  )
}

function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  return date.toLocaleDateString()
}

// Icons
function FlagIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}

function CheckIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function TrophyIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  )
}

function FireIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
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
