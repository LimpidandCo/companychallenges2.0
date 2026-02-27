import { cookies } from 'next/headers'

const MOCK_USER_ID = 'mock-user-123'

export async function auth(): Promise<{ userId: string | null }> {
  const cookieStore = await cookies()
  const isSignedIn = cookieStore.get('mock-auth-signed-in')?.value === 'true'
  
  return { userId: isSignedIn ? MOCK_USER_ID : null }
}

export function currentUser() {
  return Promise.resolve({
    id: MOCK_USER_ID,
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  })
}
