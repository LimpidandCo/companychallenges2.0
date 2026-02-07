'use client'

import { useState } from 'react'
import type { MicroQuiz } from '@/lib/types/database'

interface MicroQuizDisplayProps {
  quiz: MicroQuiz
  brandColor?: string
  onResponse?: (quizId: string, response: string | number) => void
  savedResponse?: string | number
}

export function MicroQuizDisplay({ 
  quiz, 
  brandColor = '#ff6b4a',
  onResponse,
  savedResponse 
}: MicroQuizDisplayProps) {
  const [response, setResponse] = useState<string | number | null>(savedResponse ?? null)
  const [submitted, setSubmitted] = useState(!!savedResponse)

  // Auto-submit handler for immediate feedback quiz types
  const handleResponseChange = (value: string | number, autoSubmit = false) => {
    setResponse(value)
    if (autoSubmit && onResponse) {
      onResponse(quiz.id, value)
      setSubmitted(true)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div 
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
        >
          <QuizIcon className="h-4 w-4" />
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-fg-muted)]">
            {quiz.quiz_type === 'reflection' ? 'Reflection' : quiz.quiz_type === 'scale' ? 'Quick Rating' : 'Quick Question'}
          </span>
          <h4 className="text-lg font-semibold text-[var(--color-fg)] mt-1">
            {quiz.question}
          </h4>
        </div>
      </div>

      {/* Quiz Input based on type */}
      <div className="mt-4">
        {quiz.quiz_type === 'reflection' && (
          <ReflectionInput
            value={response as string || ''}
            onChange={(value) => handleResponseChange(value, false)}
            onBlur={() => {
              // Auto-submit reflection when user finishes typing (on blur)
              if (response && onResponse && !submitted) {
                onResponse(quiz.id, response)
                setSubmitted(true)
              }
            }}
            submitted={submitted}
            brandColor={brandColor}
          />
        )}

        {quiz.quiz_type === 'multiple_choice' && quiz.options && (
          <MultipleChoiceInput
            options={quiz.options}
            value={response as string || ''}
            onChange={(value) => handleResponseChange(value, true)}
            submitted={submitted}
            brandColor={brandColor}
          />
        )}

        {quiz.quiz_type === 'scale' && (
          <ScaleInput
            min={quiz.scale_min ?? 1}
            max={quiz.scale_max ?? 10}
            labels={quiz.scale_labels}
            value={response as number}
            onChange={(value) => handleResponseChange(value, true)}
            submitted={submitted}
            brandColor={brandColor}
          />
        )}
      </div>

      {submitted && (
        <div className="mt-4 flex items-center gap-2 text-[var(--color-success)]">
          <CheckIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Response recorded</span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Input Components
// =============================================================================

function ReflectionInput({ 
  value, 
  onChange, 
  onBlur,
  submitted,
}: { 
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  submitted: boolean
  brandColor: string
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder="Share your thoughts..."
      disabled={submitted}
      rows={4}
      className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    />
  )
}

function MultipleChoiceInput({ 
  options, 
  value, 
  onChange, 
  submitted,
  brandColor
}: { 
  options: string[]
  value: string
  onChange: (value: string) => void
  submitted: boolean
  brandColor: string
}) {
  return (
    <div className="space-y-2">
      {options.map((option, index) => {
        const isSelected = value === option

        return (
          <button
            key={index}
            onClick={() => !submitted && onChange(option)}
            disabled={submitted}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
              isSelected 
                ? 'border-current' 
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            } ${submitted ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            style={isSelected ? { 
              borderColor: brandColor, 
              backgroundColor: `${brandColor}10`,
              color: brandColor
            } : undefined}
          >
            <div className="flex items-center gap-3">
              <div 
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected ? 'border-current' : 'border-[var(--color-border)]'
                }`}
                style={isSelected ? { borderColor: brandColor, backgroundColor: brandColor } : undefined}
              >
                {isSelected && (
                  <CheckIcon className="h-3.5 w-3.5 text-white" />
                )}
              </div>
              <span className={`font-medium ${isSelected ? '' : 'text-[var(--color-fg)]'}`}>
                {option}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ScaleInput({ 
  min, 
  max, 
  labels, 
  value, 
  onChange, 
  submitted,
  brandColor
}: { 
  min: number
  max: number
  labels: { min: string; max: string } | null
  value: number | null
  onChange: (value: number) => void
  submitted: boolean
  brandColor: string
}) {
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div>
      {/* Scale buttons */}
      <div className="flex gap-1 justify-between">
        {range.map((num) => {
          const isSelected = value === num

          return (
            <button
              key={num}
              onClick={() => !submitted && onChange(num)}
              disabled={submitted}
              className={`flex-1 h-12 rounded-lg font-semibold transition-all ${
                isSelected 
                  ? 'text-white shadow-lg scale-105' 
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]'
              } ${submitted ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              style={isSelected ? { backgroundColor: brandColor } : undefined}
            >
              {num}
            </button>
          )
        })}
      </div>

      {/* Labels */}
      {labels && (
        <div className="flex justify-between mt-2 text-xs text-[var(--color-fg-muted)]">
          <span>{labels.min}</span>
          <span>{labels.max}</span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Quiz List Component
// =============================================================================

interface MicroQuizListProps {
  quizzes: MicroQuiz[]
  brandColor?: string
  onResponse?: (quizId: string, response: string | number) => void
  savedResponses?: Record<string, string | number>
}

export function MicroQuizList({ 
  quizzes, 
  brandColor,
  onResponse,
  savedResponses = {}
}: MicroQuizListProps) {
  if (quizzes.length === 0) return null

  return (
    <div className="space-y-4">
        {quizzes.map((quiz) => (
          <MicroQuizDisplay
            key={quiz.id}
            quiz={quiz}
            brandColor={brandColor}
            onResponse={onResponse}
            savedResponse={savedResponses[quiz.id]}
          />
        ))}
    </div>
  )
}

// =============================================================================
// Icons
// =============================================================================

function QuizIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}



