'use client'

import { useState, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TagInputProps {
  label?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function TagInput({
  label,
  value,
  onChange,
  placeholder = 'Add tag...',
  hint,
  error,
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-semibold text-[var(--color-fg)]">
          {label}
        </label>
      )}

      <div
        className={cn(
          'flex flex-wrap gap-2 rounded-xl border-[1.5px] bg-[var(--color-bg)] px-3 py-2.5 min-h-[44px] transition-all duration-150',
          error
            ? 'border-[var(--color-error)] shadow-[var(--shadow-xs)]'
            : 'border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:shadow-[var(--shadow-sm)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-700"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue)
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {hint && !error && (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      )}
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
