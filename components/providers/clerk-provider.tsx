'use client'

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'

interface ClerkProviderProps {
  children: ReactNode
}

// TEMPORARY: Set to true to bypass Clerk for demo
const DEMO_MODE = true

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Demo mode: skip Clerk entirely
  if (DEMO_MODE) {
    return <>{children}</>
  }

  // Check if Clerk is configured (client-side check)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    // Clerk not configured, render children without provider
    return <>{children}</>
  }

  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  )
}

