/**
 * Password encoding/decoding utilities for gamification passwords
 * These are stored in reversible format so admins can see what they set
 */

/**
 * Encode password for storage
 * Uses plaintext format prefixed with 'plain:' for reversibility
 */
export function encodePassword(password: string): string {
  if (!password) return ''
  const normalizedPassword = password.toLowerCase().trim()
  if (!normalizedPassword) return ''
  return `plain:${normalizedPassword}`
}

/**
 * Decode password for display in admin
 * Handles multiple formats: plain:, fallback: (base64), and legacy hashes
 */
export function decodePassword(encoded: string | null): string {
  if (!encoded) return ''
  if (encoded.startsWith('plain:')) {
    return encoded.slice(6)
  }
  if (encoded.startsWith('fallback:')) {
    try {
      return atob(encoded.slice(9))
    } catch {
      return ''
    }
  }
  // Legacy hashed passwords can't be decoded - show empty
  return ''
}
