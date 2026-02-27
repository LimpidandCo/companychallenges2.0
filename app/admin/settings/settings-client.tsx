'use client'

import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

type TabId = 'notifications' | 'appearance'

const TABS: { id: TabId; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'notifications', label: 'Notifications', icon: <BellIcon />, description: 'Email and alert preferences' },
  { id: 'appearance', label: 'Appearance', icon: <PaletteIcon />, description: 'Theme and display options' },
]

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<TabId>('notifications')

  const [notifications, setNotifications] = useState({
    emailDigest: true,
    challengeUpdates: true,
    newAssignments: true,
    weeklyReport: false,
  })

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [compactMode, setCompactMode] = useState(false)

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">Settings</h1>
        <p className="text-[var(--color-fg-muted)]">Manage your preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <nav className="space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-sm'
                  : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-fg)]'
              )}
            >
              <span className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)]'
              )}>
                {tab.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{tab.label}</div>
                <div className="text-xs text-[var(--color-fg-subtle)] truncate">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>

        <div className="lg:col-span-3">
          {activeTab === 'notifications' && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what updates you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationToggle
                  title="Email Digest"
                  description="Receive a daily summary of activity"
                  enabled={notifications.emailDigest}
                  onChange={(enabled) => setNotifications({ ...notifications, emailDigest: enabled })}
                />
                <NotificationToggle
                  title="Challenge Updates"
                  description="Get notified when challenges are modified"
                  enabled={notifications.challengeUpdates}
                  onChange={(enabled) => setNotifications({ ...notifications, challengeUpdates: enabled })}
                />
                <NotificationToggle
                  title="New Assignments"
                  description="Alert when new content is added"
                  enabled={notifications.newAssignments}
                  onChange={(enabled) => setNotifications({ ...notifications, newAssignments: enabled })}
                />
                <NotificationToggle
                  title="Weekly Report"
                  description="Receive analytics summary every week"
                  enabled={notifications.weeklyReport}
                  onChange={(enabled) => setNotifications({ ...notifications, weeklyReport: enabled })}
                />
                
                <div className="pt-4">
                  <p className="text-xs text-[var(--color-fg-subtle)]">
                    Note: These preferences are stored locally. Backend integration coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-fg)] mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                          theme === t
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                        )}
                      >
                        <div className="text-2xl">
                          {t === 'light' && '☀️'}
                          {t === 'dark' && '🌙'}
                          {t === 'system' && '💻'}
                        </div>
                        <span className="text-sm font-medium text-[var(--color-fg)] capitalize">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-[var(--color-border)]" />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-[var(--color-fg)]">Compact Mode</h4>
                    <p className="text-sm text-[var(--color-fg-muted)]">Reduce spacing for denser layouts</p>
                  </div>
                  <ToggleSwitch enabled={compactMode} onChange={setCompactMode} />
                </div>

                <div className="pt-4">
                  <p className="text-xs text-[var(--color-fg-subtle)]">
                    Note: Theme preferences are stored locally. Full support coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string
  description: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
      <div>
        <h4 className="font-medium text-[var(--color-fg)]">{title}</h4>
        <p className="text-sm text-[var(--color-fg-muted)]">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  )
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        enabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-muted)]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          enabled ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

function PaletteIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
    </svg>
  )
}
