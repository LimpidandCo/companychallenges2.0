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
  DialogContent,
  DialogFooter,
  Spinner,
} from '@/components/ui'
import type { AssignmentWithUsages } from '@/lib/types/database'

interface AssignmentPickerProps {
  open: boolean
  onClose: () => void
  assignments: AssignmentWithUsages[]
  onSelect: (assignmentId: string) => void
  loading?: boolean
}

const CONTENT_TYPE_BADGES: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }> = {
  standard: { label: 'Standard', variant: 'default' },
  video: { label: 'Video', variant: 'success' },
  quiz: { label: 'Quiz', variant: 'warning' },
  announcement: { label: 'Announcement', variant: 'outline' },
}

export function AssignmentPicker({
  open,
  onClose,
  assignments,
  onSelect,
  loading = false,
}: AssignmentPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments

    const query = searchQuery.toLowerCase()
    return assignments.filter(
      (a) =>
        a.internal_title.toLowerCase().includes(query) ||
        a.public_title?.toLowerCase().includes(query)
    )
  }, [assignments, searchQuery])

  const handleSelect = () => {
    if (selectedId) {
      onSelect(selectedId)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedId(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Add Assignment</DialogTitle>
        <DialogDescription>
          Select an assignment from your library to add to this challenge.
        </DialogDescription>
      </DialogHeader>

      <DialogContent className="space-y-4">
        <Input
          type="search"
          placeholder="Search assignments..."
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
                    onClick={() => setSelectedId(assignment.id)}
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
                    <p className="font-medium">No assignments available</p>
                    <p className="mt-1 text-sm">
                      All assignments are already in this challenge, or none exist yet.
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
      </DialogContent>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSelect}
          disabled={!selectedId || loading}
        >
          {loading && <Spinner size="sm" className="mr-2" />}
          Add to Challenge
        </Button>
      </DialogFooter>
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
