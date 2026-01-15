'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useUser } from '@/components/providers/clerk-provider'
import { Spinner } from '@/components/ui'
import { 
  getParticipantDashboardStats,
  getEnrolledChallenges,
  getRecentActivity,
  getAchievements
} from '@/lib/actions/participants'
import type { ParticipantDashboardStats, EnrolledChallengeWithProgress } from '@/lib/types/database'

export function ParticipantDashboard() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ParticipantDashboardStats | null>(null)
  const [enrolledChallenges, setEnrolledChallenges] = useState<EnrolledChallengeWithProgress[]>([])
  const [recentActivity, setRecentActivity] = useState<{ type: string; title: string; timestamp: string }[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsResult, challengesResult, activityResult, achievementsResult] = await Promise.all([
          getParticipantDashboardStats(),
          getEnrolledChallenges(),
          getRecentActivity(5),
          getAchievements()
        ])

        if (statsResult.success) setStats(statsResult.data)
        if (challengesResult.success) setEnrolledChallenges(challengesResult.data)
        if (activityResult.success) setRecentActivity(activityResult.data)
        if (achievementsResult.success) setAchievements(achievementsResult.data)
      } catch {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
        </h1>
        <p className="mt-1 text-gray-600">
          Here's your learning progress at a glance.
        </p>
      </header>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <StatCard
            label="Enrolled"
            value={stats.enrolledChallenges}
            icon={<BookIcon className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            label="Completed"
            value={`${stats.completedAssignments}/${stats.totalAssignments}`}
            icon={<CheckIcon className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            label="Achievements"
            value={stats.achievementsEarned}
            icon={<TrophyIcon className="h-5 w-5" />}
            color="amber"
          />
          <StatCard
            label="Day Streak"
            value={stats.currentStreak}
            icon={<FlameIcon className="h-5 w-5" />}
            color="orange"
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - Enrolled Challenges */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">My Challenges</h2>
              <Link 
                href="/participant/challenges"
                className="text-sm text-blue-600 hover:underline"
              >
                View all →
              </Link>
            </div>

            {enrolledChallenges.length === 0 ? (
              <EmptyState
                icon={<BookIcon className="h-12 w-12 text-gray-400" />}
                title="No challenges yet"
                description="Browse available challenges to start learning!"
                actionLabel="Browse Challenges"
                actionHref="/participant/challenges/browse"
              />
            ) : (
              <div className="space-y-4">
                {enrolledChallenges.slice(0, 3).map((enrollment) => (
                  <ChallengeCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'milestone_achieved' 
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {activity.type === 'milestone_achieved' ? (
                        <TrophyIcon className="h-4 w-4" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - Achievements */}
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
              <Link 
                href="/participant/achievements"
                className="text-sm text-blue-600 hover:underline"
              >
                View all →
              </Link>
            </div>

            {achievements.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <TrophyIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Complete challenges to earn achievements!
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                {achievements.slice(0, 5).map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-2">
              <QuickLink 
                href="/participant/challenges/browse" 
                icon={<SearchIcon className="h-4 w-4" />}
                label="Browse Challenges"
              />
              <QuickLink 
                href="/participant/settings" 
                icon={<SettingsIcon className="h-4 w-4" />}
                label="Settings"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'amber' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

function ChallengeCard({ enrollment }: { enrollment: EnrolledChallengeWithProgress }) {
  const challenge = (enrollment as any).challenge
  const client = challenge?.client
  const brandColor = challenge?.brand_color || '#3b82f6'
  const title = challenge?.public_title || challenge?.internal_name || 'Challenge'
  
  return (
    <Link 
      href={`/c/${challenge?.slug}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 transition-all hover:shadow-md hover:border-gray-300"
    >
      <div className="flex items-start gap-4">
        {/* Logo/Color Badge */}
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: brandColor }}
        >
          {client?.logo_url ? (
            <img src={client.logo_url} alt="" className="w-8 h-8 object-contain" />
          ) : (
            title.charAt(0).toUpperCase()
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          {client?.name && (
            <p className="text-sm text-gray-500">{client.name}</p>
          )}

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">
                {enrollment.completedCount} of {enrollment.totalCount} completed
              </span>
              <span className="font-medium" style={{ color: brandColor }}>
                {enrollment.progressPercentage}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${enrollment.progressPercentage}%`,
                  backgroundColor: brandColor
                }}
              />
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
      </div>
    </Link>
  )
}

function AchievementBadge({ achievement }: { achievement: any }) {
  const milestone = achievement.milestone
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
        🏆
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {milestone?.name || 'Achievement'}
        </p>
        <p className="text-xs text-gray-500">
          {formatRelativeTime(achievement.achieved_at)}
        </p>
      </div>
    </div>
  )
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  actionHref 
}: {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

// =============================================================================
// Icons
// =============================================================================

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
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

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.999 0" />
    </svg>
  )
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

