'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { DemoUserButton } from '@/components/admin/demo-user-button'

const navigation = [
  { name: 'Dashboard', href: '/participant', icon: HomeIcon, emoji: '🏠' },
  { name: 'My Challenges', href: '/participant/challenges', icon: FlagIcon, emoji: '🚀' },
  { name: 'Achievements', href: '/participant/achievements', icon: TrophyIcon, emoji: '🏆' },
  { name: 'Settings', href: '/participant/settings', icon: SettingsIcon, emoji: '⚙️' },
]

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] lg:flex">
        {/* Decorative gradient blob */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[var(--color-secondary)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-48 h-48 bg-[var(--color-tertiary)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex h-20 items-center border-b border-[var(--color-border)] px-6">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[var(--color-fg)]">Company Challenges</span>
            <span className="text-xs text-[var(--color-fg-subtle)]">Participant Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 p-5 pt-6">
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-fg-subtle)]">
            Navigation
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/participant' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[var(--color-secondary-subtle)] text-[var(--color-secondary)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-fg)]'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-[var(--color-secondary)]" />
                )}

                {/* Icon with hover effect */}
                <span className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-[var(--color-secondary)] text-white shadow-sm'
                    : 'bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)] group-hover:bg-[var(--color-secondary-subtle)] group-hover:text-[var(--color-secondary)]'
                )}>
                  <item.icon className="h-4 w-4" />
                </span>

                <span className="flex-1">{item.name}</span>

                {/* Hover arrow */}
                {!isActive && (
                  <ChevronIcon className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 text-[var(--color-fg-subtle)]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Motivational Card */}
        <div className="mx-5 mb-5 p-4 rounded-2xl bg-[var(--gradient-subtle)] border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">💪</span>
            <span className="text-xs font-semibold text-[var(--color-fg)]">Keep Going!</span>
          </div>
          <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
            Every step forward counts. Complete assignments to unlock achievements and build your skills.
          </p>
        </div>

        {/* Footer - User Menu */}
        <div className="border-t border-[var(--color-border)] p-4">
          <div className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--color-bg-muted)] cursor-pointer">
            <DemoUserButton afterSignOutUrl="/" />
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold text-[var(--color-fg)]">My Account</p>
              <p className="text-xs text-[var(--color-fg-muted)]">Profile & Settings</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-md px-4 lg:hidden">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)] transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="text-base font-bold text-[var(--color-fg)]">Company Challenges</span>
      </header>

      {/* Main content */}
      <main className="flex-1 lg:pl-72">
        <div className="min-h-screen pt-16 lg:pt-0">
          {/* Mesh gradient background */}
          <div className="fixed inset-0 pointer-events-none mesh-gradient opacity-50" />
          <div className="relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

// Icons
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}
