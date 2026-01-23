'use client'

import { useState, useEffect } from 'react'
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
  RichTextEditor,
} from '@/components/ui'
import { createAnnouncement, updateAnnouncement } from '@/lib/actions/announcements'
import type { Announcement, AnnouncementInsert } from '@/lib/types/database'

interface AnnouncementFormProps {
  challengeId: string
  announcement?: Announcement | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AnnouncementForm({
  challengeId,
  announcement,
  open,
  onClose,
  onSuccess,
}: AnnouncementFormProps) {
  const isEditing = !!announcement
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [publishedAt, setPublishedAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  // Reset form when announcement changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(announcement?.title ?? '')
      setContent(announcement?.content ?? '')
      setIsPinned(announcement?.is_pinned ?? false)
      setPublishedAt(announcement?.published_at?.slice(0, 16) ?? formatDateTimeLocal(new Date()))
      setExpiresAt(announcement?.expires_at?.slice(0, 16) ?? '')
      setError(null)
    }
  }, [open, announcement])

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isEditing && announcement) {
        const result = await updateAnnouncement(announcement.id, {
          title: title.trim(),
          content: content.trim(),
          is_pinned: isPinned,
          published_at: publishedAt ? new Date(publishedAt).toISOString() : undefined,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        })

        if (result.success) {
          onSuccess()
          handleClose()
        } else {
          setError(result.error)
        }
      } else {
        const input: AnnouncementInsert = {
          challenge_id: challengeId,
          title: title.trim(),
          content: content.trim(),
          is_pinned: isPinned,
          published_at: publishedAt ? new Date(publishedAt).toISOString() : undefined,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }

        const result = await createAnnouncement(input)

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
          <DialogTitle>{isEditing ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the announcement details below.'
              : 'Post an announcement to communicate with participants.'}
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
              Title <span className="text-[var(--color-error)]">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Important Update"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Content <span className="text-[var(--color-error)]">*</span>
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your announcement..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Publish Date
              </label>
              <Input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                When to show the announcement
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Expires
              </label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                Optional auto-hide date
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)]"
                disabled={loading}
              />
              <span className="text-[var(--color-fg)]">Pin to top</span>
            </label>
            <p className="text-xs text-[var(--color-fg-muted)] ml-6">
              Pinned announcements appear first in the list.
            </p>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SaveIcon className="h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Save Announcement'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
    </svg>
  )
}
