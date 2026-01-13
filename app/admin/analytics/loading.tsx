import { SkeletonCard } from '@/components/ui'

export default function AnalyticsLoading() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-32 rounded-lg bg-[var(--color-bg-muted)] animate-pulse mb-2" />
        <div className="h-5 w-56 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-8">
        <div className="h-10 w-40 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
        <div className="h-10 w-40 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] p-6">
          <div className="h-6 w-32 rounded bg-[var(--color-bg-muted)] animate-pulse mb-4" />
          <div className="h-64 rounded-xl bg-[var(--color-bg-muted)] animate-pulse" />
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] p-6">
          <div className="h-6 w-32 rounded bg-[var(--color-bg-muted)] animate-pulse mb-4" />
          <div className="h-64 rounded-xl bg-[var(--color-bg-muted)] animate-pulse" />
        </div>
      </div>
    </div>
  )
}

