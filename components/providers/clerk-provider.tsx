'use client'

import { ReactNode } from 'react'
import { MockAuthProvider, DevAuthToolbar } from './mock-auth-provider'

// Re-export mock hooks as if they were Clerk hooks
export { useMockUser as useUser, useMockAuth, MockSignInButton as SignInButton, MockUserButton as UserButton } from './mock-auth-provider'

interface ClerkProviderProps {
  children: ReactNode
}

// For now, always use MockAuthProvider instead of real Clerk
// To enable real Clerk, set NEXT_PUBLIC_USE_CLERK=true
const useRealClerk = process.env.NEXT_PUBLIC_USE_CLERK === 'true'

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Always use mock for now
  return (
    <MockAuthProvider>
      {children}
      <DevAuthToolbar />
    </MockAuthProvider>
  )
}
