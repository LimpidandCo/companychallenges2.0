'use client'

import { useState } from 'react'
import { Button, Badge, Spinner } from '@/components/ui'
import { deleteAnnouncement, toggleAnnouncementPinned } from '@/lib/actions/announcements'
import type { Announcement } from '@/lib/types/database'

interface AnnouncementListProps {
  announcements: Announcement[]
  onEdit: (announcement: Announcement) => void
  onRefresh: () => void
}

export function AnnouncementList({ announcements, onEdit, onRefresh }: AnnouncementListProps) {
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`Delete "${announcement.title}"? This cannot be undone.`)) {
      return
    }

    setActionId(announcement.id)
    setError(null)

    try {
      const result = await deleteAnnouncement(announcement.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to delete announcement')
      }
    } catch (err) {
      setError('Failed to delete announcement')
    } finally {
      setActionId(null)
    }
  }

  const handleTogglePin = async (announcement: Announcement) => {
    setActionId(announcement.id)
    setError(null)

    try {
      const result = await toggleAnnouncementPinned(announcement.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to update pin status')
      }
    } catch (err) {
      setError('Failed to update pin status')
    } finally {
      setActionId(null)
    }
  }

  const isExpired = (announcement: Announcement) => {
    return announcement.expires_at && new Date(announcement.expires_at) < new Date()
  }

  const isScheduled = (announcement: Announcement) => {
    return new Date(announcement.published_at) > new Date()
  }

  if (announcements.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-2">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="flex items-start justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 hover:bg-[var(--color-bg-subtle)]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[var(--color-fg)] truncate">
                  {announcement.title}
                </span>
                {announcement.is_pinned && (
                  <Badge variant="success">Pinned</Badge>
                )}
                {isScheduled(announcement) && (
                  <Badge variant="warning">Scheduled</Badge>
                )}
                {isExpired(announcement) && (
                  <Badge variant="outline">Expired</Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-[var(--color-fg-muted)] line-clamp-2"
                dangerouslySetInnerHTML={{
                  __html: stripHtml(announcement.content).slice(0, 150) + (announcement.content.length > 150 ? '...' : '')
                }}
              />
              <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-fg-subtle)]">
                <span>
                  Published: {formatDate(announcement.published_at)}
                </span>
                {announcement.expires_at && (
                  <span>
                    Expires: {formatDate(announcement.expires_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTogglePin(announcement)}
                disabled={actionId === announcement.id}
                title={announcement.is_pinned ? 'Unpin' : 'Pin to top'}
              >
                <PinIcon className={`h-4 w-4 ${announcement.is_pinned ? 'text-[var(--color-primary)]' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(announcement)}
                disabled={actionId === announcement.id}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(announcement)}
                disabled={actionId === announcement.id}
                className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
              >
                {actionId === announcement.id ? <Spinner size="sm" /> : 'Delete'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}
