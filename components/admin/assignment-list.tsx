'use client'

import { useState } from 'react'
import { Button, Badge, Spinner, Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui'
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
  // Two-step delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<AssignmentWithUsages | null>(null)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Step 1: Show first confirmation
  const handleDeleteClick = (assignment: AssignmentWithUsages) => {
    const usageCount = assignment.assignment_usages?.length ?? 0
    if (usageCount > 0) {
      setError(`Cannot delete "${assignment.internal_title}" - it's used in ${usageCount} challenge(s). Remove it from all challenges first.`)
      return
    }
    setDeleteTarget(assignment)
    setDeleteStep(1)
  }

  // Step 2: Confirm permanent deletion
  const handleDeleteConfirm = () => {
    setDeleteStep(2)
  }

  // Final: Execute deletion
  const handleDeleteFinal = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteAssignment(deleteTarget.id)
      if (result.success) {
        setDeleteTarget(null)
        setDeleteStep(1)
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to delete assignment')
        setDeleteTarget(null)
        setDeleteStep(1)
      }
    } catch (err) {
      setError('Failed to delete assignment')
      setDeleteTarget(null)
      setDeleteStep(1)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTarget(null)
    setDeleteStep(1)
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
                        onClick={() => handleDeleteClick(assignment)}
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

      {/* Two-Step Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onClose={handleDeleteCancel}>
        <DialogHeader>
          <DialogTitle className="text-red-600">
            {deleteStep === 1 ? 'Delete Assignment?' : 'Confirm Permanent Deletion'}
          </DialogTitle>
          <DialogDescription>
            {deleteTarget?.internal_title}
          </DialogDescription>
        </DialogHeader>

        <DialogContent>
          {deleteStep === 1 ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <div className="flex gap-3">
                  <WarningIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">This will permanently delete this assignment.</p>
                    <p className="mt-1">All content, settings, and media will be removed.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Are you sure you want to proceed?
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex gap-3">
                  <TrashIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">This action cannot be undone.</p>
                    <p className="mt-1">The assignment "{deleteTarget?.internal_title}" will be permanently deleted.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogFooter>
          <Button variant="secondary" onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          {deleteStep === 1 ? (
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Yes, Delete
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleDeleteFinal} disabled={isDeleting}>
              {isDeleting ? <Spinner size="sm" className="mr-2" /> : null}
              Permanently Delete
            </Button>
          )}
        </DialogFooter>
      </Dialog>
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

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.38 3.375 2.07 3.375h14.092c1.69 0 2.936-1.875 2.069-3.375L12.707 5.625c-.546-.956-1.953-.956-2.499 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}
