'use client'

import { useEffect, useState } from 'react'

// TEMPORARY: Set to true to bypass Clerk for demo
const DEMO_MODE = true

export default function SignUpPage() {
  const [ClerkSignUp, setClerkSignUp] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In demo mode, skip Clerk entirely
    if (DEMO_MODE) {
      setIsLoading(false)
      return
    }

    // Check if Clerk is configured
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      import('@clerk/nextjs').then((mod) => {
        setClerkSignUp(() => mod.SignUp)
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)]">
        <div className="text-[var(--color-fg-muted)]">Loading...</div>
      </div>
    )
  }

  if (!ClerkSignUp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)]">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)]">
            <span className="text-lg font-bold">CC</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Company Challenges</h1>
          <p className="mt-4 text-[var(--color-fg-muted)]">
            {DEMO_MODE ? 'Demo Mode Active' : 'Authentication is not configured yet.'}
          </p>
          <p className="mt-2 text-sm text-[var(--color-fg-subtle)]">
            {DEMO_MODE
              ? 'Click below to explore the admin panel.'
              : <>Add your Clerk keys to <code className="rounded bg-[var(--color-bg-muted)] px-1">.env.local</code> to enable sign-up.</>
            }
          </p>
          <a
            href="/admin"
            className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            {DEMO_MODE ? 'Enter Admin Panel' : 'Continue to Admin (Dev Mode)'}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)]">
            <span className="text-lg font-bold">CC</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Company Challenges</h1>
          <p className="mt-1 text-[var(--color-fg-muted)]">Create an account to get started</p>
        </div>
        <ClerkSignUp 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            }
          }}
        />
      </div>
    </div>
  )
}
