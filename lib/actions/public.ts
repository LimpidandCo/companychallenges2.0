'use server'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import type { Assignment, Challenge, AssignmentUsage } from '@/lib/types/database'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 5

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now })
    return { allowed: true }
  }

  // Reset if window has passed
  if (now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now })
    return { allowed: true }
  }

  // Check if limit exceeded
  if (record.attempts >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - record.lastAttempt)) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment attempts
  record.attempts += 1
  record.lastAttempt = now
  return { allowed: true }
}

export type PasswordVerifyResult =
  | { success: true }
  | { success: false; error: string; retryAfter?: number }

/**
 * Verify password for an assignment
 */
export async function verifyAssignmentPassword(
  assignmentId: string,
  password: string
): Promise<PasswordVerifyResult> {
  try {
    // Rate limit by assignment ID (could also use IP in production)
    const rateLimitKey = `password:${assignmentId}`
    const rateCheck = checkRateLimit(rateLimitKey)

    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many attempts. Please try again in ${rateCheck.retryAfter} seconds.`,
        retryAfter: rateCheck.retryAfter
      }
    }

    const supabase = createAdminClient()

    // Get the password hash and remember setting
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('password_hash, password_remember')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return { success: false, error: 'Assignment not found' }
    }

    if (!assignment.password_hash) {
      // No password required
      return { success: true }
    }

    // Normalize password to lowercase for case-insensitive matching
    const normalizedPassword = password.toLowerCase().trim()
    const storedHash = assignment.password_hash

    // Check password format and verify accordingly
    if (storedHash.startsWith('plain:')) {
      // New plaintext format (for gamification - passwords are visible)
      const storedPassword = storedHash.slice(6)
      if (normalizedPassword !== storedPassword) {
        return { success: false, error: '✕' }
      }
    } else if (storedHash.startsWith('fallback:')) {
      // Legacy base64 encoded format
      try {
        const storedPassword = atob(storedHash.slice(9))
        if (normalizedPassword !== storedPassword) {
          return { success: false, error: '✕' }
        }
      } catch {
        return { success: false, error: '✕' }
      }
    } else {
      // Legacy hashed format - verify using database function
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_password', {
        password: normalizedPassword,
        hash: storedHash
      })

      if (verifyError) {
        console.error('Password verification error:', verifyError)
        return { success: false, error: '✕' }
      }

      if (!isValid) {
        return { success: false, error: '✕' }
      }
    }

    // Only set cookie if password_remember is enabled
    // If not, password will be required on every visit
    if (assignment.password_remember) {
      const cookieStore = await cookies()
      cookieStore.set(`assignment_access_${assignmentId}`, 'verified', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // Session cookie - expires when browser closes
        path: '/'
      })
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error verifying password:', err)
    return { success: false, error: 'Failed to verify password' }
  }
}

/**
 * Check if user has access to a password-protected assignment
 */
export async function checkAssignmentAccess(assignmentId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const accessCookie = cookieStore.get(`assignment_access_${assignmentId}`)
    return accessCookie?.value === 'verified'
  } catch {
    return false
  }
}

/**
 * Verify password for a sprint
 * NOTE: Sprint passwords do NOT set a session cookie.
 * Users must re-enter the password each visit (they need their scratch card).
 */
export async function verifySprintPassword(
  sprintId: string,
  password: string
): Promise<PasswordVerifyResult> {
  try {
    // Rate limit by sprint ID
    const rateLimitKey = `sprint_password:${sprintId}`
    const rateCheck = checkRateLimit(rateLimitKey)

    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many attempts. Please try again in ${rateCheck.retryAfter} seconds.`,
        retryAfter: rateCheck.retryAfter
      }
    }

    const supabase = createAdminClient()

    // Get the sprint's password hash
    const { data: sprint, error: fetchError } = await supabase
      .from('sprints')
      .select('password_hash')
      .eq('id', sprintId)
      .single()

    if (fetchError || !sprint) {
      return { success: false, error: 'Sprint not found' }
    }

    if (!sprint.password_hash) {
      // No password required
      return { success: true }
    }

    // Normalize password to lowercase for case-insensitive matching
    const normalizedPassword = password.toLowerCase().trim()
    const storedHash = sprint.password_hash

    // Check password format and verify accordingly
    if (storedHash.startsWith('plain:')) {
      // New plaintext format (for gamification - passwords are visible)
      const storedPassword = storedHash.slice(6)
      if (normalizedPassword !== storedPassword) {
        return { success: false, error: '✕' }
      }
    } else if (storedHash.startsWith('fallback:')) {
      // Legacy base64 encoded format
      try {
        const storedPassword = atob(storedHash.slice(9))
        if (normalizedPassword !== storedPassword) {
          return { success: false, error: '✕' }
        }
      } catch {
        return { success: false, error: '✕' }
      }
    } else {
      // Legacy hashed format - verify using database function
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_password', {
        password: normalizedPassword,
        hash: storedHash
      })

      if (verifyError) {
        console.error('Sprint password verification error:', verifyError)
        return { success: false, error: '✕' }
      }

      if (!isValid) {
        return { success: false, error: '✕' }
      }
    }

    // NO COOKIE SET - user must re-enter password each visit
    // This ensures they keep their scratch card handy
    return { success: true }
  } catch (err) {
    console.error('Unexpected error verifying sprint password:', err)
    return { success: false, error: 'Failed to verify password' }
  }
}

