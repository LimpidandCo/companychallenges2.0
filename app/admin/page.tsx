import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { getDashboardStats, getRecentActivity } from '@/lib/actions/dashboard'

export default async function AdminDashboard() {
  const [stats, activities] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(5),
  ])

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
          Here's what's happening with your challenges today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-stagger mb-10">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          description="Active organizations"
          icon={<BuildingIconSmall />}
          color="coral"
          trend="+2 this month"
        />
        <StatCard
          title="Challenges"
          value={stats.activeChallenges}
          description="Learning trajectories"
          icon={<RocketIconSmall />}
          color="teal"
        />
        <StatCard
          title="Assignments"
          value={stats.totalAssignments}
          description="Content units"
          icon={<FileIconSmall />}
          color="purple"
        />
        <StatCard
          title="Views"
          value={stats.thisMonthViews}
          description="This month"
          icon={<EyeIconSmall />}
          color="amber"
          trend="+12% vs last month"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quick Actions - Takes 3 columns */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden animate-slide-up delay-200">
            <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <CardTitle>Quick Actions</CardTitle>
              </div>
              <CardDescription>Jump right into your most common tasks</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--color-border)]">
                <QuickAction
                  title="Create a Client"
                  description="Add a new organization to the platform"
                  href="/admin/clients"
                  icon={<PlusCircleIcon />}
                  color="coral"
                  badge="Popular"
                />
                <QuickAction
                  title="Build a Challenge"
                  description="Design a new learning trajectory"
                  href="/admin/challenges"
                  icon={<RocketIconSmall />}
                  color="teal"
                />
                <QuickAction
                  title="Add Assignment"
                  description="Create reusable content for challenges"
                  href="/admin/assignments"
                  icon={<FileIconSmall />}
                  color="purple"
                />
                <QuickAction
                  title="View Analytics"
                  description="Check engagement and performance metrics"
                  href="/admin/analytics"
                  icon={<ChartIconSmall />}
                  color="amber"
                />
              </div>
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
              <CardDescription>Latest changes in your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <ActivityItem key={activity.id} activity={activity} index={index} />
                  ))}
                </div>
              ) : (
                <EmptyActivity />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Tip */}
      <div className="mt-8 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50 animate-slide-up delay-500">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-tertiary-subtle)] text-[var(--color-tertiary)]">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[var(--color-fg)] mb-1">Pro tip</p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              You can customize challenge URLs with unique slugs to make them memorable and on-brand for each client. 
              Edit any challenge to update its public URL.
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
}: {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  color?: keyof typeof statColors
  trend?: string
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
      </CardContent>
    </Card>
  )
}

function QuickAction({ 
  title, 
  description, 
  href, 
  icon, 
  color = 'coral',
  badge
}: { 
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color?: keyof typeof statColors
  badge?: string
}) {
  const colors = statColors[color]
  
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-5 transition-all duration-200 hover:bg-[var(--color-bg-subtle)]"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors.icon} transition-all duration-200 group-hover:scale-105`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors">
            {title}
          </p>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-fg-muted)] truncate">{description}</p>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-fg-subtle)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-accent)]">
        <ArrowIcon className="h-5 w-5" />
      </div>
    </Link>
  )
}

function ActivityItem({ 
  activity, 
  index 
}: { 
  activity: { id: string; type: string; title: string; timestamp: string }
  index: number
}) {
  const timeAgo = getTimeAgo(activity.timestamp)

  const iconConfig: Record<string, { icon: React.ReactNode; color: string; emoji: string }> = {
    client_created: {
      icon: <BuildingIconSmall />,
      color: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
      emoji: '🏢'
    },
    challenge_created: {
      icon: <RocketIconSmall />,
      color: 'bg-[var(--color-secondary-subtle)] text-[var(--color-secondary)]',
      emoji: '🚀'
    },
    challenge_archived: {
      icon: <ArchiveIconSmall />,
      color: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
      emoji: '📦'
    },
    assignment_created: {
      icon: <FileIconSmall />,
      color: 'bg-[var(--color-tertiary-subtle)] text-[var(--color-tertiary)]',
      emoji: '📝'
    },
  }

  const config = iconConfig[activity.type] || iconConfig.assignment_created

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

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-muted)] mb-4 animate-float">
        <span className="text-3xl">📭</span>
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-1">No activity yet</h3>
      <p className="text-xs text-[var(--color-fg-muted)]">
        Your recent changes will appear here
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
function BuildingIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  )
}

function RocketIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  )
}

function FileIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function ChartIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function EyeIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function ArchiveIconSmall() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}
