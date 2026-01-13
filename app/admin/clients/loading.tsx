import { SkeletonList } from '@/components/ui'

export default function ClientsLoading() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-32 rounded-lg bg-[var(--color-bg-muted)] animate-pulse mb-2" />
          <div className="h-5 w-64 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-[var(--color-bg-muted)] animate-pulse" />
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-[var(--color-border)] p-6">
        <div className="h-6 w-24 rounded bg-[var(--color-bg-muted)] animate-pulse mb-6" />
        <SkeletonList items={6} />
      </div>
    </div>
  )
}

