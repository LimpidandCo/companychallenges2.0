'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Spinner, Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, Textarea, Input } from '@/components/ui'
import { startAssignment, completeAssignment, saveQuizResponses } from '@/lib/actions/participants'
import type { AssignmentWithProgress, Sprint, QuizResponse, MicroQuiz } from '@/lib/types/database'

interface ChallengeProgressClientProps {
  challengeId: string
  assignments: AssignmentWithProgress[]
  sprints: Sprint[]
  sprintAssignments: Record<string, AssignmentWithProgress[]>
}

export function ChallengeProgressClient({
  challengeId,
  assignments: initialAssignments,
  sprints,
  sprintAssignments: initialSprintAssignments,
}: ChallengeProgressClientProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState(initialAssignments)
  const [sprintAssignments, setSprintAssignments] = useState(initialSprintAssignments)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithProgress | null>(null)
  const [quizDialogOpen, setQuizDialogOpen] = useState(false)

  const handleStartAssignment = async (usageId: string) => {
    setLoadingId(usageId)
    try {
      const result = await startAssignment(usageId)
      if (result.success) {
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleOpenAssignment = (assignment: AssignmentWithProgress) => {
    if (assignment.micro_quizzes.length > 0) {
      setSelectedAssignment(assignment)
      setQuizDialogOpen(true)
    } else {
      // No quizzes, just complete it
      handleCompleteAssignment(assignment.id, [])
    }
  }

  const handleCompleteAssignment = async (usageId: string, responses: QuizResponse[]) => {
    setLoadingId(usageId)
    try {
      const result = await completeAssignment(usageId, responses)
      if (result.success) {
        setQuizDialogOpen(false)
        setSelectedAssignment(null)
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }

  // Get ungrouped assignments (not in any sprint)
  const ungroupedAssignments = sprintAssignments['null'] || []

  return (
    <div className="space-y-6">
      {/* Ungrouped Assignments */}
      {ungroupedAssignments.length > 0 && (
        <AssignmentSection
          title="Assignments"
          assignments={ungroupedAssignments}
          loadingId={loadingId}
          onStart={handleStartAssignment}
          onOpen={handleOpenAssignment}
        />
      )}

      {/* Sprint Sections */}
      {sprints.map(sprint => {
        const sprintItems = sprintAssignments[sprint.id] || []
        if (sprintItems.length === 0) return null

        return (
          <SprintSection
            key={sprint.id}
            sprint={sprint}
            assignments={sprintItems}
            loadingId={loadingId}
            onStart={handleStartAssignment}
            onOpen={handleOpenAssignment}
          />
        )
      })}

      {/* Quiz Completion Dialog */}
      {selectedAssignment && (
        <QuizDialog
          open={quizDialogOpen}
          onClose={() => {
            setQuizDialogOpen(false)
            setSelectedAssignment(null)
          }}
          assignment={selectedAssignment}
          loading={loadingId === selectedAssignment.id}
          onComplete={(responses) => handleCompleteAssignment(selectedAssignment.id, responses)}
        />
      )}
    </div>
  )
}

interface AssignmentSectionProps {
  title: string
  assignments: AssignmentWithProgress[]
  loadingId: string | null
  onStart: (id: string) => void
  onOpen: (assignment: AssignmentWithProgress) => void
}

function AssignmentSection({ title, assignments, loadingId, onStart, onOpen }: AssignmentSectionProps) {
  return (
    <Card>
      <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">📝</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--color-border)]">
          {assignments.map((assignment, index) => (
            <AssignmentItem
              key={assignment.id}
              assignment={assignment}
              index={index}
              loading={loadingId === assignment.id}
              onStart={() => onStart(assignment.id)}
              onOpen={() => onOpen(assignment)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface SprintSectionProps {
  sprint: Sprint
  assignments: AssignmentWithProgress[]
  loadingId: string | null
  onStart: (id: string) => void
  onOpen: (assignment: AssignmentWithProgress) => void
}

function SprintSection({ sprint, assignments, loadingId, onStart, onOpen }: SprintSectionProps) {
  const completedCount = assignments.filter(a => a.progress?.status === 'completed').length
  const totalCount = assignments.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <Card>
      <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🏃</span>
              {sprint.name}
            </CardTitle>
            {sprint.description && (
              <p className="text-sm text-[var(--color-fg-muted)] mt-1">{sprint.description}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[var(--color-fg)]">{progressPercentage}%</span>
            <p className="text-xs text-[var(--color-fg-subtle)]">{completedCount}/{totalCount}</p>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden mt-3">
          <div
            className="h-full rounded-full bg-[var(--color-secondary)] transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--color-border)]">
          {assignments.map((assignment, index) => (
            <AssignmentItem
              key={assignment.id}
              assignment={assignment}
              index={index}
              loading={loadingId === assignment.id}
              onStart={() => onStart(assignment.id)}
              onOpen={() => onOpen(assignment)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface AssignmentItemProps {
  assignment: AssignmentWithProgress
  index: number
  loading: boolean
  onStart: () => void
  onOpen: () => void
}

function AssignmentItem({ assignment, index, loading, onStart, onOpen }: AssignmentItemProps) {
  const status = assignment.progress?.status || 'not_started'
  const hasQuizzes = assignment.micro_quizzes.length > 0

  const statusConfig: Record<string, { badge: 'default' | 'warning' | 'success'; label: string; icon: string }> = {
    not_started: { badge: 'default', label: 'Not Started', icon: '○' },
    in_progress: { badge: 'warning', label: 'In Progress', icon: '◐' },
    completed: { badge: 'success', label: 'Completed', icon: '●' },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-[var(--color-bg-subtle)] transition-colors">
      {/* Status indicator */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        status === 'completed'
          ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)]'
          : status === 'in_progress'
            ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]'
            : 'bg-[var(--color-bg-muted)] text-[var(--color-fg-subtle)]'
      }`}>
        {status === 'completed' ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          <span className="text-sm font-medium">{index + 1}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-medium text-[var(--color-fg)] truncate">
            {assignment.assignment.public_title || assignment.assignment.internal_title}
          </h4>
          {assignment.label && (
            <Badge variant="outline">{assignment.label}</Badge>
          )}
          {hasQuizzes && (
            <Badge variant="default" className="text-xs">Quiz</Badge>
          )}
        </div>
        {assignment.assignment.subtitle && (
          <p className="text-sm text-[var(--color-fg-muted)] truncate">
            {assignment.assignment.subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        {loading ? (
          <Spinner size="sm" />
        ) : status === 'completed' ? (
          <Badge variant="success">
            <CheckIcon className="h-3 w-3 mr-1" />
            Done
          </Badge>
        ) : status === 'in_progress' ? (
          <Button size="sm" onClick={onOpen}>
            Complete
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onStart}>
            Start
          </Button>
        )}
      </div>
    </div>
  )
}

interface QuizDialogProps {
  open: boolean
  onClose: () => void
  assignment: AssignmentWithProgress
  loading: boolean
  onComplete: (responses: QuizResponse[]) => void
}

function QuizDialog({ open, onClose, assignment, loading, onComplete }: QuizDialogProps) {
  const [responses, setResponses] = useState<Record<string, string | number>>({})

  const handleSubmit = () => {
    const quizResponses: QuizResponse[] = assignment.micro_quizzes.map(quiz => ({
      quiz_id: quiz.id,
      response: responses[quiz.id] ?? '',
      responded_at: new Date().toISOString(),
    }))
    onComplete(quizResponses)
  }

  const updateResponse = (quizId: string, value: string | number) => {
    setResponses(prev => ({ ...prev, [quizId]: value }))
  }

  const allAnswered = assignment.micro_quizzes.every(quiz => {
    const response = responses[quiz.id]
    return response !== undefined && response !== ''
  })

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Complete Assignment</DialogTitle>
        <DialogDescription>
          Answer the following questions to complete "{assignment.assignment.public_title || assignment.assignment.internal_title}"
        </DialogDescription>
      </DialogHeader>

      <DialogContent className="space-y-6 max-h-[60vh] overflow-y-auto">
        {/* Assignment Description */}
        {assignment.assignment.description && (
          <div className="p-4 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
            <div
              className="prose prose-sm max-w-none text-[var(--color-fg-muted)]"
              dangerouslySetInnerHTML={{ __html: assignment.assignment.description }}
            />
          </div>
        )}

        {/* Quiz Questions */}
        {assignment.micro_quizzes.map((quiz, index) => (
          <QuizQuestion
            key={quiz.id}
            quiz={quiz}
            index={index}
            value={responses[quiz.id]}
            onChange={(value) => updateResponse(quiz.id, value)}
          />
        ))}
      </DialogContent>

      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !allAnswered}>
          {loading ? <Spinner size="sm" /> : 'Complete Assignment'}
        </Button>
      </div>
    </Dialog>
  )
}

interface QuizQuestionProps {
  quiz: MicroQuiz
  index: number
  value: string | number | undefined
  onChange: (value: string | number) => void
}

function QuizQuestion({ quiz, index, value, onChange }: QuizQuestionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--color-fg)]">
        {index + 1}. {quiz.question}
      </label>

      {quiz.quiz_type === 'reflection' && (
        <Textarea
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
        />
      )}

      {quiz.quiz_type === 'multiple_choice' && quiz.options && (
        <div className="space-y-2">
          {quiz.options.map((option, optIndex) => (
            <label
              key={optIndex}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                value === option
                  ? 'border-[var(--color-secondary)] bg-[var(--color-secondary-subtle)]'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]'
              }`}
            >
              <input
                type="radio"
                name={`quiz-${quiz.id}`}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                value === option
                  ? 'border-[var(--color-secondary)]'
                  : 'border-[var(--color-border)]'
              }`}>
                {value === option && (
                  <div className="h-2 w-2 rounded-full bg-[var(--color-secondary)]" />
                )}
              </div>
              <span className="text-sm text-[var(--color-fg)]">{option}</span>
            </label>
          ))}
        </div>
      )}

      {quiz.quiz_type === 'scale' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
            <span>{quiz.scale_labels?.min || quiz.scale_min}</span>
            <span>{quiz.scale_labels?.max || quiz.scale_max}</span>
          </div>
          <div className="flex gap-2">
            {Array.from(
              { length: (quiz.scale_max ?? 5) - (quiz.scale_min ?? 1) + 1 },
              (_, i) => (quiz.scale_min ?? 1) + i
            ).map(num => (
              <button
                key={num}
                type="button"
                onClick={() => onChange(num)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  value === num
                    ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)] text-white'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-fg)]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
