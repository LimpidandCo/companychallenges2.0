'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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

interface MockAuthContextType {
  isLoaded: boolean
  isSignedIn: boolean
  user: MockUser | null
  signIn: () => void
  signOut: () => void
}

const MockAuthContext = createContext<MockAuthContextType>({
  isLoaded: false,
  isSignedIn: false,
  user: null,
  signIn: () => {},
  signOut: () => {},
})

const MOCK_USER: MockUser = {
  id: 'mock-user-123',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  imageUrl: null,
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  primaryEmailAddress: { emailAddress: 'test@example.com' },
  passwordEnabled: true,
  twoFactorEnabled: false,
  externalAccounts: [],
  update: async () => { console.log('Mock user update called') },
}

const STORAGE_KEY = 'mock-auth-signed-in'
const COOKIE_NAME = 'mock-auth-signed-in'

function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const isAuth = stored === 'true'
    setIsSignedIn(isAuth)
    // Also set/clear cookie for server-side reading
    if (isAuth) {
      setCookie(COOKIE_NAME, 'true')
    }
    setIsLoaded(true)
  }, [])

  const signIn = () => {
    setIsSignedIn(true)
    localStorage.setItem(STORAGE_KEY, 'true')
    setCookie(COOKIE_NAME, 'true')
  }

  const signOut = () => {
    setIsSignedIn(false)
    localStorage.removeItem(STORAGE_KEY)
    deleteCookie(COOKIE_NAME)
  }

  return (
    <MockAuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        user: isSignedIn ? MOCK_USER : null,
        signIn,
        signOut,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  )
}

// Hook that mimics Clerk's useUser
export function useMockUser() {
  const { isLoaded, isSignedIn, user } = useContext(MockAuthContext)
  return { isLoaded, isSignedIn, user }
}

// Hook to get sign in/out functions
export function useMockAuth() {
  return useContext(MockAuthContext)
}

// Mock SignInButton component
export function MockSignInButton({ 
  children, 
  mode 
}: { 
  children: ReactNode
  mode?: 'modal' | 'redirect' 
}) {
  const { signIn } = useMockAuth()
  
  return (
    <div onClick={signIn} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  )
}

// Mock UserButton component
export function MockUserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  const { user, signOut } = useMockAuth()
  
  if (!user) return null

  return (
    <div className="relative group">
      <button className="h-9 w-9 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center">
        {user.firstName.charAt(0)}
      </button>
      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="px-4 py-2 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">{user.firstName}</p>
          <p className="text-xs text-gray-500">{user.emailAddresses[0]?.emailAddress}</p>
        </div>
        <button
          onClick={() => {
            signOut()
            if (afterSignOutUrl) {
              window.location.href = afterSignOutUrl
            }
          }}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

// Floating dev toolbar for quick login/logout
export function DevAuthToolbar() {
  const { isLoaded, isSignedIn, signIn, signOut, user } = useMockAuth()

  if (!isLoaded) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-sm">
      <span className="text-gray-400">Dev:</span>
      {isSignedIn ? (
        <>
          <span className="text-green-400">● {user?.firstName}</span>
          <button
            onClick={signOut}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-full text-xs font-medium transition-colors"
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <span className="text-gray-400">Not signed in</span>
          <button
            onClick={signIn}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-full text-xs font-medium transition-colors"
          >
            Quick Sign In
          </button>
        </>
      )}
    </div>
  )
}

