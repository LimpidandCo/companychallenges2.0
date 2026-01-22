'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  getOverviewStats,
  getChallengeStats,
  getDailyViewCounts,
  exportAnalyticsCSV,
  type OverviewStats,
  type ChallengeStats,
  type DateRange
} from '@/lib/actions/admin-analytics'

// Date range presets
const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: 0 },
] as const

// Chart type options
type ChartType = 'bar' | 'line' | 'area'

export function AnalyticsDashboard() {
  const [selectedPreset, setSelectedPreset] = useState(1) // Default to 30 days
  const [chartType, setChartType] = useState<ChartType>('area')
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null)
  const [challengeStats, setChallengeStats] = useState<ChallengeStats[]>([])
  const [dailyData, setDailyData] = useState<{ date: string; views: number; uniqueSessions: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Calculate date range from preset
  const getDateRange = (days: number): DateRange | undefined => {
    if (days === 0) return undefined
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    return {
      from: from.toISOString(),
      to: to.toISOString()
    }
  }

  // Load data on mount and when preset changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const preset = DATE_PRESETS[selectedPreset]
      const dateRange = getDateRange(preset.days)

      const [overview, challenges, daily] = await Promise.all([
        getOverviewStats(dateRange),
        getChallengeStats(dateRange),
        getDailyViewCounts(undefined, preset.days || 365)
      ])

      setOverviewStats(overview)
      setChallengeStats(challenges)
      setDailyData(daily)
      setIsLoading(false)
    }

    loadData()
  }, [selectedPreset])

  // Export handler
  const handleExport = () => {
    startTransition(async () => {
      const preset = DATE_PRESETS[selectedPreset]
      const dateRange = getDateRange(preset.days)
      const csv = await exportAnalyticsCSV(undefined, dateRange)

      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // Get comparison data (first half vs second half of period)
  const getComparisonStats = () => {
    if (dailyData.length < 2) return null
    const mid = Math.floor(dailyData.length / 2)
    const firstHalf = dailyData.slice(0, mid)
    const secondHalf = dailyData.slice(mid)
    
    const firstViews = firstHalf.reduce((sum, d) => sum + d.views, 0)
    const secondViews = secondHalf.reduce((sum, d) => sum + d.views, 0)
    
    return {
      viewsTrend: calculateTrend(secondViews, firstViews),
      avgDailyViews: Math.round(dailyData.reduce((sum, d) => sum + d.views, 0) / dailyData.length),
      peakDay: dailyData.reduce((max, d) => d.views > max.views ? d : max, dailyData[0])
    }
  }

  const comparisonStats = getComparisonStats()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Date Range Selector */}
        <div className="flex gap-2 p-1 bg-[var(--color-bg-muted)] rounded-[var(--radius-lg)]">
          {DATE_PRESETS.map((preset, index) => (
            <button
              key={preset.label}
              onClick={() => setSelectedPreset(index)}
              className={`relative rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                selectedPreset === index
                  ? 'bg-[var(--color-bg)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-fg)] shadow-[var(--shadow-xs)] transition-all duration-150 hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-sm)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          <DownloadIcon className={`h-4 w-4 ${isPending ? 'animate-bounce' : ''}`} />
          {isPending ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Overview Stats */}
      {overviewStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-stagger">
          <StatCard
            title="Challenge Views"
            value={overviewStats.totalChallengeViews}
            icon={<EyeIcon className="h-5 w-5" />}
            color="indigo"
            trend={comparisonStats?.viewsTrend}
          />
          <StatCard
            title="Assignment Views"
            value={overviewStats.totalAssignmentViews}
            icon={<FileIcon className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Media Plays"
            value={overviewStats.totalMediaPlays}
            icon={<PlayIcon className="h-5 w-5" />}
            color="emerald"
          />
          <StatCard
            title="Unique Sessions"
            value={overviewStats.uniqueSessions}
            icon={<UsersIcon className="h-5 w-5" />}
            color="amber"
          />
        </div>
      )}

      {/* Charts Section */}
      {dailyData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Chart - Takes 2 columns */}
          <div className="lg:col-span-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] animate-slide-up delay-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-fg)]">Views Over Time</h3>
                <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">
                  {dailyData.length} days of data
                </p>
              </div>
              {/* Chart Type Selector */}
              <div className="flex gap-1 p-1 bg-[var(--color-bg-muted)] rounded-[var(--radius-md)]">
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-1.5 rounded-[var(--radius-sm)] transition-all ${
                    chartType === 'bar' ? 'bg-[var(--color-bg)] shadow-sm' : 'hover:bg-[var(--color-bg)]/50'
                  }`}
                  title="Bar Chart"
                >
                  <BarChartIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`p-1.5 rounded-[var(--radius-sm)] transition-all ${
                    chartType === 'line' ? 'bg-[var(--color-bg)] shadow-sm' : 'hover:bg-[var(--color-bg)]/50'
                  }`}
                  title="Line Chart"
                >
                  <LineChartIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`p-1.5 rounded-[var(--radius-sm)] transition-all ${
                    chartType === 'area' ? 'bg-[var(--color-bg)] shadow-sm' : 'hover:bg-[var(--color-bg)]/50'
                  }`}
                  title="Area Chart"
                >
                  <AreaChartIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {chartType === 'bar' && <BarChart data={dailyData} />}
            {chartType === 'line' && <LineChart data={dailyData} />}
            {chartType === 'area' && <AreaChart data={dailyData} />}
          </div>

          {/* Side Panel - Stats Summary */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-sm)] animate-slide-up delay-150">
              <h4 className="text-sm font-semibold text-[var(--color-fg)] mb-4">Quick Insights</h4>
              <div className="space-y-4">
                {comparisonStats && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--color-fg-muted)]">Avg. Daily Views</span>
                      <span className="text-lg font-bold text-[var(--color-fg)]">
                        {comparisonStats.avgDailyViews.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--color-fg-muted)]">Peak Day</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[var(--color-fg)]">
                          {comparisonStats.peakDay.views.toLocaleString()}
                        </span>
                        <p className="text-xs text-[var(--color-fg-muted)]">
                          {formatDate(comparisonStats.peakDay.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--color-fg-muted)]">Period Trend</span>
                      <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
                        comparisonStats.viewsTrend >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {comparisonStats.viewsTrend >= 0 ? (
                          <TrendUpIcon className="h-4 w-4" />
                        ) : (
                          <TrendDownIcon className="h-4 w-4" />
                        )}
                        {Math.abs(comparisonStats.viewsTrend)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Distribution Chart */}
            {challengeStats.length > 0 && (
              <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-sm)] animate-slide-up delay-200">
                <h4 className="text-sm font-semibold text-[var(--color-fg)] mb-4">Views by Challenge</h4>
                <DonutChart data={challengeStats.slice(0, 5)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Challenge Stats Table */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] animate-slide-up delay-200 overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-bg-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--color-fg)]">Challenge Performance</h3>
        </div>

        {challengeStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-muted)] mb-4">
              <ChartIcon className="h-8 w-8 text-[var(--color-fg-subtle)]" />
            </div>
            <p className="text-sm text-[var(--color-fg-muted)] max-w-[280px]">
              No analytics data yet. Views will appear here once challenges are visited.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
                  <th className="px-6 py-3">Challenge</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3 text-right">Views</th>
                  <th className="px-6 py-3 text-right">Unique Sessions</th>
                  <th className="px-6 py-3 text-right">Assignment Views</th>
                  <th className="px-6 py-3 text-right">Media Plays</th>
                  <th className="px-6 py-3 text-right">Completions</th>
                  <th className="px-6 py-3 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {challengeStats.map((stat, index) => {
                  // Calculate engagement rate
                  const engagementRate = stat.totalViews > 0 
                    ? Math.round((stat.assignmentViews / stat.totalViews) * 100) 
                    : 0
                  
                  return (
                    <tr
                      key={stat.challengeId}
                      className="hover:bg-[var(--color-bg-subtle)] transition-colors duration-100"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/challenges/${stat.challengeId}`}
                          className="font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)] transition-colors"
                        >
                          {stat.challengeName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-fg-muted)]">
                        {stat.clientName}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-sm font-medium rounded-[var(--radius-md)]">
                          {stat.totalViews.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[var(--color-fg-muted)] tabular-nums">
                        {stat.uniqueSessions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[var(--color-fg-muted)] tabular-nums">
                        {stat.assignmentViews.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[var(--color-fg-muted)] tabular-nums">
                        {stat.mediaPlays.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[var(--color-fg-muted)] tabular-nums">
                        {stat.completions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(engagementRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[var(--color-fg-muted)] tabular-nums w-8">
                            {engagementRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Color mappings for stat cards
const colorMap = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-500/20'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/20'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/20'
  }
}

// Stat Card Component with optional trend
function StatCard({
  title,
  value,
  icon,
  color = 'indigo',
  trend
}: {
  title: string
  value: number
  icon: React.ReactNode
  color?: keyof typeof colorMap
  trend?: number
}) {
  const colors = colorMap[color]

  return (
    <div className="group rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-hover)]">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] ${colors.bg} ${colors.text} ring-1 ${colors.ring} transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-fg-muted)]">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[var(--color-fg)] tabular-nums animate-count-up">
              {value.toLocaleString()}
            </p>
            {trend !== undefined && (
              <span className={`inline-flex items-center text-xs font-medium ${
                trend >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Bar Chart Component
function BarChart({
  data
}: {
  data: { date: string; views: number; uniqueSessions: number }[]
}) {
  const maxViews = Math.max(...data.map(d => d.views), 1)
  const displayData = data.slice(-21) // Show last 21 days

  return (
    <div className="h-64">
      <div className="flex h-full items-end gap-1">
        {displayData.map((day, index) => {
          const height = (day.views / maxViews) * 100
          return (
            <div
              key={day.date}
              className="group relative flex-1 min-w-[8px]"
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all duration-200 hover:from-indigo-600 hover:to-indigo-500 animate-slide-up origin-bottom cursor-pointer"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-10">
                <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                  <div className="font-semibold">{formatDate(day.date)}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    {day.views} views
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {day.uniqueSessions} sessions
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium text-[var(--color-fg-muted)]">
        <span>{formatDate(displayData[0]?.date || '')}</span>
        <span>{formatDate(displayData[displayData.length - 1]?.date || '')}</span>
      </div>
    </div>
  )
}

// Line Chart Component (SVG-based)
function LineChart({
  data
}: {
  data: { date: string; views: number; uniqueSessions: number }[]
}) {
  const displayData = data.slice(-30)
  const maxViews = Math.max(...displayData.map(d => d.views), 1)
  const maxSessions = Math.max(...displayData.map(d => d.uniqueSessions), 1)
  const max = Math.max(maxViews, maxSessions)
  
  const width = 100
  const height = 100
  const padding = 5

  const getPoint = (value: number, index: number, total: number) => {
    const x = padding + ((width - padding * 2) / (total - 1)) * index
    const y = height - padding - ((value / max) * (height - padding * 2))
    return { x, y }
  }

  const viewsPath = displayData.map((d, i) => {
    const { x, y } = getPoint(d.views, i, displayData.length)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const sessionsPath = displayData.map((d, i) => {
    const { x, y } = getPoint(d.uniqueSessions, i, displayData.length)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <div className="h-64 relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={height - padding - (pct / 100) * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - (pct / 100) * (height - padding * 2)}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={0.3}
          />
        ))}
        
        {/* Sessions line */}
        <path
          d={sessionsPath}
          fill="none"
          stroke="#10b981"
          strokeWidth={0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        
        {/* Views line */}
        <path
          d={viewsPath}
          fill="none"
          stroke="#6366f1"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />

        {/* Data points for views */}
        {displayData.map((d, i) => {
          const { x, y } = getPoint(d.views, i, displayData.length)
          return (
            <circle
              key={`view-${i}`}
              cx={x}
              cy={y}
              r={0.8}
              fill="#6366f1"
              className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            />
          )
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute top-2 right-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-indigo-500 rounded-full" />
          <span className="text-[var(--color-fg-muted)]">Views</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
          <span className="text-[var(--color-fg-muted)]">Sessions</span>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between text-xs font-medium text-[var(--color-fg-muted)]">
        <span>{formatDate(displayData[0]?.date || '')}</span>
        <span>{formatDate(displayData[displayData.length - 1]?.date || '')}</span>
      </div>
    </div>
  )
}

// Area Chart Component (SVG-based)
function AreaChart({
  data
}: {
  data: { date: string; views: number; uniqueSessions: number }[]
}) {
  const displayData = data.slice(-30)
  const maxViews = Math.max(...displayData.map(d => d.views), 1)
  
  const width = 100
  const height = 100
  const padding = 5

  const getPoint = (value: number, index: number, total: number) => {
    const x = padding + ((width - padding * 2) / (total - 1)) * index
    const y = height - padding - ((value / maxViews) * (height - padding * 2))
    return { x, y }
  }

  const linePath = displayData.map((d, i) => {
    const { x, y } = getPoint(d.views, i, displayData.length)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Area path (line + close to bottom)
  const firstPoint = getPoint(displayData[0]?.views || 0, 0, displayData.length)
  const lastPoint = getPoint(displayData[displayData.length - 1]?.views || 0, displayData.length - 1, displayData.length)
  const areaPath = `${linePath} L ${lastPoint.x} ${height - padding} L ${firstPoint.x} ${height - padding} Z`

  return (
    <div className="h-64 relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={height - padding - (pct / 100) * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - (pct / 100) * (height - padding * 2)}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={0.3}
          />
        ))}
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          className="transition-all duration-300"
        />
        
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
      </svg>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-[var(--color-fg-muted)]">
        <span>{maxViews.toLocaleString()}</span>
        <span>{Math.round(maxViews / 2).toLocaleString()}</span>
        <span>0</span>
      </div>
      
      <div className="mt-3 flex justify-between text-xs font-medium text-[var(--color-fg-muted)]">
        <span>{formatDate(displayData[0]?.date || '')}</span>
        <span>{formatDate(displayData[displayData.length - 1]?.date || '')}</span>
      </div>
    </div>
  )
}

// Donut Chart for challenge distribution
function DonutChart({
  data
}: {
  data: ChallengeStats[]
}) {
  const total = data.reduce((sum, d) => sum + d.totalViews, 0)
  const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']
  
  // Calculate segments
  let currentAngle = -90 // Start from top
  const segments = data.map((d, i) => {
    const percentage = total > 0 ? (d.totalViews / total) * 100 : 0
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    currentAngle += angle
    return {
      ...d,
      percentage,
      startAngle,
      endAngle: currentAngle,
      color: colors[i % colors.length]
    }
  })

  // SVG arc path helper
  const describeArc = (startAngle: number, endAngle: number, radius: number, innerRadius: number) => {
    const start = polarToCartesian(50, 50, radius, endAngle)
    const end = polarToCartesian(50, 50, radius, startAngle)
    const innerStart = polarToCartesian(50, 50, innerRadius, endAngle)
    const innerEnd = polarToCartesian(50, 50, innerRadius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      'Z'
    ].join(' ')
  }

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={describeArc(seg.startAngle + 90, seg.endAngle + 90, 45, 30)}
              fill={seg.color}
              className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-fg)]">{total.toLocaleString()}</div>
            <div className="text-[10px] text-[var(--color-fg-muted)]">total</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 space-y-1.5 w-full">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span 
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="truncate flex-1 text-[var(--color-fg-muted)]" title={seg.challengeName}>
              {seg.challengeName}
            </span>
            <span className="font-medium text-[var(--color-fg)] tabular-nums">
              {seg.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Controls skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-[var(--color-bg-muted)] rounded-[var(--radius-lg)]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-[var(--radius-md)] skeleton" />
          ))}
        </div>
        <div className="h-10 w-32 rounded-[var(--radius-lg)] skeleton" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[88px] rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[var(--radius-lg)] skeleton" />
              <div className="space-y-2">
                <div className="h-4 w-20 skeleton skeleton-text" />
                <div className="h-6 w-16 skeleton skeleton-text" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-80 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 animate-slide-up delay-200">
        <div className="h-4 w-32 skeleton skeleton-text mb-4" />
        <div className="h-52 flex items-end gap-1.5">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[var(--radius-sm)] skeleton"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden animate-slide-up delay-300">
        <div className="border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-bg-subtle)]">
          <div className="h-4 w-40 skeleton skeleton-text" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-48 skeleton skeleton-text" />
              <div className="h-4 w-24 skeleton skeleton-text" />
              <div className="flex-1" />
              <div className="h-4 w-12 skeleton skeleton-text" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Icons
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function LineChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  )
}

function AreaChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
    </svg>
  )
}

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  )
}

function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
    </svg>
  )
}
