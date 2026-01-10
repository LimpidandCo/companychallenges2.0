'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'
import type { AssignmentWithUsages } from '@/lib/types/database'

interface UsedInDialogProps {
  assignment: AssignmentWithUsages
  onClose: () => void
}

export function UsedInDialog({ assignment, onClose }: UsedInDialogProps) {
  const usages = assignment.assignment_usages || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-bg)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-fg)]">
                Used In
              </h2>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                &quot;{assignment.internal_title}&quot; is used in {usages.length} challenge{usages.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-[var(--radius-md)] p-1 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-fg)]"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-4">
          {usages.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-muted)]">
                <FolderIcon className="h-6 w-6 text-[var(--color-fg-muted)]" />
              </div>
              <p className="text-sm text-[var(--color-fg-muted)]">
                This assignment isn't used in any challenges yet.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {usages.map((usage) => {
                const challenge = usage.challenge as { id: string; internal_name: string; client_id: string } | undefined

                if (!challenge) return null

                return (
                  <li key={usage.id}>
                    <Link
                      href={`/admin/challenges/${challenge.id}`}
                      className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-bg-subtle)]"
                      onClick={onClose}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-sm font-medium text-[var(--color-accent)]">
                          {usage.position + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-fg)]">
                            {challenge.internal_name}
                          </p>
                          {usage.label && (
                            <p className="text-xs text-[var(--color-fg-muted)]">
                              Label: {usage.label}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-[var(--color-fg-muted)]" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] p-4">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}
