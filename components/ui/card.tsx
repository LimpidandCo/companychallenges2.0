import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'gradient'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-2xl border bg-[var(--color-bg-elevated)] transition-all duration-200 overflow-hidden',
        {
          // Default - Clean with subtle shadow
          'border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-md)]':
            variant === 'default',
          // Elevated - More prominent
          'border-[var(--color-border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]':
            variant === 'elevated',
          // Interactive - For clickable cards
          'border-[var(--color-border)] shadow-[var(--shadow-sm)] cursor-pointer hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-colored)] hover:-translate-y-1 active:translate-y-0 active:shadow-[var(--shadow-sm)]':
            variant === 'interactive',
          // Gradient - Special effect
          'border-transparent shadow-[var(--shadow-md)] bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-subtle)]':
            variant === 'gradient',
        },
        className
      )}
      {...props}
    >
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {props.children}
    </div>
  )
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-lg font-bold leading-tight tracking-tight text-[var(--color-fg)]',
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--color-fg-muted)]', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
