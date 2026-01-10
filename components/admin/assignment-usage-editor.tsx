'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  Spinner,
} from '@/components/ui'
import { updateAssignmentUsage } from '@/lib/actions/assignment-usages'
import type { AssignmentUsageWithAssignment } from '@/lib/types/database'

interface AssignmentUsageEditorProps {
  usage: AssignmentUsageWithAssignment | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AssignmentUsageEditor({
  usage,
  open,
  onClose,
  onSuccess,
}: AssignmentUsageEditorProps) {
  const [label, setLabel] = useState(usage?.label ?? '')
  const [releaseAt, setReleaseAt] = useState(
    usage?.release_at ? formatDateTimeLocal(usage.release_at) : ''
  )
  const [isVisible, setIsVisible] = useState(usage?.is_visible ?? true)
  const [isMilestone, setIsMilestone] = useState(usage?.is_milestone ?? false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when usage changes
  if (usage && open) {
    if (label !== (usage.label ?? '') && !isSubmitting) {
      setLabel(usage.label ?? '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usage) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateAssignmentUsage(usage.id, {
        label: label || null,
        release_at: releaseAt ? new Date(releaseAt).toISOString() : null,
        is_visible: isVisible,
        is_milestone: isMilestone,
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!usage) return null

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Edit Assignment Settings</DialogTitle>
          <DialogDescription>
            Configure how "{usage.assignment.internal_title}" appears in this challenge.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <Input
            label="Custom Label"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Week 1, Day 3"
            hint="Optional label shown in the challenge overview."
          />

          <Input
            label="Release Date"
            name="release_at"
            type="datetime-local"
            value={releaseAt}
            onChange={(e) => setReleaseAt(e.target.value)}
            hint="Leave empty for immediate availability."
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)]"
              />
              <span className="text-[var(--color-fg)]">Visible to participants</span>
            </label>
            <p className="text-xs text-[var(--color-fg-muted)] ml-6">
              Hidden assignments are not shown in the challenge overview.
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isMilestone}
                onChange={(e) => setIsMilestone(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)]"
              />
              <span className="text-[var(--color-fg)]">Mark as milestone</span>
            </label>
            <p className="text-xs text-[var(--color-fg-muted)] ml-6">
              Milestones celebrate participant completion.
            </p>
          </div>

          {releaseAt && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-sm">
              <p className="font-medium text-[var(--color-fg)]">Pre-release behavior:</p>
              <p className="text-[var(--color-fg-muted)] mt-1">
                {isVisible
                  ? `Participants will see "Available on ${formatDisplayDate(releaseAt)}" until the release date.`
                  : 'This assignment will remain hidden until you make it visible.'}
              </p>
            </div>
          )}
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            Save Settings
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDisplayDate(dateTimeLocal: string): string {
  const date = new Date(dateTimeLocal)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
