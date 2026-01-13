'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Spinner } from '@/components/ui'
import { getCurrentParticipant, updateParticipant } from '@/lib/actions/participants'
import type { Participant } from '@/lib/types/database'

export default function SettingsPage() {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [showInLeaderboard, setShowInLeaderboard] = useState(true)
  const [showProgressPublicly, setShowProgressPublicly] = useState(false)

  useEffect(() => {
    loadParticipant()
  }, [])

  const loadParticipant = async () => {
    setLoading(true)
    try {
      const result = await getCurrentParticipant()
      if (result.success && result.data) {
        setParticipant(result.data)
        setDisplayName(result.data.display_name || '')
        setShowInLeaderboard(result.data.show_in_leaderboard)
        setShowProgressPublicly(result.data.show_progress_publicly)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateParticipant({
        display_name: displayName || null,
        show_in_leaderboard: showInLeaderboard,
        show_progress_publicly: showProgressPublicly,
      })

      if (result.success) {
        setParticipant(result.data)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚙️</span>
          <h1 className="text-3xl font-bold text-[var(--color-fg)] tracking-tight">
            Settings
          </h1>
        </div>
        <p className="text-[var(--color-fg-muted)] text-lg">
          Manage your profile and privacy preferences.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Success message */}
        {success && (
          <div className="p-4 rounded-xl bg-[var(--color-success-subtle)] text-[var(--color-success)] flex items-center gap-2">
            <CheckIcon className="h-5 w-5" />
            Settings saved successfully!
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-error-subtle)] text-[var(--color-error)]">
            {error}
          </div>
        )}

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your display information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-fg)] mb-1.5">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                This name will be shown on leaderboards and achievements.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control your visibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleSetting
              label="Show on Leaderboard"
              description="Allow your name to appear on challenge leaderboards"
              checked={showInLeaderboard}
              onChange={setShowInLeaderboard}
            />
            <ToggleSetting
              label="Public Progress"
              description="Allow others to see your challenge progress"
              checked={showProgressPublicly}
              onChange={setShowProgressPublicly}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="font-medium text-[var(--color-fg)]">{label}</p>
        <p className="text-sm text-[var(--color-fg-muted)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-offset-2 ${
          checked ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-bg-muted)]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
