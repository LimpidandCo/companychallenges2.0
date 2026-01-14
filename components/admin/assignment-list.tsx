'use client'

import { useState } from 'react'
import { Button, Badge, Spinner } from '@/components/ui'
import { duplicateAssignment, deleteAssignment } from '@/lib/actions/assignments'
import { UsedInDialog } from './used-in-dialog'
import { VariantEditor } from './variant-editor'
import type { AssignmentWithUsages } from '@/lib/types/database'

interface AssignmentListProps {
  assignments: AssignmentWithUsages[]
  onEdit: (assignment: AssignmentWithUsages) => void
  onRefresh: () => void
  onTagClick?: (tag: string) => void
}

const CONTENT_TYPE_BADGES: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }> = {
  standard: { label: 'Standard', variant: 'default' },
  video: { label: 'Video', variant: 'success' },
  quiz: { label: 'Quiz', variant: 'warning' },
  announcement: { label: 'Announcement', variant: 'outline' },
}

export function AssignmentList({ assignments, onEdit, onRefresh, onTagClick }: AssignmentListProps) {
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usedInAssignment, setUsedInAssignment] = useState<AssignmentWithUsages | null>(null)
  const [variantAssignment, setVariantAssignment] = useState<AssignmentWithUsages | null>(null)

  const handleDuplicate = async (assignment: AssignmentWithUsages) => {
    setActionId(assignment.id)
    setError(null)

    try {
      const result = await duplicateAssignment(assignment.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to duplicate assignment')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (assignment: AssignmentWithUsages) => {
    const usageCount = assignment.assignment_usages?.length ?? 0
    if (usageCount > 0) {
      setError(`Cannot delete "${assignment.internal_title}" - it's used in ${usageCount} challenge(s).`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${assignment.internal_title}"? This cannot be undone.`)) {
      return
    }

    setActionId(assignment.id)
    setError(null)

    try {
      const result = await deleteAssignment(assignment.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to delete assignment')
      }
    } catch (err) {
      setError('Failed to delete assignment')
    } finally {
      setActionId(null)
    }
  }

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/a/${slug}`
    navigator.clipboard.writeText(url)
  }

  if (assignments.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
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

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Assignment
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Tags
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Usage
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Password
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-fg-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {assignments.map((assignment) => {
              const usageCount = assignment.assignment_usages?.length ?? 0
              const badge = CONTENT_TYPE_BADGES[assignment.content_type] ?? CONTENT_TYPE_BADGES.standard

              return (
                <tr key={assignment.id} className="hover:bg-[var(--color-bg-subtle)]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[var(--color-fg)]">
                        {assignment.internal_title}
                      </p>
                      {assignment.public_title && (
                        <p className="text-xs text-[var(--color-fg-subtle)]">
                          {assignment.public_title}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {assignment.tags && assignment.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignment.tags.slice(0, 3).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => onTagClick?.(tag)}
                            className="inline-flex items-center rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                        {assignment.tags.length > 3 && (
                          <span className="text-xs text-[var(--color-fg-subtle)]">
                            +{assignment.tags.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--color-fg-subtle)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {usageCount === 0 ? (
                      <span className="text-sm text-[var(--color-fg-subtle)]">Unused</span>
                    ) : (
                      <button
                        onClick={() => setUsedInAssignment(assignment)}
                        className="text-sm text-[var(--color-accent)] hover:underline"
                      >
                        {usageCount} challenge{usageCount !== 1 ? 's' : ''}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {assignment.password_hash ? (
                      <Badge variant="warning">Protected</Badge>
                    ) : (
                      <span className="text-sm text-[var(--color-fg-subtle)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyUrl(assignment.slug)}
                        title="Copy URL"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVariantAssignment(assignment)}
                        title="Manage variants"
                      >
                        Variants
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(assignment)}
                        disabled={actionId === assignment.id}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(assignment)}
                        disabled={actionId === assignment.id}
                      >
                        {actionId === assignment.id ? <Spinner size="sm" /> : 'Duplicate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(assignment)}
                        disabled={actionId === assignment.id || usageCount > 0}
                        className={usageCount === 0 ? 'text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]' : ''}
                        title={usageCount > 0 ? 'Remove from all challenges first' : 'Delete assignment'}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Used In Dialog */}
      {usedInAssignment && (
        <UsedInDialog
          assignment={usedInAssignment}
          onClose={() => setUsedInAssignment(null)}
        />
      )}

      {/* Variant Editor */}
      {variantAssignment && (
        <VariantEditor
          assignment={variantAssignment}
          onClose={() => setVariantAssignment(null)}
        />
      )}
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
