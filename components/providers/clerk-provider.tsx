'use client'

import { ReactNode } from 'react'

interface ClerkProviderProps {
  children: ReactNode
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  return <>{children}</>
}

export function useUser() {
  return { isLoaded: true, isSignedIn: false, user: null }
}

export function useAuth() {
  return { isLoaded: true, isSignedIn: false }
}

export function SignInButton({ children }: { children: ReactNode; mode?: string }) {
  return <>{children}</>
}

export function UserButton(_props: { afterSignOutUrl?: string }) {
  return null
}
