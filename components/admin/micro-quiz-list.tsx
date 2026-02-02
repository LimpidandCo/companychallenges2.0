'use client'

import { useState, useEffect } from 'react'
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
import { deleteMicroQuiz, reorderMicroQuizzes } from '@/lib/actions/micro-quizzes'
import type { MicroQuiz } from '@/lib/types/database'

interface MicroQuizListProps {
  quizzes: MicroQuiz[]
  onEdit: (quiz: MicroQuiz) => void
  onRefresh: () => void
}

const QUIZ_TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }> = {
  reflection: { label: 'Reflection', variant: 'default' },
  multiple_choice: { label: 'Multiple Choice', variant: 'success' },
  scale: { label: 'Scale', variant: 'warning' },
}

export function MicroQuizList({ quizzes, onEdit, onRefresh }: MicroQuizListProps) {
  const [items, setItems] = useState(quizzes)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sync state when quizzes prop changes - must use useEffect, not during render
  useEffect(() => {
    setItems(quizzes)
  }, [quizzes])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((q) => q.id === active.id)
      const newIndex = items.findIndex((q) => q.id === over.id)

      // Optimistic update
      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Persist the new order
      try {
        const result = await reorderMicroQuizzes(newItems.map((q) => q.id))
        if (!result.success) {
          setItems(items) // Revert
          setError(result.error ?? 'Failed to reorder quizzes')
        }
      } catch (err) {
        setItems(items) // Revert
        setError('Failed to reorder quizzes')
      }
    }
  }

  const handleDelete = async (quiz: MicroQuiz) => {
    if (!confirm(`Delete this quiz question? This cannot be undone.`)) {
      return
    }

    setActionId(quiz.id)
    setError(null)

    try {
      const result = await deleteMicroQuiz(quiz.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to delete quiz')
      }
    } catch (err) {
      setError('Failed to delete quiz')
    } finally {
      setActionId(null)
    }
  }

  // Get quiz type display info
  const getQuizTypeDisplay = (quiz: MicroQuiz): string => {
    switch (quiz.quiz_type) {
      case 'multiple_choice':
        return `${quiz.options?.length ?? 0} options`
      case 'scale':
        return `${quiz.scale_min ?? 1}-${quiz.scale_max ?? 5} scale`
      case 'reflection':
        return 'Free text'
      default:
        return ''
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
          items={items.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((quiz, index) => (
              <SortableQuizItem
                key={quiz.id}
                quiz={quiz}
                index={index}
                typeDisplay={getQuizTypeDisplay(quiz)}
                actionId={actionId}
                onEdit={() => onEdit(quiz)}
                onDelete={() => handleDelete(quiz)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface SortableQuizItemProps {
  quiz: MicroQuiz
  index: number
  typeDisplay: string
  actionId: string | null
  onEdit: () => void
  onDelete: () => void
}

function SortableQuizItem({
  quiz,
  index,
  typeDisplay,
  actionId,
  onEdit,
  onDelete,
}: SortableQuizItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quiz.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeBadge = QUIZ_TYPE_LABELS[quiz.quiz_type] ?? QUIZ_TYPE_LABELS.reflection

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

        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-xs font-medium text-[var(--color-fg-muted)]">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[var(--color-fg)] truncate text-sm">
              {quiz.question}
            </span>
            <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
          </div>
          <div className="text-xs text-[var(--color-fg-subtle)] mt-0.5">
            {typeDisplay}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={actionId === quiz.id}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={actionId === quiz.id}
          className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
        >
          {actionId === quiz.id ? <Spinner size="sm" /> : 'Delete'}
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
