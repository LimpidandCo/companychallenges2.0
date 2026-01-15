'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

export interface SimpleSelectOption {
  value: string
  label: string
}

export interface SimpleSelectProps {
  options: SimpleSelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (e: { target: { value: string } }) => void
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  className?: string
  name?: string
}

// Radix Select doesn't allow empty string values, so we use a special placeholder
const EMPTY_VALUE_PLACEHOLDER = '__empty__'

export function SimpleSelect({
  options,
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder = 'Select...',
  label,
  hint,
  error,
  disabled,
  className,
  name,
}: SimpleSelectProps) {
  // Convert empty strings to placeholder for Radix
  const toRadixValue = (v: string | undefined) =>
    v === '' ? EMPTY_VALUE_PLACEHOLDER : v

  // Convert placeholder back to empty string for external use
  const fromRadixValue = (v: string) =>
    v === EMPTY_VALUE_PLACEHOLDER ? '' : v

  const handleValueChange = (newValue: string) => {
    const externalValue = fromRadixValue(newValue)
    onValueChange?.(externalValue)
    // Simulate native select onChange event
    onChange?.({ target: { value: externalValue } })
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-fg)]">
          {label}
        </label>
      )}
      <Select
        value={toRadixValue(value)}
        defaultValue={toRadixValue(defaultValue)}
        onValueChange={handleValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value || EMPTY_VALUE_PLACEHOLDER}
              value={option.value === '' ? EMPTY_VALUE_PLACEHOLDER : option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && !error && (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--color-error)]">{error}</p>
      )}
    </div>
  )
}
