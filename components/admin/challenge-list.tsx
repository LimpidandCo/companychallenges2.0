'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Badge, Spinner } from '@/components/ui'
import { archiveChallenge, restoreChallenge, duplicateChallenge, deleteChallenge } from '@/lib/actions/challenges'
import type { ChallengeWithClient } from '@/lib/types/database'

interface ChallengeListProps {
  challenges: ChallengeWithClient[]
  onEdit: (challenge: ChallengeWithClient) => void
  onRefresh: () => void
}

export function ChallengeList({ challenges, onEdit, onRefresh }: ChallengeListProps) {
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleArchive = async (challenge: ChallengeWithClient) => {
    setActionId(challenge.id)
    setError(null)

    try {
      const result = challenge.is_archived
        ? await restoreChallenge(challenge.id)
        : await archiveChallenge(challenge.id)

      if (result.success) {
        onRefresh()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to update challenge')
    } finally {
      setActionId(null)
    }
  }

  const handleDuplicate = async (challenge: ChallengeWithClient) => {
    setActionId(challenge.id)
    setError(null)

    try {
      const result = await duplicateChallenge(challenge.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to duplicate challenge')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (challenge: ChallengeWithClient) => {
    if (!confirm(`Are you sure you want to permanently delete "${challenge.internal_name}"? This cannot be undone.`)) {
      return
    }

    setActionId(challenge.id)
    setError(null)

    try {
      const result = await deleteChallenge(challenge.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to delete challenge')
      }
    } catch (err) {
      setError('Failed to delete challenge')
    } finally {
      setActionId(null)
    }
  }

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`
    navigator.clipboard.writeText(url)
  }

  if (challenges.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Challenge
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Client
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Folder
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-fg-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {challenges.map((challenge) => (
              <tr key={challenge.id} className="hover:bg-[var(--color-bg-subtle)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-[var(--radius-sm)]"
                      style={{ backgroundColor: challenge.brand_color || '#6b7280' }}
                    />
                    <div>
                      <p className="font-medium text-[var(--color-fg)]">
                        {challenge.internal_name}
                      </p>
                      {challenge.public_title && (
                        <p className="text-xs text-[var(--color-fg-subtle)]">
                          {challenge.public_title}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--color-fg-muted)]">
                    {challenge.client.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--color-fg-muted)]">
                    {challenge.folder || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={challenge.is_archived ? 'outline' : 'success'}>
                    {challenge.is_archived ? 'Archived' : 'Active'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyUrl(challenge.slug)}
                      title="Copy URL"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/challenges/${challenge.id}`}>
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(challenge)}
                      disabled={actionId === challenge.id}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(challenge)}
                      disabled={actionId === challenge.id}
                    >
                      {actionId === challenge.id ? <Spinner size="sm" /> : 'Duplicate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(challenge)}
                      disabled={actionId === challenge.id}
                    >
                      {challenge.is_archived ? 'Restore' : 'Archive'}
                    </Button>
                    {challenge.is_archived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(challenge)}
                        disabled={actionId === challenge.id}
                        className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  )
}