export type PublicAssignmentResult =
  | { success: true; data: { assignment: Assignment; requiresPassword: boolean; hasAccess: boolean; isReleased: boolean; releaseAt?: string } }
  | { success: false; error: string }

/**
 * Get public assignment data by slug
 */
export async function getPublicAssignment(slug: string): Promise<PublicAssignmentResult> {
  try {
    const supabase = createAdminClient()

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !assignment) {
      return { success: false, error: 'Assignment not found' }
    }

    const requiresPassword = !!assignment.password_hash
    const hasAccess = requiresPassword ? await checkAssignmentAccess(assignment.id) : true

    return {
      success: true,
      data: {
        assignment: assignment as Assignment,
        requiresPassword,
        hasAccess,
        isReleased: true // Standalone assignments are always released
      }
    }
  } catch (err) {
    console.error('Unexpected error fetching public assignment:', err)
    return { success: false, error: 'Failed to fetch assignment' }
  }
}

export type PublicChallengeResult =
  | { success: true; data: { challenge: Challenge; client: { name: string; logo_url?: string } } }
  | { success: false; error: string }

/**
 * Get public challenge data by slug
 */
export async function getPublicChallenge(slug: string): Promise<PublicChallengeResult> {
  try {
    const supabase = createAdminClient()

    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        client:clients (
          name,
          logo_url
        )
      `)
      .eq('slug', slug)
      .eq('is_archived', false)
      .single()

    if (error || !challenge) {
      return { success: false, error: 'Challenge not found' }
    }

    return {
      success: true,
      data: {
        challenge: challenge as Challenge,
        client: challenge.client as { name: string; logo_url?: string }
      }
    }
  } catch (err) {
    console.error('Unexpected error fetching public challenge:', err)
    return { success: false, error: 'Failed to fetch challenge' }
  }
}

export type PublicAssignmentUsagesResult =
  | { success: true; data: (AssignmentUsage & { assignment: Assignment })[] }
  | { success: false; error: string }

/**
 * Get public assignment usages for a challenge
 */
export async function getPublicAssignmentUsages(challengeId: string): Promise<PublicAssignmentUsagesResult> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('assignment_usages')
      .select(`
        *,
        assignment:assignments (*)
      `)
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)
      .or(`release_at.is.null,release_at.lte.${now}`)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching assignment usages:', error)
      return { success: false, error: error.message }
    }

    // Map results and check password/release status for each
    const usagesWithAccess = await Promise.all(
      (data || []).map(async (usage) => {
        const assignment = usage.assignment as Assignment
        return {
          ...usage,
          assignment
        }
      })
    )

    return { success: true, data: usagesWithAccess }
  } catch (err) {
    console.error('Unexpected error fetching assignment usages:', err)
    return { success: false, error: 'Failed to fetch assignments' }
  }
}

/**
 * Get pending (unreleased) assignment usages for a challenge (for "coming soon" display)
 */
export async function getPendingAssignmentUsages(challengeId: string): Promise<{ count: number; nextRelease?: string }> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('assignment_usages')
      .select('release_at')
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)
      .gt('release_at', now)
      .order('release_at', { ascending: true })

    if (error || !data) {
      return { count: 0 }
    }

    return {
      count: data.length,
      nextRelease: data[0]?.release_at || undefined
    }
  } catch {
    return { count: 0 }
  }
}

import type { Sprint, Announcement } from '@/lib/types/database'

export type PublicSprintsResult =
  | { success: true; data: Sprint[] }
  | { success: false; error: string }

/**
 * Get public sprints for a challenge (only active/visible ones)
 */
export async function getPublicSprints(challengeId: string): Promise<PublicSprintsResult> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('challenge_id', challengeId)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching public sprints:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Sprint[] }
  } catch (err) {
    console.error('Unexpected error fetching public sprints:', err)
    return { success: false, error: 'Failed to fetch sprints' }
  }
}

export type PublicAnnouncementsResult =
  | { success: true; data: Announcement[] }
  | { success: false; error: string }

/**
 * Get public announcements for a challenge (published and not expired)
 */
export async function getPublicAnnouncements(challengeId: string): Promise<PublicAnnouncementsResult> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('challenge_id', challengeId)
      .lte('published_at', now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching public announcements:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Announcement[] }
  } catch (err) {
    console.error('Unexpected error fetching public announcements:', err)
    return { success: false, error: 'Failed to fetch announcements' }
  }
}

export type AssignmentNavContext = {
  challenge: {
    id: string
    clientId: string
    slug: string
    publicTitle?: string
    internalName: string
    brandColor?: string
    mode?: string
    supportInfo?: string
    contactInfo?: string
    passwordInstructions?: string
  }
  client?: {
    name: string
    logoUrl?: string
  }
  assignmentUsageId?: string
  sprintId?: string
  currentPosition: number
  totalCount: number
  prevAssignment?: { slug: string; title: string }
  nextAssignment?: { slug: string; title: string }
}

export type AssignmentWithContextResult =
  | { success: true; data: {
      assignment: Assignment
      requiresPassword: boolean
      hasAccess: boolean
      isReleased: boolean
      releaseAt?: string
      navContext?: AssignmentNavContext
    }}
  | { success: false; error: string }

/**
 * Get assignment with navigation context from a challenge
 */
export async function getAssignmentWithContext(
  assignmentSlug: string,
  challengeSlug?: string
): Promise<AssignmentWithContextResult> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // First get the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('slug', assignmentSlug)
      .single()

    if (assignmentError || !assignment) {
      return { success: false, error: 'Assignment not found' }
    }

    const requiresPassword = !!assignment.password_hash
    const hasAccess = requiresPassword ? await checkAssignmentAccess(assignment.id) : true

    // If no challenge context, return without nav
    if (!challengeSlug) {
      return {
        success: true,
        data: {
          assignment: assignment as Assignment,
          requiresPassword,
          hasAccess,
          isReleased: true
        }
      }
    }

    // Get the challenge with client info
    // Note: Some columns (contact_info, password_instructions) may not exist in older databases
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select(`
        id, client_id, slug, public_title, internal_name, brand_color, support_info, 
        contact_info, password_instructions, mode,
        client:clients (
          name,
          logo_url
        )
      `)
      .eq('slug', challengeSlug)
      .eq('is_archived', false)
      .single()

    if (challengeError || !challenge) {
      // Challenge not found, return without nav context
      return {
        success: true,
        data: {
          assignment: assignment as Assignment,
          requiresPassword,
          hasAccess,
          isReleased: true
        }
      }
    }

    // Get all released usages for this challenge to build navigation
    const { data: usages, error: usagesError } = await supabase
      .from('assignment_usages')
      .select(`
        id,
        position,
        release_at,
        sprint_id,
        assignment:assignments (
          id,
          slug,
          public_title,
          internal_title
        )
      `)
      .eq('challenge_id', challenge.id)
      .eq('is_visible', true)
      .order('position', { ascending: true })

    if (usagesError || !usages) {
      return {
        success: true,
        data: {
          assignment: assignment as Assignment,
          requiresPassword,
          hasAccess,
          isReleased: true
        }
      }
    }

    // Find current assignment in usages and check release status
    const currentUsageIndex = usages.findIndex(u => {
      const a = u.assignment as unknown as { id: string } | null
      return a?.id === assignment.id
    })

    if (currentUsageIndex === -1) {
      // Assignment not in this challenge
      return {
        success: true,
        data: {
          assignment: assignment as Assignment,
          requiresPassword,
          hasAccess,
          isReleased: true
        }
      }
    }

    const currentUsage = usages[currentUsageIndex]
    const isReleased = !currentUsage.release_at || new Date(currentUsage.release_at) <= new Date(now)

    // Filter to only released assignments for navigation
    const releasedUsages = usages.filter(u =>
      !u.release_at || new Date(u.release_at) <= new Date(now)
    )

    const releasedIndex = releasedUsages.findIndex(u => {
      const a = u.assignment as unknown as { id: string } | null
      return a?.id === assignment.id
    })

    // Build prev/next navigation
    let prevAssignment: { slug: string; title: string } | undefined
    let nextAssignment: { slug: string; title: string } | undefined

    if (releasedIndex > 0) {
      const prev = releasedUsages[releasedIndex - 1].assignment as unknown as { slug: string; public_title?: string; internal_title: string }
      prevAssignment = {
        slug: prev.slug,
        title: prev.public_title || prev.internal_title
      }
    }

    if (releasedIndex < releasedUsages.length - 1) {
      const next = releasedUsages[releasedIndex + 1].assignment as unknown as { slug: string; public_title?: string; internal_title: string }
      nextAssignment = {
        slug: next.slug,
        title: next.public_title || next.internal_title
      }
    }

    return {
      success: true,
      data: {
        assignment: assignment as Assignment,
        requiresPassword,
        hasAccess,
        isReleased,
        releaseAt: currentUsage.release_at || undefined,
        navContext: {
          challenge: {
            id: challenge.id,
            clientId: challenge.client_id,
            slug: challenge.slug,
            publicTitle: challenge.public_title || undefined,
            internalName: challenge.internal_name,
            brandColor: challenge.brand_color || undefined,
            mode: challenge.mode || 'collective',
            supportInfo: challenge.support_info || undefined,
            contactInfo: challenge.contact_info || undefined,
            passwordInstructions: challenge.password_instructions || undefined
          },
          client: (challenge as any).client ? {
            name: (challenge as any).client.name,
            logoUrl: (challenge as any).client.logo_url || undefined
          } : undefined,
          assignmentUsageId: currentUsage.id,
          sprintId: currentUsage.sprint_id || undefined,
          currentPosition: releasedIndex + 1,
          totalCount: releasedUsages.length,
          prevAssignment,
          nextAssignment
        }
      }
    }
  } catch (err) {
    console.error('Unexpected error fetching assignment with context:', err)
    return { success: false, error: 'Failed to fetch assignment' }
  }
}
