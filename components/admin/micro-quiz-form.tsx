'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Textarea,
  Select,
  Spinner,
} from '@/components/ui'
import { createMicroQuiz, updateMicroQuiz } from '@/lib/actions/micro-quizzes'
import type { MicroQuiz, MicroQuizInsert, MicroQuizUpdate } from '@/lib/types/database'

interface MicroQuizFormProps {
  assignmentId: string
  quiz?: MicroQuiz | null
  onCancel: () => void
  onSuccess: () => void
}

const QUIZ_TYPE_OPTIONS = [
  { value: 'reflection', label: 'Reflection (Free Text)' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'scale', label: 'Scale Rating' },
]

export function MicroQuizForm({
  assignmentId,
  quiz,
  onCancel,
  onSuccess,
}: MicroQuizFormProps) {
  const isEditing = !!quiz
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [question, setQuestion] = useState('')
  const [quizType, setQuizType] = useState<'reflection' | 'multiple_choice' | 'scale'>('reflection')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [scaleMin, setScaleMin] = useState(1)
  const [scaleMax, setScaleMax] = useState(5)
  const [scaleLabelMin, setScaleLabelMin] = useState('')
  const [scaleLabelMax, setScaleLabelMax] = useState('')

  // Reset form when quiz changes
  useEffect(() => {
    if (quiz) {
      setQuestion(quiz.question ?? '')
      setQuizType(quiz.quiz_type ?? 'reflection')
      // Ensure options is always an array with at least 2 items
      const quizOptions = Array.isArray(quiz.options) && quiz.options.length >= 2 
        ? quiz.options 
        : ['', '']
      setOptions(quizOptions)
      setScaleMin(quiz.scale_min ?? 1)
      setScaleMax(quiz.scale_max ?? 5)
      // Safely access scale_labels which could be null or have unexpected structure
      const labels = quiz.scale_labels as { min?: string; max?: string } | null
      setScaleLabelMin(labels?.min ?? '')
      setScaleLabelMax(labels?.max ?? '')
    } else {
      setQuestion('')
      setQuizType('reflection')
      setOptions(['', ''])
      setScaleMin(1)
      setScaleMax(5)
      setScaleLabelMin('')
      setScaleLabelMax('')
    }
    setError(null)
  }, [quiz])

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate based on type
    if (quizType === 'multiple_choice') {
      const validOptions = options.filter((o) => o.trim())
      if (validOptions.length < 2) {
        setError('Multiple choice requires at least 2 options')
        setLoading(false)
        return
      }
    }

    try {
      if (isEditing && quiz) {
        const update: MicroQuizUpdate = {
          question: question.trim(),
          quiz_type: quizType,
          options: quizType === 'multiple_choice' ? options.filter((o) => o.trim()) : null,
          scale_min: quizType === 'scale' ? scaleMin : null,
          scale_max: quizType === 'scale' ? scaleMax : null,
          scale_labels: quizType === 'scale' && (scaleLabelMin || scaleLabelMax)
            ? { min: scaleLabelMin, max: scaleLabelMax }
            : null,
        }

        const result = await updateMicroQuiz(quiz.id, update)

        if (result.success) {
          onSuccess()
        } else {
          setError(result.error)
        }
      } else {
        const input: MicroQuizInsert = {
          assignment_id: assignmentId,
          question: question.trim(),
          quiz_type: quizType,
          options: quizType === 'multiple_choice' ? options.filter((o) => o.trim()) : null,
          scale_min: quizType === 'scale' ? scaleMin : null,
          scale_max: quizType === 'scale' ? scaleMax : null,
          scale_labels: quizType === 'scale' && (scaleLabelMin || scaleLabelMax)
            ? { min: scaleLabelMin, max: scaleLabelMax }
            : null,
        }

        const result = await createMicroQuiz(input)

        if (result.success) {
          onSuccess()
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-[var(--color-fg)]">
          {isEditing ? 'Edit Question' : 'Add Question'}
        </h4>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
          Question <span className="text-[var(--color-error)]">*</span>
        </label>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., How did this content make you feel?"
          rows={2}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
          Question Type <span className="text-[var(--color-error)]">*</span>
        </label>
        <Select
          value={quizType}
          onChange={(e) => setQuizType(e.target.value as typeof quizType)}
          options={QUIZ_TYPE_OPTIONS}
          disabled={loading}
        />
      </div>

      {quizType === 'multiple_choice' && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
            Options <span className="text-[var(--color-error)]">*</span>
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  disabled={loading}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    disabled={loading}
                    className="text-[var(--color-error)] hover:text-[var(--color-error)]"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddOption}
              disabled={loading || options.length >= 6}
            >
              <PlusIcon className="h-4 w-4" />
              Add Option
            </Button>
          </div>
          <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
            Minimum 2, maximum 6 options
          </p>
        </div>
      )}

      {quizType === 'scale' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Minimum Value
              </label>
              <Input
                type="number"
                value={scaleMin}
                onChange={(e) => setScaleMin(parseInt(e.target.value) || 1)}
                min={0}
                max={scaleMax - 1}
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Maximum Value
              </label>
              <Input
                type="number"
                value={scaleMax}
                onChange={(e) => setScaleMax(parseInt(e.target.value) || 5)}
                min={scaleMin + 1}
                max={10}
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Low Label
              </label>
              <Input
                value={scaleLabelMin}
                onChange={(e) => setScaleLabelMin(e.target.value)}
                placeholder="e.g., Not at all"
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                High Label
              </label>
              <Input
                value={scaleLabelMax}
                onChange={(e) => setScaleLabelMax(e.target.value)}
                placeholder="e.g., Very much"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {quizType === 'reflection' && (
        <p className="text-sm text-[var(--color-fg-muted)]">
          Participants will be able to respond with free-form text.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !question.trim()}>
          {loading ? <Spinner size="sm" /> : isEditing ? 'Update' : 'Add Question'}
        </Button>
      </div>
    </form>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}
