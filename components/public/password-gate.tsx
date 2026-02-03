'use client'

import { useState, useTransition, useEffect } from 'react'
import { verifyAssignmentPassword } from '@/lib/actions/public'
import { trackPasswordAttempt } from '@/lib/actions/analytics'
import { cn } from '@/lib/utils/cn'

interface PasswordGateProps {
  assignmentId: string
  assignmentTitle: string
  passwordInstructions?: string
  onSuccess: () => void
  analyticsContext?: {
    clientId: string
    challengeId: string
  }
}

export function PasswordGate({ assignmentId, assignmentTitle, passwordInstructions, onSuccess, analyticsContext }: PasswordGateProps) {
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

      if (analyticsContext) {
        trackPasswordAttempt(
          analyticsContext.clientId,
          analyticsContext.challengeId,
          assignmentId,
          result.success
        )
      }

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--color-accent)] opacity-[0.05] rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-64 h-64 bg-[var(--color-tertiary)] opacity-[0.05] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 shadow-[var(--shadow-xl)] animate-pop-in">
          {/* Decorative top line */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-50 rounded-full" />
          
          {/* Lock Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-accent-subtle)] animate-float">
            <LockIcon className="h-10 w-10 text-[var(--color-accent)]" />
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center text-2xl font-bold text-[var(--color-fg)]">
            Password Required
          </h1>
          <p className="mb-4 text-center text-[var(--color-fg-muted)]">
            Enter the password to unlock{' '}
            <span className="font-semibold text-[var(--color-fg)]">{assignmentTitle}</span>
          </p>
          {passwordInstructions && (
            <p className="mb-8 text-center text-sm text-[var(--color-fg-subtle)] italic">
              {passwordInstructions}
            </p>
          )}
          {!passwordInstructions && <div className="mb-4" />}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isPending || !!retryAfter}
                  className={cn(
                    'w-full rounded-2xl border-[1.5px] bg-[var(--color-bg)] px-5 py-4 text-[var(--color-fg)] placeholder-[var(--color-fg-subtle)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2',
                    error
                      ? 'border-[var(--color-error)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                  )}
                  autoFocus
                  autoComplete="current-password"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <KeyIcon className="h-5 w-5 text-[var(--color-fg-subtle)]" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-[var(--color-error-subtle)] px-4 py-3 text-sm text-[var(--color-error)] animate-slide-up">
                <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Retry Timer */}
            {retryAfter && (
              <div className="text-center text-sm text-[var(--color-fg-muted)] py-2">
                <span className="inline-flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Wait <span className="font-bold text-[var(--color-fg)] tabular-nums">{retryAfter}</span> seconds
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !!retryAfter || !password.trim()}
              className="w-full rounded-2xl bg-[var(--gradient-accent)] px-5 py-4 text-base font-semibold text-white shadow-[0_4px_16px_-4px_rgba(255,107,74,0.4)] transition-all duration-200 hover:shadow-[0_8px_24px_-6px_rgba(255,107,74,0.5)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderIcon className="h-5 w-5 animate-spin" />
                  Verifying...
                </span>
              ) : retryAfter ? (
                `Try again in ${retryAfter}s`
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UnlockIcon className="h-5 w-5" />
                  Unlock Content
                </span>
              )}
            </button>
          </form>

          {/* Help Text */}
          <p className="mt-8 text-center text-sm text-[var(--color-fg-subtle)]">
            Don't have the password?{' '}
            <span className="text-[var(--color-fg-muted)]">Contact your administrator.</span>
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

function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  )
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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
