'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAdminAuthenticated, setAdminAuthenticated, validateCredentials } from '@/lib/auth/admin-auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.replace('/admin')
    } else {
      setIsChecking(false)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300))

    if (validateCredentials(username, password)) {
      setAdminAuthenticated(true)
      router.replace('/admin')
    } else {
      setError('Invalid credentials')
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-bg-muted)] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-fg)]">
            Company Challenges
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">
            by Limpid&Co
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border)] p-6 shadow-lg shadow-black/5">
          <h2 className="text-base font-medium text-[var(--color-fg)] mb-5 text-center">
            Admin Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-fg-muted)] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] placeholder-[var(--color-fg-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all text-sm"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-fg-muted)] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] placeholder-[var(--color-fg-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-[var(--color-fg-muted)]/70">
          Need access? Contact your administrator.
        </p>
      </div>
    </div>
  )
}
