'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@/components/ui'
import { createSprint, updateSprint } from '@/lib/actions/sprints'
import type { Sprint, SprintInsert, SprintUpdate } from '@/lib/types/database'

interface SprintFormProps {
  challengeId: string
  sprint?: Sprint | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SprintForm({ challengeId, sprint, open, onClose, onSuccess }: SprintFormProps) {
  const isEditing = !!sprint
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(sprint?.name ?? '')
  const [description, setDescription] = useState(sprint?.description ?? '')
  const [introVideoUrl, setIntroVideoUrl] = useState(sprint?.intro_video_url ?? '')
  const [recapVideoUrl, setRecapVideoUrl] = useState(sprint?.recap_video_url ?? '')
  const [startsAt, setStartsAt] = useState(sprint?.starts_at?.slice(0, 16) ?? '')
  const [endsAt, setEndsAt] = useState(sprint?.ends_at?.slice(0, 16) ?? '')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(sprint?.name ?? '')
      setDescription(sprint?.description ?? '')
      setIntroVideoUrl(sprint?.intro_video_url ?? '')
      setRecapVideoUrl(sprint?.recap_video_url ?? '')
      setStartsAt(sprint?.starts_at?.slice(0, 16) ?? '')
      setEndsAt(sprint?.ends_at?.slice(0, 16) ?? '')
      setError(null)
    }
  }, [open, sprint])

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isEditing && sprint) {
        const update: SprintUpdate = {
          name: name.trim(),
          description: description.trim() || null,
          intro_video_url: introVideoUrl.trim() || null,
          recap_video_url: recapVideoUrl.trim() || null,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        }

        const result = await updateSprint(sprint.id, update)

        if (result.success) {
          onSuccess()
          handleClose()
        } else {
          setError(result.error)
        }
      } else {
        const input: SprintInsert = {
          challenge_id: challengeId,
          name: name.trim(),
          description: description.trim() || null,
          intro_video_url: introVideoUrl.trim() || null,
          recap_video_url: recapVideoUrl.trim() || null,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        }

        const result = await createSprint(input)

        if (result.success) {
          onSuccess()
          handleClose()
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Sprint' : 'Create Sprint'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the sprint details below.'
              : 'Create a new sprint to group assignments into themed phases.'}
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Sprint Name <span className="text-[var(--color-error)]">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Week 1: Getting Started"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this sprint covers..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Intro Video URL
              </label>
              <Input
                type="url"
                value={introVideoUrl}
                onChange={(e) => setIntroVideoUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                YouTube, Vimeo, or direct video URL
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Recap Video URL
              </label>
              <Input
                type="url"
                value={recapVideoUrl}
                onChange={(e) => setRecapVideoUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                Optional wrap-up video
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Start Date
              </label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                End Date
              </label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SaveIcon className="h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Save Sprint'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
    </svg>
  )
}
