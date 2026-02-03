'use client'

import { useState } from 'react'
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

// Valid quiz types for type narrowing
const VALID_QUIZ_TYPES = ['reflection', 'multiple_choice', 'scale'] as const
type QuizType = typeof VALID_QUIZ_TYPES[number]

// Helper to parse options from database (handles both array and {choices: [...]} format)
function parseOptions(options: unknown): string[] {
  if (!options) return ['', '']
  if (Array.isArray(options)) return options.length >= 2 ? options : ['', '']
  if (typeof options === 'object' && options !== null) {
    const obj = options as Record<string, unknown>
    if (Array.isArray(obj.choices)) return obj.choices.length >= 2 ? obj.choices : ['', '']
  }
  return ['', '']
}

// Helper to ensure quiz_type is valid
function parseQuizType(type: unknown): QuizType {
  if (typeof type === 'string' && VALID_QUIZ_TYPES.includes(type as QuizType)) {
    return type as QuizType
  }
  return 'reflection'
}

export function MicroQuizForm({
  assignmentId,
  quiz,
  onCancel,
  onSuccess,
}: MicroQuizFormProps) {
  const isEditing = !!quiz
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize state directly from quiz prop (fixes Radix Select controlled value timing)
  const [question, setQuestion] = useState(() => quiz?.question ?? '')
  const [quizType, setQuizType] = useState<QuizType>(() => parseQuizType(quiz?.quiz_type))
  const [options, setOptions] = useState<string[]>(() => parseOptions(quiz?.options))
  const [scaleMin, setScaleMin] = useState(() => quiz?.scale_min ?? 1)
  const [scaleMax, setScaleMax] = useState(() => quiz?.scale_max ?? 5)
  const [scaleLabelMin, setScaleLabelMin] = useState(() => {
    const labels = quiz?.scale_labels as { min?: string; max?: string } | null
    return labels?.min ?? ''
  })
  const [scaleLabelMax, setScaleLabelMax] = useState(() => {
    const labels = quiz?.scale_labels as { min?: string; max?: string } | null
    return labels?.max ?? ''
  })

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
      // Ensure quiz_type is valid before submission
      const validQuizType = parseQuizType(quizType)
      
      if (isEditing && quiz) {
        const update: MicroQuizUpdate = {
          question: question.trim(),
          quiz_type: validQuizType,
          options: validQuizType === 'multiple_choice' ? options.filter((o) => o.trim()) : null,
          scale_min: validQuizType === 'scale' ? scaleMin : null,
          scale_max: validQuizType === 'scale' ? scaleMax : null,
          scale_labels: validQuizType === 'scale' && (scaleLabelMin || scaleLabelMax)
            ? { min: scaleLabelMin, max: scaleLabelMax }
            : null,
        }

        const result = await updateMicroQuiz(quiz.id, update)

        if (result.success) {
          onSuccess()
        } else {
          setError(result.error || 'Failed to update question')
        }
      } else {
        const input: MicroQuizInsert = {
          assignment_id: assignmentId,
          question: question.trim(),
          quiz_type: validQuizType,
          options: validQuizType === 'multiple_choice' ? options.filter((o) => o.trim()) : null,
          scale_min: validQuizType === 'scale' ? scaleMin : null,
          scale_max: validQuizType === 'scale' ? scaleMax : null,
          scale_labels: validQuizType === 'scale' && (scaleLabelMin || scaleLabelMax)
            ? { min: scaleLabelMin, max: scaleLabelMax }
            : null,
        }

        const result = await createMicroQuiz(input)

        if (result.success) {
          onSuccess()
        } else {
          setError(result.error || 'Failed to create question')
        }
      }
    } catch (err) {
      console.error('Quiz form error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
          <FormIcon className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">
            {isEditing ? 'Edit Question' : 'New Question'}
          </h4>
          <p className="text-xs text-gray-500">
            {isEditing ? 'Update the question details below' : 'Fill in the details to add a new question'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertIcon className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Question Text */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Question <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What was your main takeaway from this lesson?"
          rows={3}
          required
          disabled={loading}
          className="resize-none"
        />
      </div>

      {/* Question Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Response Type <span className="text-red-500">*</span>
        </label>
        <Select
          value={quizType}
          onChange={(e) => {
            const newType = parseQuizType(e.target.value)
            setQuizType(newType)
          }}
          options={QUIZ_TYPE_OPTIONS}
          disabled={loading}
        />
      </div>

      {/* Multiple Choice Options */}
      {quizType === 'multiple_choice' && (
        <div className="rounded-xl bg-emerald-50/50 border border-emerald-200 p-4">
          <label className="mb-3 block text-sm font-medium text-emerald-800">
            Answer Options <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-xs font-medium text-emerald-700">
                  {String.fromCharCode(65 + index)}
                </span>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  disabled={loading}
                  className="flex-1"
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    disabled={loading}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddOption}
              disabled={loading}
              className="mt-3 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Add Option
            </Button>
          )}
          <p className="mt-3 text-xs text-emerald-600">
            Add 2-6 options for participants to choose from
          </p>
        </div>
      )}

      {/* Scale Options */}
      {quizType === 'scale' && (
        <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-amber-800">
                Min Value
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
              <label className="mb-2 block text-sm font-medium text-amber-800">
                Max Value
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
              <label className="mb-2 block text-sm font-medium text-amber-800">
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
              <label className="mb-2 block text-sm font-medium text-amber-800">
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
          <p className="text-xs text-amber-600">
            Participants will select a number on the scale
          </p>
        </div>
      )}

      {/* Reflection Info */}
      {quizType === 'reflection' && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-50/50 border border-blue-200 p-4">
          <TextIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Free Text Response</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Participants can write open-ended responses in their own words.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !question.trim()}>
          {loading ? <Spinner size="sm" /> : isEditing ? 'Save Changes' : 'Add Question'}
        </Button>
      </div>
    </form>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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

function FormIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
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
