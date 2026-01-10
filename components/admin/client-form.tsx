'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Select,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  Spinner,
} from '@/components/ui'
import { createClient, updateClient } from '@/lib/actions/clients'
import type { Client, ClientFeatures } from '@/lib/types/database'

interface ClientFormProps {
  client?: Client | null
  open: boolean
  onClose: () => void
  onSuccess?: (client: Client) => void
}

const MODE_OPTIONS = [
  { value: 'collective', label: 'Collective (Anonymous)' },
  { value: 'individual', label: 'Individual (Authenticated)' },
  { value: 'hybrid', label: 'Hybrid (Both)' },
]

const FEATURE_LABELS: Record<keyof ClientFeatures, string> = {
  announcements: 'Announcements',
  host_videos: 'Host Videos',
  sprint_structure: 'Sprint Structure',
  collective_progress: 'Collective Progress',
  time_based_unlocks: 'Time-Based Unlocks',
  milestones: 'Milestones',
  reveal_moments: 'Reveal Moments',
  micro_quizzes: 'Micro Quizzes',
  progress_tracking: 'Progress Tracking',
  session_persistence: 'Session Persistence',
  private_views: 'Private Views',
}

export function ClientForm({ client, open, onClose, onSuccess }: ClientFormProps) {
  const isEditing = !!client

  const [name, setName] = useState(client?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(client?.logo_url ?? '')
  const [mode, setMode] = useState<'collective' | 'individual' | 'hybrid'>(
    client?.mode ?? 'collective'
  )
  const [features, setFeatures] = useState<ClientFeatures>(
    client?.features ?? {
      announcements: false,
      host_videos: false,
      sprint_structure: false,
      collective_progress: false,
      time_based_unlocks: false,
      milestones: false,
      reveal_moments: false,
      micro_quizzes: false,
      progress_tracking: false,
      session_persistence: false,
      private_views: false,
    }
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = isEditing
        ? await updateClient(client.id, { name, logo_url: logoUrl || null, mode, features })
        : await createClient({ name, logo_url: logoUrl || null, mode, features })

      if (result.success) {
        onSuccess?.(result.data)
        onClose()
        // Reset form for next use
        if (!isEditing) {
          setName('')
          setLogoUrl('')
          setMode('collective')
          setFeatures({
            announcements: false,
            host_videos: false,
            sprint_structure: false,
            collective_progress: false,
            time_based_unlocks: false,
            milestones: false,
            reveal_moments: false,
            micro_quizzes: false,
            progress_tracking: false,
            session_persistence: false,
            private_views: false,
          })
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFeature = (key: keyof ClientFeatures) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Client' : 'Add Client'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the client organization details.'
              : 'Create a new client organization.'}
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <Input
            label="Client Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corporation"
            required
          />

          <Input
            label="Logo URL"
            name="logo_url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            hint="Optional. Direct URL to the client's logo image."
          />

          <Select
            label="Mode"
            name="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            options={MODE_OPTIONS}
            hint="How participants will access challenges."
          />

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-fg)]">
              Feature Flags
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FEATURE_LABELS) as Array<keyof ClientFeatures>).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-2 text-sm hover:bg-[var(--color-bg-subtle)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={features[key]}
                    onChange={() => toggleFeature(key)}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)]"
                  />
                  <span className="text-[var(--color-fg)]">{FEATURE_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            {isEditing ? 'Save Changes' : 'Create Client'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
