import { cookies } from 'next/headers'

// Mock server-side auth that reads from a cookie set by the client
// This is for development only - in production, use real Clerk

const MOCK_USER_ID = 'mock-user-123'

export async function auth(): Promise<{ userId: string | null }> {
  // In dev mode, always return the mock user
  // This simulates being logged in
  const cookieStore = await cookies()
  const isSignedIn = cookieStore.get('mock-auth-signed-in')?.value === 'true'
  
  // For server actions, we'll be more permissive and assume signed in
  // since the client-side auth gate handles the UI
  return { userId: isSignedIn ? MOCK_USER_ID : MOCK_USER_ID }
}

export function currentUser() {
  return Promise.resolve({
    id: MOCK_USER_ID,
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  })
}

