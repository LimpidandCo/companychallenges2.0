// Simple admin authentication using localStorage
// Credentials can be configured via environment variables or hardcoded

export const ADMIN_CREDENTIALS = {
  username: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'hello@limpidandco.com',
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Limpid2026!Challenge'
}

export const AUTH_KEY = 'admin-auth-token'

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === 'authenticated'
}

export function setAdminAuthenticated(value: boolean) {
  if (typeof window === 'undefined') return
  if (value) {
    localStorage.setItem(AUTH_KEY, 'authenticated')
    // Also set a cookie for potential server-side checks
    document.cookie = `${AUTH_KEY}=authenticated; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
  } else {
    localStorage.removeItem(AUTH_KEY)
    document.cookie = `${AUTH_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password
}

export function signOutAdmin() {
  setAdminAuthenticated(false)
}
