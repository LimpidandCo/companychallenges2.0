import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

export default function AdminDashboard() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Dashboard</h1>
        <p className="mt-1 text-[var(--color-fg-muted)]">
          Welcome to Company Challenges admin panel.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Clients</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--color-fg-muted)]">Organizations using the platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Challenges</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--color-fg-muted)]">Learning trajectories available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assignments</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--color-fg-muted)]">Reusable content units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--color-fg-muted)]">Challenge views</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickAction
              title="Create a Client"
              description="Add a new organization to the platform"
              href="/admin/clients/new"
            />
            <QuickAction
              title="Create a Challenge"
              description="Start building a new learning trajectory"
              href="/admin/challenges/new"
            />
            <QuickAction
              title="Create an Assignment"
              description="Add reusable content to the library"
              href="/admin/assignments/new"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest changes in the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-fg-muted)]">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickAction({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-bg-subtle)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <div>
        <p className="font-medium text-[var(--color-fg)]">{title}</p>
        <p className="text-sm text-[var(--color-fg-muted)]">{description}</p>
      </div>
    </a>
  )
}

