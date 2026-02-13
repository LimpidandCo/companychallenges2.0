'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  getOverviewStats,
  getAssignmentStats,
  getSprintStats,
  getDailyViewCounts,
  exportAnalyticsCSV,
  exportAssignmentSummaryCSV,
  type OverviewStats,
  type AssignmentStats,
  type SprintStats,
  type DateRange,
} from '@/lib/actions/admin-analytics'
import { downloadAnalyticsPDF } from '@/lib/analytics/export-pdf'

// ─── Date presets ───────────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: 0 },
  { label: 'Custom', days: -1 },
] as const

type ChartType = 'bar' | 'line' | 'area'

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ─── Main component ─────────────────────────────────────────────────────────────
export function ChallengeAnalytics({ challengeId, challengeName }: { challengeId: string; challengeName: string }) {
  const [selectedPreset, setSelectedPreset] = useState(1)
  const [chartType, setChartType] = useState<ChartType>('area')
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [assignments, setAssignments] = useState<AssignmentStats[]>([])
  const [sprints, setSprints] = useState<SprintStats[]>([])
  const [dailyData, setDailyData] = useState<{ date: string; views: number; uniqueSessions: number }[]>([])
  const [sprintFilter, setSprintFilter] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  // Custom date range state
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return toDateInputValue(d)
  })
  const [customTo, setCustomTo] = useState<string>(() => toDateInputValue(new Date()))

  const getDateRange = (days: number): DateRange | undefined => {
    if (days === -1) {
      return {
        from: new Date(customFrom + 'T00:00:00').toISOString(),
        to: new Date(customTo + 'T23:59:59').toISOString()
      }
    }
    if (days === 0) return undefined
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    return { from: from.toISOString(), to: to.toISOString() }
  }

  const getChartDays = (days: number): number => {
    if (days === -1) {
      const diffMs = new Date(customTo).getTime() - new Date(customFrom).getTime()
      return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1)
    }
    return days || 365
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const preset = DATE_PRESETS[selectedPreset]
      const dateRange = getDateRange(preset.days)
      const isCustom = preset.days === -1
      const customDateRange = isCustom ? dateRange : undefined

      const [ov, asgn, spr, daily] = await Promise.all([
        getOverviewStats(dateRange, undefined, challengeId),
        getAssignmentStats(challengeId, dateRange),
        getSprintStats(challengeId, dateRange),
        getDailyViewCounts(challengeId, getChartDays(preset.days), undefined, customDateRange),
      ])

      setOverview(ov)
      setAssignments(asgn)
      setSprints(spr)
      setDailyData(daily)
      setIsLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset, challengeId, customFrom, customTo])

  // Build scoped overview from actual server data
  const challengeOverview = overview
    ? {
        totalViews: overview.totalChallengeViews + overview.totalAssignmentViews,
        assignmentViews: overview.totalAssignmentViews,
        mediaPlays: overview.totalMediaPlays,
        completions: overview.totalCompletions,
        uniqueSessions: overview.uniqueSessions,
        completionRate:
          overview.totalAssignmentViews > 0
            ? Math.round((overview.totalCompletions / overview.totalAssignmentViews) * 100)
            : 0,
      }
    : { totalViews: 0, assignmentViews: 0, mediaPlays: 0, completions: 0, uniqueSessions: 0, completionRate: 0 }

  const handleExport = () => {
    startTransition(async () => {
      const preset = DATE_PRESETS[selectedPreset]
      const dateRange = getDateRange(preset.days)
      const csv = await exportAnalyticsCSV(challengeId, dateRange)
      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const slug = challengeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const dateSlug = preset.days === -1 ? `${customFrom}_to_${customTo}` : new Date().toISOString().split('T')[0]
        a.download = `${slug}-analytics-${dateSlug}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  const handleExportSummary = () => {
    startTransition(async () => {
      const preset = DATE_PRESETS[selectedPreset]
      const dateRange = getDateRange(preset.days)
      const csv = await exportAssignmentSummaryCSV(challengeId, dateRange)
      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const slug = challengeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const dateSlug = preset.days === -1 ? `${customFrom}_to_${customTo}` : new Date().toISOString().split('T')[0]
        a.download = `${slug}-assignment-summary-${dateSlug}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  const handleExportPDF = () => {
    const preset = DATE_PRESETS[selectedPreset]
    const dateLabel = preset.days === -1
      ? `${customFrom} to ${customTo}`
      : preset.days === 0
        ? 'All time'
        : `Last ${preset.days} days`

    downloadAnalyticsPDF({
      challengeName,
      dateRange: dateLabel,
      overview: challengeOverview,
      sprints,
      assignments,
    })
  }

  // Filter assignments by sprint
  const filteredAssignments = sprintFilter
    ? assignments.filter((a) => a.sprintId === sprintFilter)
    : assignments

  // Assignment funnel data (max views as baseline)
  const maxViews = Math.max(...assignments.map((a) => a.views), 1)

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
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

          {/* Custom Date Range Inputs */}
          {DATE_PRESETS[selectedPreset].days === -1 && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-fg)] shadow-[var(--shadow-xs)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-fg-muted)]">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-fg)] shadow-[var(--shadow-xs)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isPending || isLoading}
            className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-all duration-150 hover:opacity-90 hover:shadow-[var(--shadow-sm)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <DocIcon className="h-4 w-4" />
            PDF Report
          </button>
          <button
            onClick={handleExportSummary}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-fg)] shadow-[var(--shadow-xs)] transition-all duration-150 hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-sm)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <DownloadIcon className={`h-4 w-4 ${isPending ? 'animate-bounce' : ''}`} />
            Summary CSV
          </button>
          <button
            onClick={handleExport}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-fg-muted)] shadow-[var(--shadow-xs)] transition-all duration-150 hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-sm)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <DownloadIcon className="h-4 w-4" />
            Raw Events
          </button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-stagger">
        <StatCard title="Total Views" value={challengeOverview.totalViews} icon={<EyeIcon className="h-5 w-5" />} color="indigo" />
        <StatCard title="Assignment Views" value={challengeOverview.assignmentViews} icon={<FileIcon className="h-5 w-5" />} color="blue" />
        <StatCard title="Media Plays" value={challengeOverview.mediaPlays} icon={<PlayIcon className="h-5 w-5" />} color="emerald" />
        <StatCard title="Completions" value={challengeOverview.completions} icon={<CheckCircleIcon className="h-5 w-5" />} color="amber" />
        <StatCard title="Completion Rate" value={challengeOverview.completionRate} icon={<PercentIcon className="h-5 w-5" />} color="purple" suffix="%" />
      </div>

      {/* ── Daily chart ────────────────────────────────────────────────────── */}
      {dailyData.length > 0 && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-sm)] animate-slide-up delay-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-fg)]">Views Over Time</h3>
              <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">{dailyData.length} days of data</p>
            </div>
            <div className="flex gap-1 p-1 bg-[var(--color-bg-muted)] rounded-[var(--radius-md)]">
              {(['bar', 'line', 'area'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={`p-1.5 rounded-[var(--radius-sm)] transition-all ${
                    chartType === t ? 'bg-[var(--color-bg)] shadow-sm' : 'hover:bg-[var(--color-bg)]/50'
                  }`}
                  title={`${t.charAt(0).toUpperCase() + t.slice(1)} Chart`}
                >
                  {t === 'bar' && <BarChartIcon className="h-4 w-4" />}
                  {t === 'line' && <LineChartIcon className="h-4 w-4" />}
                  {t === 'area' && <AreaChartIcon className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
          {chartType === 'bar' && <BarChart data={dailyData} />}
          {chartType === 'line' && <LineChart data={dailyData} />}
          {chartType === 'area' && <AreaChart data={dailyData} />}
        </div>
      )}

      {/* ── Sprint breakdown ───────────────────────────────────────────────── */}
      {sprints.length > 0 && (
        <div className="animate-slide-up delay-150">
          <h3 className="text-base font-semibold text-[var(--color-fg)] mb-4">Sprint Breakdown</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sprints.map((sprint) => (
              <button
                key={sprint.sprintId}
                onClick={() => setSprintFilter(sprintFilter === sprint.sprintId ? '' : sprint.sprintId)}
                className={`text-left rounded-[var(--radius-xl)] border bg-[var(--color-bg)] p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] ${
                  sprintFilter === sprint.sprintId
                    ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-[var(--color-fg)] truncate">{sprint.sprintName}</h4>
                  <span className="text-xs font-medium text-[var(--color-fg-muted)] tabular-nums">
                    {sprint.assignmentCount} assignments
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-[var(--color-fg-muted)]">Views</p>
                    <p className="text-lg font-bold text-[var(--color-fg)] tabular-nums">{sprint.totalViews.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-muted)]">Completions</p>
                    <p className="text-lg font-bold text-[var(--color-fg)] tabular-nums">{sprint.completions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-muted)]">Sessions</p>
                    <p className="text-lg font-bold text-[var(--color-fg)] tabular-nums">{sprint.uniqueSessions.toLocaleString()}</p>
                  </div>
                </div>
                {/* Completion rate bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(sprint.completionRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--color-fg-muted)] tabular-nums w-8">
                    {sprint.completionRate}%
                  </span>
                </div>
              </button>
            ))}
          </div>
          {sprintFilter && (
            <button
              onClick={() => setSprintFilter('')}
              className="mt-3 text-sm text-[var(--color-accent)] hover:underline"
            >
              Clear sprint filter
            </button>
          )}
        </div>
      )}

      {/* ── Completion Drop-off ─────────────────────────────────────────────── */}
      {filteredAssignments.length > 1 && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-sm)] animate-slide-up delay-175">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-fg)]">Completion Drop-off</h3>
              <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">
                How completions decrease from the first to the last assignment
              </p>
            </div>
          </div>
          <DropOffChart assignments={filteredAssignments} />
        </div>
      )}

      {/* ── Assignment funnel ──────────────────────────────────────────────── */}
      {assignments.length > 0 && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-sm)] animate-slide-up delay-200">
          <h3 className="text-base font-semibold text-[var(--color-fg)] mb-1">Assignment Funnel</h3>
          <p className="text-sm text-[var(--color-fg-muted)] mb-6">
            Views and completions per assignment in order — shows engagement drop-off.
          </p>
          <div className="space-y-3">
            {filteredAssignments.map((asgn, index) => {
              const viewPct = (asgn.views / maxViews) * 100
              const completePct = (asgn.completions / maxViews) * 100
              const completionRate = asgn.views > 0 ? Math.round((asgn.completions / asgn.views) * 100) : 0

              return (
                <div key={asgn.assignmentId} className="group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="w-6 text-xs font-semibold text-[var(--color-fg-muted)] tabular-nums text-right">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-[var(--color-fg)] truncate" title={asgn.assignmentTitle}>
                      {asgn.assignmentTitle}
                    </span>
                    {asgn.sprintName && (
                      <span className="text-xs text-[var(--color-fg-subtle)] bg-[var(--color-bg-muted)] px-2 py-0.5 rounded-full">
                        {asgn.sprintName}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-fg-muted)] tabular-nums whitespace-nowrap">
                      {asgn.views} views · {asgn.completions} done · {completionRate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6" />
                    <div className="flex-1 relative h-6">
                      {/* Views bar (background) */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-[var(--radius-sm)] bg-indigo-100 dark:bg-indigo-500/15 transition-all duration-500"
                        style={{ width: `${Math.max(viewPct, 1)}%` }}
                      />
                      {/* Completions bar (foreground) */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-[var(--radius-sm)] bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(completePct, 0.5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 mt-5 text-xs text-[var(--color-fg-muted)]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-100 dark:bg-indigo-500/15" />
              Views
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-400 to-emerald-500" />
              Completions
            </div>
          </div>
        </div>
      )}

      {/* ── Assignment detail table ────────────────────────────────────────── */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-sm)] overflow-hidden animate-slide-up delay-300">
        <div className="border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-bg-subtle)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-fg)]">
            Assignment Detail
            {sprintFilter && sprints.length > 0 && (
              <span className="ml-2 font-normal text-[var(--color-fg-muted)]">
                — {sprints.find((s) => s.sprintId === sprintFilter)?.sprintName}
              </span>
            )}
          </h3>
          {sprints.length > 1 && (
            <div className="relative">
              <select
                value={sprintFilter}
                onChange={(e) => setSprintFilter(e.target.value)}
                className="appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] pl-3 pr-7 py-1 text-xs font-medium text-[var(--color-fg)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
              >
                <option value="">All sprints</option>
                {sprints.map((s) => (
                  <option key={s.sprintId} value={s.sprintId}>
                    {s.sprintName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-[var(--color-fg-muted)]">No assignment data yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
                  <th className="px-6 py-3 w-8">#</th>
                  <th className="px-6 py-3">Assignment</th>
                  {sprints.length > 0 && !sprintFilter && <th className="px-6 py-3">Sprint</th>}
                  <th className="px-6 py-3 text-right">Views</th>
                  <th className="px-6 py-3 text-right">Sessions</th>
                  <th className="px-6 py-3 text-right">Media</th>
                  <th className="px-6 py-3 text-right">Completions</th>
                  <th className="px-6 py-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredAssignments.map((asgn, index) => {
                  const rate = asgn.views > 0 ? Math.round((asgn.completions / asgn.views) * 100) : 0
                  return (
                    <tr key={asgn.assignmentId} className="hover:bg-[var(--color-bg-subtle)] transition-colors">
                      <td className="px-6 py-3 text-xs font-medium text-[var(--color-fg-muted)] tabular-nums">{index + 1}</td>
                      <td className="px-6 py-3">
                        <span className="text-sm font-medium text-[var(--color-fg)]">{asgn.assignmentTitle}</span>
                      </td>
                      {sprints.length > 0 && !sprintFilter && (
                        <td className="px-6 py-3 text-sm text-[var(--color-fg-muted)]">{asgn.sprintName || '—'}</td>
                      )}
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-[var(--color-fg-muted)]">{asgn.views.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-[var(--color-fg-muted)]">{asgn.uniqueSessions.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-[var(--color-fg-muted)]">{asgn.mediaPlays.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-[var(--color-fg-muted)]">{asgn.completions.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-2 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[var(--color-fg-muted)] tabular-nums w-8">{rate}%</span>
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

// ─── Shared sub-components ──────────────────────────────────────────────────────

const colorMap = {
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-500/20' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500/20' },
}

function StatCard({
  title,
  value,
  icon,
  color = 'indigo',
  suffix,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color?: keyof typeof colorMap
  suffix?: string
}) {
  const c = colorMap[color]
  return (
    <div className="group rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-hover)]">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] ${c.bg} ${c.text} ring-1 ${c.ring} transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--color-fg-muted)]">{title}</p>
          <p className="text-xl font-bold text-[var(--color-fg)] tabular-nums">
            {value.toLocaleString()}
            {suffix}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Charts ─────────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; views: number; uniqueSessions: number }[] }) {
  const maxViews = Math.max(...data.map((d) => d.views), 1)
  const displayData = data.slice(-21)
  return (
    <div className="h-64">
      <div className="flex h-full items-end gap-1">
        {displayData.map((day, i) => {
          const height = (day.views / maxViews) * 100
          return (
            <div key={day.date} className="group relative flex-1 min-w-[8px]" style={{ animationDelay: `${i * 20}ms` }}>
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all duration-200 hover:from-indigo-600 hover:to-indigo-500 animate-slide-up origin-bottom cursor-pointer"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-10">
                <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                  <div className="font-semibold">{fmtDate(day.date)}</div>
                  <div className="mt-1">{day.views} views · {day.uniqueSessions} sessions</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium text-[var(--color-fg-muted)]">
        <span>{fmtDate(displayData[0]?.date || '')}</span>
        <span>{fmtDate(displayData[displayData.length - 1]?.date || '')}</span>
      </div>
    </div>
  )
}

function LineChart({ data }: { data: { date: string; views: number; uniqueSessions: number }[] }) {
  const displayData = data.slice(-30)
  const maxVal = Math.max(...displayData.map((d) => Math.max(d.views, d.uniqueSessions)), 1)
  const w = 100, h = 100, p = 5
  const pt = (v: number, i: number, t: number) => ({ x: p + ((w - p * 2) / (t - 1)) * i, y: h - p - (v / maxVal) * (h - p * 2) })
  const path = (key: 'views' | 'uniqueSessions') =>
    displayData.map((d, i) => { const { x, y } = pt(d[key], i, displayData.length); return `${i === 0 ? 'M' : 'L'} ${x} ${y}` }).join(' ')

  return (
    <div className="h-64 relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((pct) => (
          <line key={pct} x1={p} y1={h - p - (pct / 100) * (h - p * 2)} x2={w - p} y2={h - p - (pct / 100) * (h - p * 2)} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.3} />
        ))}
        <path d={path('uniqueSessions')} fill="none" stroke="#10b981" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path('views')} fill="none" stroke="#6366f1" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="absolute top-2 right-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 rounded-full" /><span className="text-[var(--color-fg-muted)]">Views</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 rounded-full" /><span className="text-[var(--color-fg-muted)]">Sessions</span></div>
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium text-[var(--color-fg-muted)]">
        <span>{fmtDate(displayData[0]?.date || '')}</span>
        <span>{fmtDate(displayData[displayData.length - 1]?.date || '')}</span>
      </div>
    </div>
  )
}

function AreaChart({ data }: { data: { date: string; views: number; uniqueSessions: number }[] }) {
  const displayData = data.slice(-30)
  const maxViews = Math.max(...displayData.map((d) => d.views), 1)
  const w = 100, h = 100, p = 5
  const pt = (v: number, i: number) => ({ x: p + ((w - p * 2) / (displayData.length - 1)) * i, y: h - p - (v / maxViews) * (h - p * 2) })
  const linePath = displayData.map((d, i) => { const { x, y } = pt(d.views, i); return `${i === 0 ? 'M' : 'L'} ${x} ${y}` }).join(' ')
  const first = pt(displayData[0]?.views || 0, 0)
  const last = pt(displayData[displayData.length - 1]?.views || 0, displayData.length - 1)
  const areaPath = `${linePath} L ${last.x} ${h - p} L ${first.x} ${h - p} Z`

  return (
    <div className="h-64 relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradientChallenge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((pct) => (
          <line key={pct} x1={p} y1={h - p - (pct / 100) * (h - p * 2)} x2={w - p} y2={h - p - (pct / 100) * (h - p * 2)} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.3} />
        ))}
        <path d={areaPath} fill="url(#areaGradientChallenge)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-[var(--color-fg-muted)]">
        <span>{maxViews.toLocaleString()}</span>
        <span>{Math.round(maxViews / 2).toLocaleString()}</span>
        <span>0</span>
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium text-[var(--color-fg-muted)]">
        <span>{fmtDate(displayData[0]?.date || '')}</span>
        <span>{fmtDate(displayData[displayData.length - 1]?.date || '')}</span>
      </div>
    </div>
  )
}

function fmtDate(s: string) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-[var(--color-bg-muted)] rounded-[var(--radius-lg)]">
          {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-24 rounded-[var(--radius-md)] skeleton" />)}
        </div>
        <div className="h-10 w-32 rounded-[var(--radius-lg)] skeleton" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => <div key={i} className="h-[76px] rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 skeleton" />)}
      </div>
      <div className="h-80 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 skeleton" />
      <div className="h-64 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 skeleton" />
    </div>
  )
}

// ─── Completion Drop-off chart ───────────────────────────────────────────────────

function DropOffChart({ assignments }: { assignments: AssignmentStats[] }) {
  const maxCompletions = Math.max(...assignments.map((a) => a.completions), 1)
  const maxViews = Math.max(...assignments.map((a) => a.views), 1)
  const maxVal = Math.max(maxCompletions, maxViews, 1)
  const count = assignments.length
  const w = 100, h = 60, px = 8, py = 5

  const pt = (value: number, index: number) => ({
    x: px + ((w - px * 2) / Math.max(count - 1, 1)) * index,
    y: h - py - (value / maxVal) * (h - py * 2),
  })

  const viewsPath = assignments.map((a, i) => {
    const { x, y } = pt(a.views, i)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const completionsPath = assignments.map((a, i) => {
    const { x, y } = pt(a.completions, i)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Area fill for completions
  const firstPt = pt(assignments[0]?.completions ?? 0, 0)
  const lastPt = pt(assignments[count - 1]?.completions ?? 0, count - 1)
  const completionsArea = `${completionsPath} L ${lastPt.x} ${h - py} L ${firstPt.x} ${h - py} Z`

  // Drop-off summary
  const firstCompletions = assignments[0]?.completions ?? 0
  const lastCompletions = assignments[count - 1]?.completions ?? 0
  const dropPct = firstCompletions > 0
    ? Math.round(((firstCompletions - lastCompletions) / firstCompletions) * 100)
    : 0

  return (
    <div>
      {/* Summary stats */}
      <div className="flex items-center gap-6 mb-4 mt-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--color-fg)] tabular-nums">{firstCompletions}</p>
          <p className="text-xs text-[var(--color-fg-muted)]">First assignment</p>
        </div>
        <div className="flex items-center gap-1 text-[var(--color-fg-muted)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--color-fg)] tabular-nums">{lastCompletions}</p>
          <p className="text-xs text-[var(--color-fg-muted)]">Last assignment</p>
        </div>
        {dropPct > 0 && (
          <div className="ml-auto rounded-[var(--radius-lg)] bg-red-50 dark:bg-red-500/10 px-3 py-1.5">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
              {dropPct}% drop-off
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-56 relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dropoffGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line
              key={pct}
              x1={px} y1={h - py - (pct / 100) * (h - py * 2)}
              x2={w - px} y2={h - py - (pct / 100) * (h - py * 2)}
              stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.2}
            />
          ))}
          {/* Completions area */}
          <path d={completionsArea} fill="url(#dropoffGrad)" />
          {/* Views line */}
          <path d={viewsPath} fill="none" stroke="#6366f1" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1.5 1" />
          {/* Completions line */}
          <path d={completionsPath} fill="none" stroke="#10b981" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
          {/* Data points for completions */}
          {assignments.map((a, i) => {
            const { x, y } = pt(a.completions, i)
            return <circle key={a.assignmentId} cx={x} cy={y} r={0.8} fill="#10b981" />
          })}
        </svg>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-[var(--color-fg-muted)] pointer-events-none">
          <span>{maxVal.toLocaleString()}</span>
          <span>{Math.round(maxVal / 2).toLocaleString()}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-[var(--color-fg-muted)] mt-1 px-2">
        <span className="truncate max-w-[120px]" title={assignments[0]?.assignmentTitle}>
          1. {assignments[0]?.assignmentTitle}
        </span>
        {count > 2 && (
          <span className="text-center truncate max-w-[120px]" title={assignments[Math.floor(count / 2)]?.assignmentTitle}>
            {Math.floor(count / 2) + 1}. {assignments[Math.floor(count / 2)]?.assignmentTitle}
          </span>
        )}
        <span className="truncate max-w-[120px] text-right" title={assignments[count - 1]?.assignmentTitle}>
          {count}. {assignments[count - 1]?.assignmentTitle}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 text-xs text-[var(--color-fg-muted)]">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #6366f1, #6366f1 3px, transparent 3px, transparent 6px)' }} />
          Views
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-emerald-500 rounded-full" />
          Completions
        </div>
      </div>
    </div>
  )
}

// ─── Icons ──────────────────────────────────────────────────────────────────────

function EyeIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>)
}
function FileIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>)
}
function PlayIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>)
}
function CheckCircleIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>)
}
function PercentIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m6.75 17.25 10.5-10.5M6.75 8.25a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM17.25 18.75a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" /></svg>)
}
function DocIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>)
}
function DownloadIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>)
}
function BarChartIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>)
}
function LineChartIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>)
}
function AreaChartIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" /></svg>)
}
