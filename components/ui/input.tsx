import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-[var(--color-fg)] transition-colors"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-xl border-[1.5px] px-4 text-sm',
            'transition-all duration-200 ease-out',
            'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]',
            'placeholder:text-[var(--color-fg-subtle)]',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'hover:border-[var(--color-border-hover)]',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-bg-muted)]',
            error
              ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-subtle)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-subtle)]',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm font-medium text-[var(--color-error)] animate-slide-up flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-[var(--color-fg-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
