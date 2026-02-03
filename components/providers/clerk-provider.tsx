'use client'

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'

interface ClerkProviderProps {
  children: ReactNode
}

// Demo mode controlled by environment variable (set NEXT_PUBLIC_DEMO_MODE=true to bypass auth)
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Demo mode: skip Clerk entirely
  if (isDemoMode) {
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

// ============================================================================
// Mock Clerk exports for demo/development mode
// These provide stub implementations when Clerk is not configured
// ============================================================================

interface MockExternalAccount {
  id: string
  provider: string
  emailAddress: string
}

interface MockUser {
  id: string
  firstName: string | null
  lastName: string | null
  fullName: string | null
  emailAddresses: { emailAddress: string }[]
  primaryEmailAddress: { emailAddress: string } | null
  imageUrl: string | null
  passwordEnabled: boolean
  twoFactorEnabled: boolean
  createdAt: Date
  lastSignInAt: Date | null
  externalAccounts: MockExternalAccount[]
  update: (data: { firstName?: string; lastName?: string }) => Promise<void>
}

const mockUser: MockUser = {
  id: 'demo-user-001',
  firstName: 'Demo',
  lastName: 'User',
  fullName: 'Demo User',
  emailAddresses: [{ emailAddress: 'demo@example.com' }],
  primaryEmailAddress: { emailAddress: 'demo@example.com' },
  imageUrl: null,
  passwordEnabled: true,
  twoFactorEnabled: false,
  createdAt: new Date('2024-01-01'),
  lastSignInAt: new Date(),
  externalAccounts: [],
  update: async () => {
    // Mock update - does nothing in demo mode
  },
}

// Mock useUser hook
export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: mockUser,
  }
}

// Mock useMockAuth hook (for backwards compatibility)
export function useMockAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: mockUser,
    signOut: async () => {
      // Mock sign out - in demo mode, just reload the page
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    },
  }
}

// Mock SignInButton component
export function SignInButton({ children, mode }: { children?: ReactNode; mode?: string }) {
  return <>{children || <button>Sign In</button>}</>
}

// Mock UserButton component
export function UserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  return (
    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
      DU
    </div>
  )
}
