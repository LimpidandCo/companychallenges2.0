import { Card, CardContent, Badge } from '@/components/ui'
import { getAchievements, getParticipantDashboardStats } from '@/lib/actions/participants'

export default async function AchievementsPage() {
  const [achievementsResult, statsResult] = await Promise.all([
    getAchievements(),
    getParticipantDashboardStats(),
  ])

  const achievements = achievementsResult.success ? achievementsResult.data : []
  const stats = statsResult.success ? statsResult.data : null

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏆</span>
          <h1 className="text-3xl font-bold text-[var(--color-fg)] tracking-tight">
            Achievements
          </h1>
        </div>
        <p className="text-[var(--color-fg-muted)] text-lg">
          Celebrate your milestones and accomplishments.
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <StatCard
            icon="🏅"
            value={stats.achievementsEarned}
            label="Total Achievements"
            color="amber"
          />
          <StatCard
            icon="🔥"
            value={stats.currentStreak}
            label={stats.currentStreak === 1 ? 'Day Streak' : 'Day Streak'}
            color="coral"
          />
          <StatCard
            icon="✅"
            value={stats.completedAssignments}
            label="Assignments Completed"
            color="teal"
          />
        </div>
      )}

      {/* Achievements List */}
      {achievements.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      ) : (
        <EmptyAchievements />
      )}
    </div>
  )
}

function StatCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  const colorClasses: Record<string, string> = {
    amber: 'bg-[var(--color-warning-subtle)] border-[var(--color-warning)]',
    coral: 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)]',
    teal: 'bg-[var(--color-secondary-subtle)] border-[var(--color-secondary)]',
  }

  return (
    <Card className={`border-l-4 ${colorClasses[color]}`}>
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

function AchievementCard({ achievement }: { achievement: any }) {
  const { milestone, achieved_at } = achievement
  const achievedDate = new Date(achieved_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const celebrationIcons: Record<string, string> = {
    badge: '🏅',
    message: '💬',
    animation: '✨',
    unlock: '🔓',
  }

  const icon = celebrationIcons[milestone?.celebration_type] || '🎉'

  return (
    <Card className="group overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-5">
        {/* Icon */}
        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-[var(--color-warning-subtle)] text-4xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="font-semibold text-[var(--color-fg)] mb-1">
            {milestone?.name || 'Achievement'}
          </h3>
          {milestone?.description && (
            <p className="text-sm text-[var(--color-fg-muted)] mb-3">
              {milestone.description}
            </p>
          )}
          {milestone?.celebration_content && milestone.celebration_type === 'message' && (
            <div className="p-3 rounded-lg bg-[var(--color-bg-subtle)] text-sm text-[var(--color-fg-muted)] mb-3 italic">
              "{milestone.celebration_content}"
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            Earned {achievedDate}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyAchievements() {
  return (
    <Card className="p-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-bg-muted)] mx-auto mb-6 animate-float">
        <span className="text-4xl">🎯</span>
      </div>
      <h3 className="text-xl font-semibold text-[var(--color-fg)] mb-2">No achievements yet</h3>
      <p className="text-[var(--color-fg-muted)] max-w-sm mx-auto">
        Complete assignments and reach milestones to earn achievements. Keep going!
      </p>
    </Card>
  )
}
