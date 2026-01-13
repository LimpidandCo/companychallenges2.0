import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, options, ...props }, ref) => {
    const selectId = id || props.name

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold text-[var(--color-fg)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-11 w-full rounded-xl border-[1.5px] px-4 pr-10 text-sm appearance-none',
              'transition-all duration-200 ease-out',
              'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'hover:border-[var(--color-border-hover)]',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-bg-muted)]',
              'cursor-pointer',
              error
                ? 'border-[var(--color-error)] focus:ring-[var(--color-error-subtle)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-subtle)]',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
            <svg 
              className="h-4 w-4 text-[var(--color-fg-muted)]" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-sm font-medium text-[var(--color-error)] animate-slide-up flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-sm text-[var(--color-fg-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
