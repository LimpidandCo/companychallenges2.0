'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Button, Input, Select, Spinner } from '@/components/ui'
import {
  getAssignmentVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  getAvailableVariantTargets
} from '@/lib/actions/variants'
import type { AssignmentWithUsages, AssignmentVariant, Assignment } from '@/lib/types/database'

interface VariantEditorProps {
  assignment: AssignmentWithUsages
  onClose: () => void
}

interface VariantWithRelation extends AssignmentVariant {
  target?: Assignment
  source?: Assignment
}

const COMMON_LABELS = [
  'English version',
  'French version',
  'Spanish version',
  'German version',
  'Beginner version',
  'Advanced version',
  'Full version',
  'Condensed version',
  'Original',
  'Updated version',
]

export function VariantEditor({ assignment, onClose }: VariantEditorProps) {
  const [variants, setVariants] = useState<VariantWithRelation[]>([])
  const [availableTargets, setAvailableTargets] = useState<{ id: string; internal_title: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // New variant form
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [customLabel, setCustomLabel] = useState('')

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  useEffect(() => {
    loadVariants()
  }, [assignment.id])

  const loadVariants = async () => {
    setIsLoading(true)
    const [variantsResult, targetsResult] = await Promise.all([
      getAssignmentVariants(assignment.id),
      getAvailableVariantTargets(assignment.id)
    ])

    if (variantsResult.success) {
      setVariants(variantsResult.data as VariantWithRelation[])
    }
    if (targetsResult.success) {
      setAvailableTargets(targetsResult.data)
    }
    setIsLoading(false)
  }

  const handleAddVariant = () => {
    if (!selectedTarget) {
      setError('Please select an assignment')
      return
    }

    const label = newLabel === 'custom' ? customLabel : newLabel
    if (!label.trim()) {
      setError('Please enter a relationship label')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createVariant(assignment.id, selectedTarget, label)

      if (result.success) {
        setShowAddForm(false)
        setSelectedTarget('')
        setNewLabel('')
        setCustomLabel('')
        loadVariants()
      } else {
        setError(result.error)
      }
    })
  }

  const handleUpdateVariant = (variantId: string) => {
    if (!editLabel.trim()) {
      setError('Please enter a relationship label')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateVariant(variantId, editLabel)

      if (result.success) {
        setEditingId(null)
        setEditLabel('')
        loadVariants()
      } else {
        setError(result.error)
      }
    })
  }

  const handleDeleteVariant = (variantId: string) => {
    if (!confirm('Are you sure you want to remove this variant relationship?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteVariant(variantId)

      if (result.success) {
        loadVariants()
      } else {
        setError(result.error || 'Failed to delete variant')
      }
    })
  }

  const getRelatedAssignment = (variant: VariantWithRelation): Assignment | undefined => {
    if (variant.source_assignment_id === assignment.id) {
      return variant.target
    }
    return variant.source
  }

  const getRelationDescription = (variant: VariantWithRelation): string => {
    if (variant.source_assignment_id === assignment.id) {
      return `This is the ${variant.relationship_label} of`
    }
    return `${variant.relationship_label} of this assignment`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--color-bg)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-fg)]">
                Variant Relationships
              </h2>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                Link &quot;{assignment.internal_title}&quot; to related assignments
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
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">
                Dismiss
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              {/* Existing variants */}
              {variants.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-muted)]">
                    <LinkIcon className="h-6 w-6 text-[var(--color-fg-muted)]" />
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    No variant relationships yet.
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                    Link translations, difficulty levels, or other versions.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {variants.map((variant) => {
                    const related = getRelatedAssignment(variant)
                    if (!related) return null

                    const isEditing = editingId === variant.id

                    return (
                      <li
                        key={variant.id}
                        className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <Input
                              label="Relationship Label"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              placeholder="e.g., French translation"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateVariant(variant.id)}
                                disabled={isPending}
                              >
                                {isPending ? <Spinner size="sm" /> : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setEditingId(null)
                                  setEditLabel('')
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[var(--color-fg-muted)]">
                                {getRelationDescription(variant)}
                              </p>
                              <Link
                                href={`/a/${related.slug}`}
                                target="_blank"
                                className="font-medium text-[var(--color-accent)] hover:underline"
                              >
                                {related.internal_title}
                              </Link>
                              <span className="ml-2 rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs text-[var(--color-fg-muted)]">
                                {variant.relationship_label}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(variant.id)
                                  setEditLabel(variant.relationship_label)
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVariant(variant.id)}
                                disabled={isPending}
                                className="text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Add new variant form */}
              {showAddForm ? (
                <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                  <h3 className="mb-3 text-sm font-medium text-[var(--color-fg)]">
                    Add Variant Relationship
                  </h3>
                  <div className="space-y-3">
                    <Select
                      label="Related Assignment"
                      value={selectedTarget}
                      onChange={(e) => setSelectedTarget(e.target.value)}
                      options={[
                        { value: '', label: 'Select an assignment...' },
                        ...availableTargets.map(a => ({ value: a.id, label: a.internal_title }))
                      ]}
                    />

                    <Select
                      label="Relationship Type"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      options={[
                        { value: '', label: 'Select or enter custom...' },
                        ...COMMON_LABELS.map(l => ({ value: l, label: l })),
                        { value: 'custom', label: '-- Enter custom label --' }
                      ]}
                    />

                    {newLabel === 'custom' && (
                      <Input
                        label="Custom Label"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder="e.g., Summary version"
                      />
                    )}

                    <div className="flex gap-2">
                      <Button onClick={handleAddVariant} disabled={isPending}>
                        {isPending ? <Spinner size="sm" /> : 'Add Variant'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowAddForm(false)
                          setSelectedTarget('')
                          setNewLabel('')
                          setCustomLabel('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 w-full"
                  disabled={availableTargets.length === 0}
                >
                  {availableTargets.length === 0 ? (
                    'No assignments available to link'
                  ) : (
                    <>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add Variant Relationship
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] p-4">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
