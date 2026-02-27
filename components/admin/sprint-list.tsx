'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Badge, Spinner } from '@/components/ui'
import { deleteSprint, reorderSprints } from '@/lib/actions/sprints'
import type { Sprint, AssignmentUsageWithAssignment } from '@/lib/types/database'

interface SprintListProps {
  sprints: Sprint[]
  usages: AssignmentUsageWithAssignment[]
  challengeSlug: string
  onEdit: (sprint: Sprint) => void
  onRefresh: () => void
}

export function SprintList({ sprints, usages, challengeSlug, onEdit, onRefresh }: SprintListProps) {
  const [items, setItems] = useState(sprints)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sync state when sprints prop changes
  if (sprints !== items && JSON.stringify(sprints) !== JSON.stringify(items)) {
    setItems(sprints)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((s) => s.id === active.id)
      const newIndex = items.findIndex((s) => s.id === over.id)

      // Optimistic update
      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Persist the new order
      try {
        const result = await reorderSprints(newItems.map((s) => s.id))
        if (!result.success) {
          setItems(items) // Revert
          setError(result.error ?? 'Failed to reorder sprints')
        }
      } catch (err) {
        setItems(items) // Revert
        setError('Failed to reorder sprints')
      }
    }
  }

  const handleDelete = async (sprint: Sprint) => {
    const assignmentCount = usages.filter((u) => u.sprint_id === sprint.id).length
    const message = assignmentCount > 0
      ? `Delete "${sprint.name}"? ${assignmentCount} assignment(s) will be moved out of this sprint.`
      : `Delete "${sprint.name}"?`

    if (!confirm(message)) {
      return
    }

    setActionId(sprint.id)
    setError(null)

    try {
      const result = await deleteSprint(sprint.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to delete sprint')
      }
    } catch (err) {
      setError('Failed to delete sprint')
    } finally {
      setActionId(null)
    }
  }

  // Count assignments per sprint
  const getAssignmentCount = (sprintId: string) => {
    return usages.filter((u) => u.sprint_id === sprintId).length
  }

  if (items.length === 0) {
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((sprint) => (
              <SortableSprintItem
                key={sprint.id}
                sprint={sprint}
                challengeSlug={challengeSlug}
                assignmentCount={getAssignmentCount(sprint.id)}
                actionId={actionId}
                onEdit={() => onEdit(sprint)}
                onDelete={() => handleDelete(sprint)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface SortableSprintItemProps {
  sprint: Sprint
  challengeSlug: string
  assignmentCount: number
  actionId: string | null
  onEdit: () => void
  onDelete: () => void
}

function SortableSprintItem({
  sprint,
  challengeSlug,
  assignmentCount,
  actionId,
  onEdit,
  onDelete,
}: SortableSprintItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sprint.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isActive = sprint.starts_at && sprint.ends_at
    ? new Date() >= new Date(sprint.starts_at) && new Date() <= new Date(sprint.ends_at)
    : false

  const isScheduled = sprint.starts_at && new Date(sprint.starts_at) > new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 hover:bg-[var(--color-bg-subtle)]"
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)] active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripIcon className="h-4 w-4" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-sm font-medium text-white">
          {sprint.position + 1}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--color-fg)]">{sprint.name}</span>
            {isActive && <Badge variant="success">Active</Badge>}
            {isScheduled && <Badge variant="warning">Scheduled</Badge>}
            {sprint.intro_video_url && <Badge variant="outline">Intro Video</Badge>}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-fg-subtle)]">
            <span>{assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}</span>
            {sprint.starts_at && (
              <span>
                Starts: {formatDate(sprint.starts_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {sprint.slug && <CopySlugButton slug={sprint.slug} />}
        <Link
          href={`/${challengeSlug}/start?sprint=${sprint.id}`}
          target="_blank"
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
        >
          <PreviewIcon className="h-4 w-4" />
          Preview
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={actionId === sprint.id}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={actionId === sprint.id}
          className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
        >
          {actionId === sprint.id ? <Spinner size="sm" /> : 'Delete'}
        </Button>
      </div>
    </div>
  )
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function PreviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function CopySlugButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(slug)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [slug])

  return (
    <button
      onClick={handleCopy}
      title={`Copy sprint slug: ${slug}`}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-mono text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] transition-colors"
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      {slug}
    </button>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
