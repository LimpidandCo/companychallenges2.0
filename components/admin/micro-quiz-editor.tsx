'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@/components/ui'
import { MicroQuizList } from './micro-quiz-list'
import { MicroQuizForm } from './micro-quiz-form'
import { getMicroQuizzesForAssignment } from '@/lib/actions/micro-quizzes'
import type { MicroQuiz, AssignmentUsageWithAssignment } from '@/lib/types/database'

interface MicroQuizEditorProps {
  usage: AssignmentUsageWithAssignment | null
  open: boolean
  onClose: () => void
}

export function MicroQuizEditor({ usage, open, onClose }: MicroQuizEditorProps) {
  const [quizzes, setQuizzes] = useState<MicroQuiz[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<MicroQuiz | null>(null)

  // Load quizzes when dialog opens
  useEffect(() => {
    if (open && usage) {
      loadQuizzes()
    }
  }, [open, usage])

  const loadQuizzes = async () => {
    if (!usage) return

    setLoading(true)
    setError(null)

    try {
      const result = await getMicroQuizzesForAssignment(usage.assignment_id)
      if (result.success) {
        setQuizzes(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingQuiz(null)
    setError(null)
    onClose()
  }

  const handleAddNew = () => {
    setEditingQuiz(null)
    setShowForm(true)
  }

  const handleEdit = (quiz: MicroQuiz) => {
    setEditingQuiz(quiz)
    setShowForm(true)
  }

  const handleFormCancel = () => {
    setEditingQuiz(null)
    setShowForm(false)
  }

  const handleFormSuccess = () => {
    setEditingQuiz(null)
    setShowForm(false)
    loadQuizzes()
  }

  if (!usage) return null

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Micro-Quizzes</DialogTitle>
        <DialogDescription>
          Manage reflection questions for "{usage.assignment.internal_title}"
        </DialogDescription>
      </DialogHeader>

      <DialogContent className="space-y-4">
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

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {!showForm && (
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={handleAddNew}>
                  <PlusIcon className="h-4 w-4" />
                  Add Question
                </Button>
              </div>
            )}

            {showForm ? (
              <MicroQuizForm
                assignmentId={usage.assignment_id}
                quiz={editingQuiz}
                onCancel={handleFormCancel}
                onSuccess={handleFormSuccess}
              />
            ) : quizzes.length > 0 ? (
              <MicroQuizList
                quizzes={quizzes}
                onEdit={handleEdit}
                onRefresh={loadQuizzes}
              />
            ) : (
              <div className="flex min-h-[150px] items-center justify-center text-[var(--color-fg-muted)]">
                <div className="text-center">
                  <QuizIcon className="mx-auto h-10 w-10 text-[var(--color-fg-subtle)]" />
                  <p className="mt-3 text-sm">
                    No quiz questions yet.
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                    Add questions to gather participant reflections.
                  </p>
                  <Button className="mt-4" variant="secondary" size="sm" onClick={handleAddNew}>
                    <PlusIcon className="h-4 w-4" />
                    Add First Question
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>

      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
        <Button variant="secondary" onClick={handleClose}>
          Done
        </Button>
      </div>
    </Dialog>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function QuizIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  )
}
