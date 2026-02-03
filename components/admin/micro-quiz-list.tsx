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
import { Button, Spinner } from '@/components/ui'
import { deleteMicroQuiz, reorderMicroQuizzes } from '@/lib/actions/micro-quizzes'
import type { MicroQuiz } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface MicroQuizListProps {
  quizzes: MicroQuiz[]
  onEdit: (quiz: MicroQuiz) => void
  onRefresh: () => void
}

const QUIZ_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  reflection: { 
    label: 'Reflection', 
    icon: <TextIcon className="h-3.5 w-3.5" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  multiple_choice: { 
    label: 'Multiple Choice', 
    icon: <ListIcon className="h-3.5 w-3.5" />,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  scale: { 
    label: 'Scale', 
    icon: <ScaleIcon className="h-3.5 w-3.5" />,
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
}

export function MicroQuizList({ quizzes, onEdit, onRefresh }: MicroQuizListProps) {
  const [items, setItems] = useState(quizzes)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sync state when quizzes prop changes
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

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      try {
        const result = await reorderMicroQuizzes(newItems.map((q) => q.id))
        if (!result.success) {
          setItems(items)
          setError(result.error ?? 'Failed to reorder quizzes')
        }
      } catch {
        setItems(items)
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
    } catch {
      setError('Failed to delete quiz')
    } finally {
      setActionId(null)
    }
  }

  const getQuizTypeDisplay = (quiz: MicroQuiz): string => {
    switch (quiz.quiz_type) {
      case 'multiple_choice':
        return `${quiz.options?.length ?? 0} options`
      case 'scale':
        return `${quiz.scale_min ?? 1}-${quiz.scale_max ?? 5} scale`
      case 'reflection':
        return 'Free text response'
      default:
        return ''
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-medium"
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
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {items.map((quiz, index) => (
              <SortableQuizItem
                key={quiz.id}
                quiz={quiz}
                index={index}
                total={items.length}
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
  total: number
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
  }

  const typeConfig = QUIZ_TYPE_CONFIG[quiz.quiz_type] ?? QUIZ_TYPE_CONFIG.reflection

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-stretch transition-colors",
        isDragging ? "bg-gray-50 opacity-50" : "hover:bg-gray-50/50"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-10 shrink-0 cursor-grab text-gray-300 hover:text-gray-400 hover:bg-gray-100 active:cursor-grabbing transition-colors"
        title="Drag to reorder"
      >
        <GripIcon className="h-4 w-4" />
      </button>

      {/* Question Number */}
      <div className="flex items-center justify-center w-8 shrink-0">
        <span className="text-sm font-semibold text-gray-400">{index + 1}</span>
      </div>

      {/* Question Content */}
      <div className="flex-1 py-4 pr-2 min-w-0">
        <p className="text-sm text-gray-900 leading-snug line-clamp-2">
          {quiz.question}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
            typeConfig.color
          )}>
            {typeConfig.icon}
            {typeConfig.label}
          </span>
          <span className="text-xs text-gray-400">
            {typeDisplay}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={actionId === quiz.id}
          className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <EditIcon className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={actionId === quiz.id}
          className="h-8 px-3 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          {actionId === quiz.id ? (
            <Spinner size="sm" />
          ) : (
            <>
              <TrashIcon className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}
