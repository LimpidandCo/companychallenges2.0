'use client'

import { useState, useEffect, useTransition } from 'react'
import { useUser, useClerk, useAuth } from '@clerk/nextjs'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

type TabId = 'profile' | 'security' | 'notifications' | 'appearance' | 'danger'

const TABS: { id: TabId; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'profile', label: 'Profile', icon: <UserIcon />, description: 'Your personal information' },
  { id: 'security', label: 'Security', icon: <ShieldIcon />, description: 'Password and authentication' },
  { id: 'notifications', label: 'Notifications', icon: <BellIcon />, description: 'Email and alert preferences' },
  { id: 'appearance', label: 'Appearance', icon: <PaletteIcon />, description: 'Theme and display options' },
  { id: 'danger', label: 'Danger Zone', icon: <AlertIcon />, description: 'Account deletion' },
]

export function SettingsClient() {
  const { user, isLoaded: userLoaded } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const { isSignedIn } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [isPending, startTransition] = useTransition()

  // Local state for editable fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Notification preferences (local only - would need backend)
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    challengeUpdates: true,
    newAssignments: true,
    weeklyReport: false,
  })

  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [compactMode, setCompactMode] = useState(false)

  // Sync user data when loaded
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      await user.update({
        firstName,
        lastName,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = () => {
    startTransition(() => {
      signOut({ redirectUrl: '/' })
    })
  }

  // Loading state
  if (!userLoaded) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // Not signed in state
  if (!isSignedIn || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-warning-subtle)]">
              <span className="text-4xl">🔐</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-fg)] mb-2">Sign in required</h2>
            <p className="text-[var(--color-fg-muted)] mb-6">
              Please sign in to access your settings
            </p>
            <Button onClick={() => window.location.href = '/sign-in'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">Settings</h1>
        <p className="text-[var(--color-fg-muted)]">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
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

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || 'Profile'}
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-[var(--color-border)]"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-2xl font-bold text-white">
                        {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => openUserProfile()}
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors shadow-sm"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-fg)]">{user.fullName || 'Anonymous'}</h3>
                    <p className="text-sm text-[var(--color-fg-muted)]">{user.primaryEmailAddress?.emailAddress}</p>
                    <button
                      onClick={() => openUserProfile()}
                      className="mt-2 text-sm text-[var(--color-accent)] hover:underline"
                    >
                      Manage in Clerk →
                    </button>
                  </div>
                </div>

                <hr className="border-[var(--color-border)]" />

                {/* Name Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-fg)] mb-1.5">Email</label>
                  <div className="h-11 px-3 flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)]">
                    {user.primaryEmailAddress?.emailAddress}
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--color-fg-subtle)]">
                    Email can be changed in{' '}
                    <button onClick={() => openUserProfile()} className="text-[var(--color-accent)] hover:underline">
                      Clerk settings
                    </button>
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4 pt-4">
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  {saveSuccess && (
                    <span className="text-sm text-[var(--color-success)] animate-fade-in">
                      Profile updated successfully
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and authentication methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Section */}
                <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-muted)]">
                        <LockIcon className="h-5 w-5 text-[var(--color-fg-muted)]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--color-fg)]">Password</h4>
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          {user.passwordEnabled ? 'Password is set' : 'No password set (using social login)'}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => openUserProfile()}>
                      {user.passwordEnabled ? 'Change' : 'Set Password'}
                    </Button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-muted)]">
                        <ShieldIcon className="h-5 w-5 text-[var(--color-fg-muted)]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--color-fg)]">Two-Factor Authentication</h4>
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          {user.twoFactorEnabled ? (
                            <span className="text-[var(--color-success)]">✓ Enabled</span>
                          ) : (
                            'Add an extra layer of security'
                          )}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => openUserProfile()}>
                      {user.twoFactorEnabled ? 'Manage' : 'Enable'}
                    </Button>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div>
                  <h4 className="font-semibold text-[var(--color-fg)] mb-3">Connected Accounts</h4>
                  <div className="space-y-2">
                    {user.externalAccounts.length > 0 ? (
                      user.externalAccounts.map((account) => (
                        <div key={account.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)]">
                          <div className="h-8 w-8 rounded-lg bg-[var(--color-bg-muted)] flex items-center justify-center">
                            {account.provider === 'google' && <GoogleIcon />}
                            {account.provider === 'github' && <GithubIcon />}
                            {!['google', 'github'].includes(account.provider) && <LinkIcon className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--color-fg)] capitalize">{account.provider}</p>
                            <p className="text-xs text-[var(--color-fg-muted)]">{account.emailAddress}</p>
                          </div>
                          <span className="text-xs text-[var(--color-success)] bg-[var(--color-success-subtle)] px-2 py-1 rounded-full">
                            Connected
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--color-fg-muted)]">No external accounts connected</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => openUserProfile()}>
                    Manage connections →
                  </Button>
                </div>

                {/* Sessions */}
                <div>
                  <h4 className="font-semibold text-[var(--color-fg)] mb-3">Active Sessions</h4>
                  <p className="text-sm text-[var(--color-fg-muted)] mb-3">
                    You're currently signed in on this device. Manage all sessions in Clerk.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => openUserProfile()}>
                    View All Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
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

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
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

                {/* Compact Mode */}
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

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <Card className="animate-fade-in border-[var(--color-error)]/30">
              <CardHeader>
                <CardTitle className="text-[var(--color-error)]">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sign Out */}
                <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-[var(--color-fg)]">Sign Out</h4>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        Sign out of your account on this device
                      </p>
                    </div>
                    <Button variant="secondary" onClick={handleSignOut} disabled={isPending}>
                      {isPending ? 'Signing out...' : 'Sign Out'}
                    </Button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="p-4 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error-subtle)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-[var(--color-error)]">Delete Account</h4>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button variant="destructive" onClick={() => openUserProfile()}>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Toggle components
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

// Icons
function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
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

function AlertIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

