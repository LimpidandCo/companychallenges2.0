'use client'

import { ReactNode } from 'react'

interface ClerkProviderProps {
  children: ReactNode
}

// Simplified provider - just passes through children
// Admin auth is handled by /lib/auth/admin-auth.ts
export function ClerkProvider({ children }: ClerkProviderProps) {
  return <>{children}</>
}

// Mock user type
interface MockUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string | null
  emailAddresses: { emailAddress: string }[]
  primaryEmailAddress: { emailAddress: string } | null
  passwordEnabled: boolean
  twoFactorEnabled: boolean
  externalAccounts: { id: string; provider: string; emailAddress: string }[]
  update: (data: Partial<{ firstName: string; lastName: string }>) => Promise<void>
}

// Mock user hook for components that still use it
export function useUser(): { isLoaded: boolean; isSignedIn: boolean; user: MockUser | null } {
  return {
    isLoaded: true,
    isSignedIn: false,
    user: null,
  }
}

// Mock auth hook
export function useMockAuth() {
  return {
    isLoaded: true,
    isSignedIn: false,
    user: null,
    signIn: () => {},
    signOut: () => {},
  }
}

// Mock SignInButton component
export function SignInButton({ children }: { children: ReactNode; mode?: string }) {
  return <>{children}</>
}

// Mock UserButton component  
export function UserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  return null
}
