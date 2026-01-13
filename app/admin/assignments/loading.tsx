import { SkeletonTable } from '@/components/ui'

export default function AssignmentsLoading() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-40 rounded-lg bg-[var(--color-bg-muted)] animate-pulse mb-2" />
          <div className="h-5 w-64 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-[var(--color-bg-muted)] animate-pulse" />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="h-11 w-full max-w-sm rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
      </div>

      {/* Table */}
      <SkeletonTable rows={8} cols={5} />
    </div>
  )
}

