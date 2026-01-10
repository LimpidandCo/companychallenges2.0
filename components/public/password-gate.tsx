'use client'

import { useState, useTransition, useEffect } from 'react'
import { verifyAssignmentPassword } from '@/lib/actions/public'
import { cn } from '@/lib/utils/cn'

interface PasswordGateProps {
  assignmentId: string
  assignmentTitle: string
  onSuccess: () => void
}

export function PasswordGate({ assignmentId, assignmentTitle, onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // Countdown timer for rate limiting
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev && prev > 1) {
            return prev - 1
          }
          return null
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [retryAfter])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    if (retryAfter) {
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await verifyAssignmentPassword(assignmentId, password)

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error)
        if (result.retryAfter) {
          setRetryAfter(result.retryAfter)
        }
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm">
          {/* Lock Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
            <LockIcon className="h-8 w-8 text-[var(--color-accent)]" />
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center text-xl font-semibold text-[var(--color-fg)]">
            Password Required
          </h1>
          <p className="mb-6 text-center text-sm text-[var(--color-fg-muted)]">
            Enter the password to access{' '}
            <span className="font-medium text-[var(--color-fg)]">{assignmentTitle}</span>
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isPending || !!retryAfter}
                className={cn(
                  'w-full rounded-[var(--radius-md)] border bg-[var(--color-bg)] px-4 py-3 text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2',
                  error
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border)]'
                )}
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] px-3 py-2 text-sm text-[var(--color-error)]">
                <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Retry Timer */}
            {retryAfter && (
              <div className="text-center text-sm text-[var(--color-fg-muted)]">
                Please wait <span className="font-medium">{retryAfter}</span> seconds before trying again
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !!retryAfter || !password.trim()}
              className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : retryAfter ? (
                `Wait ${retryAfter}s`
              ) : (
                'Unlock Content'
              )}
            </button>
          </form>

          {/* Help Text */}
          <p className="mt-6 text-center text-xs text-[var(--color-fg-subtle)]">
            Don't have the password? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  )
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
