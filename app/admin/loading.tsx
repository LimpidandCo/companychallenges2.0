import { SkeletonCard } from '@/components/ui'

export default function AdminLoading() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
          <div className="h-8 w-48 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
        </div>
        <div className="h-5 w-72 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
      </div>

      {/* Stats Grid skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Two Column Layout skeleton */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <div className="h-6 w-32 rounded bg-[var(--color-bg-muted)] animate-pulse" />
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-5">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--color-bg-muted)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-[var(--color-bg-muted)] animate-pulse" />
                    <div className="h-3 w-48 rounded bg-[var(--color-bg-muted)] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[var(--color-border)] p-6">
            <div className="h-6 w-40 rounded bg-[var(--color-bg-muted)] animate-pulse mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[var(--color-bg-muted)] animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-24 rounded bg-[var(--color-bg-muted)] animate-pulse" />
                    <div className="h-3 w-16 rounded bg-[var(--color-bg-muted)] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

