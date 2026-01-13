import { Skeleton } from '@/components/ui'

export default function SettingsLoading() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-56" />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="p-6 space-y-6">
              {/* Profile picture area */}
              <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>

              <div className="h-px bg-[var(--color-border)]" />

              {/* Form fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>

              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

