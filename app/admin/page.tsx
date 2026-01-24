import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { getDashboardStats, getRecentActivity } from '@/lib/actions/dashboard'
import { RefreshButton } from './refresh-button'

export const dynamic = 'force-dynamic' // Always fetch fresh data
export const revalidate = 0 // Disable caching

export default async function AdminDashboard() {
  const [stats, activities] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(5),
  ])

  const lastUpdated = new Date().toLocaleTimeString()

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Clean Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your challenges and track engagement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastUpdated}
          </span>
          <RefreshButton />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Clients"
          value={stats.totalClients}
          icon="🏢"
          href="/admin/clients"
        />
        <StatCard
          title="Challenges"
          value={stats.activeChallenges}
          icon="🚀"
          href="/admin/challenges"
        />
        <StatCard
          title="Assignments"
          value={stats.totalAssignments}
          icon="📋"
          href="/admin/assignments"
        />
        <StatCard
          title="Views"
          value={stats.thisMonthViews}
          icon="👁️"
          label="This month"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="New Client"
            description="Add an organization"
            href="/admin/clients"
            icon="➕"
            color="bg-gradient-to-br from-orange-400 to-rose-400"
          />
          <QuickActionCard
            title="New Challenge"
            description="Create a learning journey"
            href="/admin/challenges"
            icon="🎯"
            color="bg-gradient-to-br from-teal-400 to-cyan-400"
          />
          <QuickActionCard
            title="New Assignment"
            description="Build content"
            href="/admin/assignments"
            icon="📝"
            color="bg-gradient-to-br from-violet-400 to-purple-400"
          />
          <QuickActionCard
            title="Analytics"
            description="View metrics"
            href="/admin/analytics"
            icon="📊"
            color="bg-gradient-to-br from-amber-400 to-orange-400"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-500">Latest changes in your workspace</p>
        </div>
        <div className="p-5">
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <ActivityItem key={activity.id} activity={activity} index={index} />
              ))}
            </div>
          ) : (
            <EmptyActivity />
          )}
        </div>
      </div>
    </div>
  )
}

// Simple Stat Card
function StatCard({
  title,
  value,
  icon,
  href,
  label,
}: {
  title: string
  value: number
  icon: string
  href?: string
  label?: string
}) {
  const content = (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:border-gray-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {href && (
          <span className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all">
            →
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500 mt-1">{label || title}</p>
    </div>
  )
  
  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

// Quick Action Card
function QuickActionCard({ 
  title, 
  description, 
  href, 
  icon,
  color,
}: { 
  title: string
  description: string
  href: string
  icon: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-1"
    >
      <div className={`absolute inset-0 ${color} opacity-90`} />
      <div className="relative">
        <span className="text-3xl mb-3 block">{icon}</span>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/80">{description}</p>
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

  const emojiMap: Record<string, string> = {
    client_created: '🏢',
    challenge_created: '🚀',
    challenge_archived: '📦',
    assignment_created: '📝',
  }

  const emoji = emojiMap[activity.type] || '📋'

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
        <p className="text-xs text-gray-500">{timeAgo}</p>
      </div>
    </div>
  )
}

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3">📭</span>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">No activity yet</h3>
      <p className="text-sm text-gray-500">
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
