import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-[var(--color-bg-muted)] text-[var(--color-fg)]': variant === 'default',
          'bg-[var(--color-success-subtle)] text-[var(--color-success)]': variant === 'success',
          'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]': variant === 'warning',
          'bg-[var(--color-error-subtle)] text-[var(--color-error)]': variant === 'error',
          'border border-[var(--color-border)] bg-transparent text-[var(--color-fg-muted)]': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
)

Badge.displayName = 'Badge'

export { Badge }

