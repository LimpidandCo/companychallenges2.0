'use client'

import { ReactNode } from 'react'
import { 
  MockAuthProvider, 
  useMockUser, 
  useMockAuth, 
  MockSignInButton, 
  MockUserButton, 
  DevAuthToolbar 
} from './mock-auth-provider'

interface ClerkProviderProps {
  children: ReactNode
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <MockAuthProvider>
      {children}
      <DevAuthToolbar />
    </MockAuthProvider>
  )
}

export function useUser() {
  return useMockUser()
}

export function useAuth() {
  return useMockAuth()
}

export { useMockAuth }

export function SignInButton({ children, mode }: { children: ReactNode; mode?: string }) {
  return <MockSignInButton mode={mode as 'modal' | 'redirect'}>{children}</MockSignInButton>
}

export function UserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  return <MockUserButton afterSignOutUrl={afterSignOutUrl} />
}
