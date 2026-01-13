'use client'

import { useState } from 'react'
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
import { deleteMilestone, reorderMilestones } from '@/lib/actions/milestones'
import type { Milestone, Sprint, AssignmentUsageWithAssignment } from '@/lib/types/database'

interface MilestoneListProps {
  milestones: Milestone[]
  sprints: Sprint[]
  usages: AssignmentUsageWithAssignment[]
  onEdit: (milestone: Milestone) => void
  onRefresh: () => void
}

const TRIGGER_TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }> = {
  assignment_complete: { label: 'Assignment', variant: 'default' },
  sprint_complete: { label: 'Sprint', variant: 'success' },
  percentage: { label: 'Percentage', variant: 'warning' },
  custom: { label: 'Custom', variant: 'outline' },
}

const CELEBRATION_TYPE_LABELS: Record<string, string> = {
  badge: 'Badge',
  message: 'Message',
  animation: 'Animation',
  unlock: 'Unlock',
}

export function MilestoneList({ milestones, sprints, usages, onEdit, onRefresh }: MilestoneListProps) {
  const [items, setItems] = useState(milestones)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sync state when milestones prop changes
  if (milestones !== items && JSON.stringify(milestones) !== JSON.stringify(items)) {
    setItems(milestones)
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
      const oldIndex = items.findIndex((m) => m.id === active.id)
      const newIndex = items.findIndex((m) => m.id === over.id)

      // Optimistic update
      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Persist the new order
      try {
        const result = await reorderMilestones(newItems.map((m) => m.id))
        if (!result.success) {
          setItems(items) // Revert
          setError(result.error ?? 'Failed to reorder milestones')
        }
      } catch (err) {
        setItems(items) // Revert
        setError('Failed to reorder milestones')
      }
    }
  }

  const handleDelete = async (milestone: Milestone) => {
    if (!confirm(`Delete milestone "${milestone.name}"? This cannot be undone.`)) {
      return
    }

    setActionId(milestone.id)
    setError(null)

    try {
      const result = await deleteMilestone(milestone.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to delete milestone')
      }
    } catch (err) {
      setError('Failed to delete milestone')
    } finally {
      setActionId(null)
    }
  }

  // Get trigger display name
  const getTriggerDisplay = (milestone: Milestone): string => {
    switch (milestone.trigger_type) {
      case 'assignment_complete': {
        const usage = usages.find((u) => u.assignment_id === milestone.trigger_value)
        return usage?.assignment.internal_title ?? 'Unknown assignment'
      }
      case 'sprint_complete': {
        const sprint = sprints.find((s) => s.id === milestone.trigger_value)
        return sprint?.name ?? 'Unknown sprint'
      }
      case 'percentage':
        return `${milestone.trigger_value}% complete`
      case 'custom':
        return milestone.trigger_value
      default:
        return milestone.trigger_value
    }
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
          items={items.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((milestone) => (
              <SortableMilestoneItem
                key={milestone.id}
                milestone={milestone}
                triggerDisplay={getTriggerDisplay(milestone)}
                actionId={actionId}
                onEdit={() => onEdit(milestone)}
                onDelete={() => handleDelete(milestone)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface SortableMilestoneItemProps {
  milestone: Milestone
  triggerDisplay: string
  actionId: string | null
  onEdit: () => void
  onDelete: () => void
}

function SortableMilestoneItem({
  milestone,
  triggerDisplay,
  actionId,
  onEdit,
  onDelete,
}: SortableMilestoneItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const triggerBadge = TRIGGER_TYPE_LABELS[milestone.trigger_type] ?? TRIGGER_TYPE_LABELS.custom
  const celebrationLabel = CELEBRATION_TYPE_LABELS[milestone.celebration_type] ?? milestone.celebration_type

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 hover:bg-[var(--color-bg-subtle)]"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)] active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripIcon className="h-4 w-4" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-warning)] text-sm">
          <TrophyIcon className="h-4 w-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[var(--color-fg)] truncate">{milestone.name}</span>
            <Badge variant={triggerBadge.variant}>{triggerBadge.label}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-fg-subtle)] mt-0.5">
            <span className="truncate">Trigger: {triggerDisplay}</span>
            <span className="text-[var(--color-fg-muted)]">•</span>
            <span>Celebration: {celebrationLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={actionId === milestone.id}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={actionId === milestone.id}
          className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
        >
          {actionId === milestone.id ? <Spinner size="sm" /> : 'Delete'}
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

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.992 0" />
    </svg>
  )
}
