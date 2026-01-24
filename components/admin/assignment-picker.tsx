'use client'

import { useState, useMemo } from 'react'
import {
  Button,
  Input,
  Badge,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Spinner,
} from '@/components/ui'
import { createAssignmentVersion } from '@/lib/actions/assignments'
import type { AssignmentWithUsages } from '@/lib/types/database'

interface AssignmentPickerProps {
  open: boolean
  onClose: () => void
  assignments: AssignmentWithUsages[]
  challengeId: string
  sprintId?: string | null
  onSelect: (assignmentId: string) => void // For linking existing assignment
  loading?: boolean
}

const CONTENT_TYPE_BADGES: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }> = {
  standard: { label: 'Standard', variant: 'default' },
  video: { label: 'Video', variant: 'success' },
  quiz: { label: 'Quiz', variant: 'warning' },
  announcement: { label: 'Announcement', variant: 'outline' },
}

const VERSION_LABELS = [
  'Version',
  'English version',
  'French version',
  'Dutch version',
  'German version',
  'Beginner version',
  'Advanced version',
  'Short version',
  'Extended version',
]

type Step = 'select' | 'choose-action'

export function AssignmentPicker({
  open,
  onClose,
  assignments,
  challengeId,
  sprintId,
  onSelect,
  loading = false,
}: AssignmentPickerProps) {
  const [step, setStep] = useState<Step>('select')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [versionLabel, setVersionLabel] = useState('Version')
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)

  const selectedAssignment = useMemo(() =>
    assignments.find((a) => a.id === selectedId),
    [assignments, selectedId]
  )

  const filteredAssignments = useMemo(() => {
    // Only show reusable assignments in the library picker
    const reusable = assignments.filter((a) => a.is_reusable !== false)

    if (!searchQuery) return reusable

    const query = searchQuery.toLowerCase()
    return reusable.filter(
      (a) =>
        a.internal_title.toLowerCase().includes(query) ||
        a.public_title?.toLowerCase().includes(query) ||
        // Also search by tags
        (a.tags && a.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }, [assignments, searchQuery])

  const handleSelect = (id: string) => {
    setSelectedId(id)
  }

  const handleContinue = () => {
    if (selectedId) {
      setStep('choose-action')
    }
  }

  const handleLink = () => {
    if (selectedId) {
      onSelect(selectedId)
      // Close dialog - parent's onSelect handler will refresh the page
      handleClose()
    }
  }

  const handleCreateVersion = async () => {
    if (!selectedId) return

    setIsCreatingVersion(true)
    try {
      const result = await createAssignmentVersion(
        selectedId,
        challengeId,
        versionLabel,
        sprintId
      )

      if (result.success) {
        handleClose()
        // Refresh will be triggered by parent
        window.location.reload()
      } else {
        console.error('Failed to create version:', result.error)
      }
    } catch (err) {
      console.error('Error creating version:', err)
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedId(null)
    setStep('select')
    setVersionLabel('Version')
    onClose()
  }

  const handleBack = () => {
    setStep('select')
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      {step === 'select' && (
        <>
          <DialogHeader>
            <DialogTitle>Pick from Library</DialogTitle>
            <DialogDescription>
              Select an assignment from your library to add to this challenge.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Input
              type="search"
              placeholder="Search by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="max-h-[300px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
              {filteredAssignments.length > 0 ? (
                <div className="divide-y divide-[var(--color-border)]">
                  {filteredAssignments.map((assignment) => {
                    const badge = CONTENT_TYPE_BADGES[assignment.content_type] ?? CONTENT_TYPE_BADGES.standard
                    const usageCount = assignment.assignment_usages?.length ?? 0
                    const isSelected = selectedId === assignment.id

                    return (
                      <button
                        key={assignment.id}
                        type="button"
                        onClick={() => handleSelect(assignment.id)}
                        className={`w-full p-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-[var(--color-primary)] bg-opacity-10'
                            : 'hover:bg-[var(--color-bg-subtle)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                isSelected
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                  : 'border-[var(--color-border)]'
                              }`}
                            >
                              {isSelected && (
                                <CheckIcon className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[var(--color-fg)]">
                                  {assignment.internal_title}
                                </span>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                              {assignment.public_title && (
                                <p className="text-xs text-[var(--color-fg-subtle)]">
                                  {assignment.public_title}
                                </p>
                              )}
                              {assignment.tags && assignment.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {assignment.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                  {assignment.tags.length > 3 && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded">
                                      +{assignment.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-[var(--color-fg-muted)]">
                            {usageCount === 0 ? (
                              <span className="text-[var(--color-fg-subtle)]">Unused</span>
                            ) : (
                              `${usageCount} challenge${usageCount !== 1 ? 's' : ''}`
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex min-h-[150px] items-center justify-center text-[var(--color-fg-muted)]">
                  <div className="text-center">
                    {assignments.length === 0 ? (
                      <>
                        <p className="font-medium">No assignments in library</p>
                        <p className="mt-1 text-sm">
                          Create assignments and save them for future reference.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">No matching assignments</p>
                        <p className="mt-1 text-sm">
                          Try a different search term.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!selectedId || loading}
            >
              Continue
            </Button>
          </DialogFooter>
        </>
      )}

      {step === 'choose-action' && selectedAssignment && (
        <>
          <DialogHeader>
            <DialogTitle>How do you want to use this?</DialogTitle>
            <DialogDescription>
              "{selectedAssignment.internal_title}"
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Link option */}
            <Button
              type="button"
              onClick={handleLink}
              disabled={loading || isCreatingVersion}
              className="w-full rounded-xl border-2 border-[var(--color-border)] p-4 h-auto text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)] justify-start"
              variant="ghost"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="rounded-lg bg-[var(--color-primary)] bg-opacity-10 p-2 shrink-0">
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <LinkIcon className="h-5 w-5 text-[var(--color-primary)]" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-fg)]">Link (shared)</h4>
                  <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                    Use the same assignment. Changes will sync across all challenges using it.
                  </p>
                </div>
              </div>
            </Button>

            {/* Create version option */}
            <div className="rounded-xl border-2 border-[var(--color-border)] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[var(--color-secondary)] bg-opacity-10 p-2">
                  <CopyIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--color-fg)]">Create Version (independent)</h4>
                  <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                    Create an independent copy. Changes won't affect the original.
                  </p>

                  <div className="mt-3">
                    <label className="text-xs font-semibold text-[var(--color-fg-muted)] block mb-1">
                      Version Label
                    </label>
                    <select
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                    >
                      {VERSION_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    className="mt-3"
                    variant="secondary"
                    onClick={handleCreateVersion}
                    disabled={loading || isCreatingVersion}
                  >
                    {isCreatingVersion && <Spinner size="sm" className="mr-2" />}
                    Create Version
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleBack} disabled={loading || isCreatingVersion}>
              Back
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  )
}
