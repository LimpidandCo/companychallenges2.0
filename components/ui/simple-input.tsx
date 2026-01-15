'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input as BaseInput } from './input'

export interface SimpleInputProps extends Omit<React.ComponentProps<'input'>, 'ref'> {
  label?: string
  hint?: string
  error?: string
}

/**
 * SimpleInput provides backward-compatible API with label, hint, and error props.
 * Use BaseInput directly for the raw input element without wrapper.
 */
export const SimpleInput = React.forwardRef<HTMLInputElement, SimpleInputProps>(
  ({ label, hint, error, className, ...props }, ref) => {
    if (!label && !hint && !error) {
      // No wrapper needed, use base input directly
      return <BaseInput ref={ref} className={className} {...props} />
    }

    return (
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label className="block text-sm font-medium text-[var(--color-fg)]">
            {label}
          </label>
        )}
        <BaseInput ref={ref} {...props} />
        {hint && !error && (
          <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-[var(--color-error)]">{error}</p>
        )}
      </div>
    )
  }
)

SimpleInput.displayName = 'SimpleInput'
