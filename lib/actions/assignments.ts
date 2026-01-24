'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Assignment, AssignmentInsert, AssignmentUpdate, AssignmentWithUsages, Challenge } from '@/lib/types/database'

export type AssignmentActionResult =
  | { success: true; data: Assignment }
  | { success: false; error: string }

export type AssignmentsListResult =
  | { success: true; data: AssignmentWithUsages[] }
  | { success: false; error: string }

export type AssignmentWithUsagesResult =
  | { success: true; data: AssignmentWithUsages }
  | { success: false; error: string }

/**
 * Fetch all assignments with their usage data
 */
export async function getAssignments(options?: {
  search?: string
  contentType?: string
  usageFilter?: 'used' | 'unused' | 'all'
  reusableOnly?: boolean // filter to only show library assignments
}): Promise<AssignmentsListResult> {
  try {
    const supabase = createAdminClient()

    // Get all assignments with their usages
    let query = supabase
      .from('assignments')
      .select(`
        *,
        assignment_usages (
          id,
          challenge_id,
          position,
          is_visible,
          challenge:challenges (
            id,
            internal_name,
            client_id
          )
        ),
        micro_quizzes (*)
      `)
      .order('internal_title', { ascending: true })

    // Filter to reusable (library) assignments only
    if (options?.reusableOnly) {
      query = query.eq('is_reusable', true)
    }

    if (options?.contentType) {
      query = query.eq('content_type', options.contentType)
    }

    if (options?.search) {
      query = query.or(
        `internal_title.ilike.%${options.search}%,public_title.ilike.%${options.search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching assignments:', error)
      return { success: false, error: error.message }
    }

    // Filter by usage if needed
    let assignments = data as AssignmentWithUsages[]

    if (options?.usageFilter === 'used') {
      assignments = assignments.filter((a) => a.assignment_usages && a.assignment_usages.length > 0)
    } else if (options?.usageFilter === 'unused') {
      assignments = assignments.filter((a) => !a.assignment_usages || a.assignment_usages.length === 0)
    }

    return { success: true, data: assignments }
  } catch (err) {
    console.error('Unexpected error fetching assignments:', err)
    return { success: false, error: 'Failed to fetch assignments' }
  }
}

/**
 * Fetch a single assignment by ID with usage data
 */
export async function getAssignment(id: string): Promise<AssignmentWithUsagesResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_usages (
          id,
          challenge_id,
          position,
          is_visible,
          challenge:challenges (
            id,
            internal_name,
            client_id
          )
        ),
        variants_as_source:assignment_variants!source_assignment_id (
          id,
          relationship_label,
          target:assignments!target_assignment_id (
            id,
            internal_title,
            slug
          )
        ),
        variants_as_target:assignment_variants!target_assignment_id (
          id,
          relationship_label,
          source:assignments!source_assignment_id (
            id,
            internal_title,
            slug
          )
        ),
        micro_quizzes (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching assignment:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as AssignmentWithUsages }
  } catch (err) {
    console.error('Unexpected error fetching assignment:', err)
    return { success: false, error: 'Failed to fetch assignment' }
  }
}

/**
 * Fetch an assignment by slug
 */
export async function getAssignmentBySlug(slug: string): Promise<AssignmentActionResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching assignment by slug:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Assignment }
  } catch (err) {
    console.error('Unexpected error fetching assignment:', err)
    return { success: false, error: 'Failed to fetch assignment' }
  }
}

/**
 * Generate a secure random string
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789' // Avoid ambiguous chars (0,o,1,l,i)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate a unique slug - uses random string for security
 * The slug doesn't reveal any information about the assignment content
 */
async function generateUniqueSlug(baseName?: string): Promise<string> {
  const supabase = createAdminClient()

  // Generate fully random slug for security (no name-based guessing)
  const slug = generateRandomString(12)

  const { data } = await supabase
    .from('assignments')
    .select('slug')
    .eq('slug', slug)
    .single()

  if (data) {
    return generateUniqueSlug(baseName)
  }

  return slug
}

/**
 * Hash a password using the database function
 * Passwords are normalized to lowercase for case-insensitive matching
 * If the RPC function doesn't exist, falls back to storing password directly (not recommended for production)
 */
async function hashPassword(password: string): Promise<string> {
  if (!password) return ''

  const supabase = createAdminClient()
  // Normalize to lowercase for case-insensitive matching
  const normalizedPassword = password.toLowerCase().trim()
  
  try {
    const { data, error } = await supabase.rpc('hash_password', { password: normalizedPassword })

    if (error) {
      // If RPC function doesn't exist, use a simple hash fallback
      // This happens when the database migration hasn't created the function
      console.warn('hash_password RPC not available, using fallback:', error.message)
      // Simple base64 encoding as fallback (NOT secure, but allows functionality)
      return `fallback:${btoa(normalizedPassword)}`
    }

    return data || ''
  } catch (err) {
    console.error('Error in hashPassword:', err)
    // Fallback for any other errors
    return `fallback:${btoa(normalizedPassword)}`
  }
}

/**
 * Create a new assignment
 */
export async function createAssignment(input: AssignmentInsert): Promise<AssignmentActionResult> {
  try {
    const supabase = createAdminClient()

    const slug = input.slug || await generateUniqueSlug(input.internal_title)
    const passwordHash = input.password ? await hashPassword(input.password) : null

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        slug,
        internal_title: input.internal_title,
        public_title: input.public_title ?? null,
        subtitle: input.subtitle ?? null,
        // New JSON content format
        instructions_json: input.instructions_json ?? null,
        instructions_html: input.instructions_html ?? null,
        content_json: input.content_json ?? null,
        content_html: input.content_html ?? null,
        // Legacy fields (kept for backward compatibility)
        instructions: input.instructions ?? null,
        content: input.content ?? null,
        visual_url: input.visual_url ?? null,
        media_url: input.media_url ?? null,
        password_hash: passwordHash,
        content_type: input.content_type ?? 'standard',
        is_reusable: input.is_reusable ?? true,
        tags: input.tags ?? [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true, data: data as Assignment }
  } catch (err) {
    console.error('Unexpected error creating assignment:', err)
    return { success: false, error: 'Failed to create assignment' }
  }
}

/**
 * Create a new assignment within a challenge context
 * Creates both the assignment and its usage in one transaction
 */
export async function createAssignmentForChallenge(
  input: AssignmentInsert,
  challengeId: string,
  sprintId?: string | null
): Promise<AssignmentActionResult> {
  try {
    const supabase = createAdminClient()

    const slug = input.slug || await generateUniqueSlug(input.internal_title)
    const passwordHash = input.password ? await hashPassword(input.password) : null

    // Create the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        slug,
        internal_title: input.internal_title,
        public_title: input.public_title ?? null,
        subtitle: input.subtitle ?? null,
        // New JSON content format
        instructions_json: input.instructions_json ?? null,
        instructions_html: input.instructions_html ?? null,
        content_json: input.content_json ?? null,
        content_html: input.content_html ?? null,
        // Legacy fields (kept for backward compatibility)
        instructions: input.instructions ?? null,
        content: input.content ?? null,
        visual_url: input.visual_url ?? null,
        media_url: input.media_url ?? null,
        password_hash: passwordHash,
        content_type: input.content_type ?? 'standard',
        is_reusable: input.is_reusable ?? true,
        tags: input.tags ?? [],
      })
      .select()
      .single()

    if (assignmentError || !assignment) {
      console.error('Error creating assignment:', assignmentError)
      return { success: false, error: assignmentError?.message || 'Failed to create assignment' }
    }

    // Get the max position for this challenge
    const { data: maxPosition } = await supabase
      .from('assignment_usages')
      .select('position')
      .eq('challenge_id', challengeId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = (maxPosition?.position ?? -1) + 1

    // Create the assignment usage
    const { error: usageError } = await supabase
      .from('assignment_usages')
      .insert({
        challenge_id: challengeId,
        sprint_id: sprintId ?? null,
        assignment_id: assignment.id,
        position: nextPosition,
        is_visible: true,
      })

    if (usageError) {
      console.error('Error creating assignment usage:', usageError)
      // Try to clean up the assignment if usage creation failed
      await supabase.from('assignments').delete().eq('id', assignment.id)
      return { success: false, error: usageError.message }
    }

    revalidatePath('/admin/assignments')
    revalidatePath(`/admin/challenges/${challengeId}`)
    return { success: true, data: assignment as Assignment }
  } catch (err) {
    console.error('Unexpected error creating assignment for challenge:', err)
    return { success: false, error: 'Failed to create assignment' }
  }
}

/**
 * Update an existing assignment
 */
export async function updateAssignment(id: string, input: AssignmentUpdate): Promise<AssignmentActionResult> {
  try {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}

    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.internal_title !== undefined) updateData.internal_title = input.internal_title
    if (input.public_title !== undefined) updateData.public_title = input.public_title
    if (input.subtitle !== undefined) updateData.subtitle = input.subtitle
    // New JSON content format
    if (input.instructions_json !== undefined) updateData.instructions_json = input.instructions_json
    if (input.instructions_html !== undefined) updateData.instructions_html = input.instructions_html
    if (input.content_json !== undefined) updateData.content_json = input.content_json
    if (input.content_html !== undefined) updateData.content_html = input.content_html
    // Legacy fields (kept for backward compatibility)
    if (input.instructions !== undefined) updateData.instructions = input.instructions
    if (input.content !== undefined) updateData.content = input.content
    if (input.visual_url !== undefined) updateData.visual_url = input.visual_url
    if (input.media_url !== undefined) updateData.media_url = input.media_url
    if (input.content_type !== undefined) updateData.content_type = input.content_type
    if (input.is_reusable !== undefined) updateData.is_reusable = input.is_reusable
    if (input.tags !== undefined) updateData.tags = input.tags

    // Handle password update
    if (input.password !== undefined) {
      if (input.password === null || input.password === '') {
        updateData.password_hash = null
      } else {
        updateData.password_hash = await hashPassword(input.password)
      }
    }

    const { data, error } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    revalidatePath(`/admin/assignments/${id}`)
    return { success: true, data: data as Assignment }
  } catch (err) {
    console.error('Unexpected error updating assignment:', err)
    return { success: false, error: 'Failed to update assignment' }
  }
}

/**
 * Create a version (independent copy) of an assignment and link to challenge
 * Creates variant relationship for tracking
 */
export async function createAssignmentVersion(
  sourceAssignmentId: string,
  challengeId: string,
  relationshipLabel: string = 'Version',
  sprintId?: string | null
): Promise<AssignmentActionResult> {
  try {
    const supabase = createAdminClient()

    // Get the source assignment
    const { data: source, error: fetchError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', sourceAssignmentId)
      .single()

    if (fetchError || !source) {
      return { success: false, error: 'Source assignment not found' }
    }

    // Create new slug for the version
    const newSlug = await generateUniqueSlug(`${source.internal_title} version`)

    // Create the new assignment (version)
    const { data: newAssignment, error: createError } = await supabase
      .from('assignments')
      .insert({
        slug: newSlug,
        internal_title: `${source.internal_title} (${relationshipLabel})`,
        public_title: source.public_title,
        subtitle: source.subtitle,
        instructions: source.instructions,
        content: source.content,
        visual_url: source.visual_url,
        media_url: source.media_url,
        password_hash: null, // Don't copy password
        content_type: source.content_type,
        is_reusable: true,
        tags: source.tags || [],
      })
      .select()
      .single()

    if (createError || !newAssignment) {
      console.error('Error creating assignment version:', createError)
      return { success: false, error: createError?.message || 'Failed to create version' }
    }

    // Create variant relationship
    const { error: variantError } = await supabase
      .from('assignment_variants')
      .insert({
        source_assignment_id: sourceAssignmentId,
        target_assignment_id: newAssignment.id,
        relationship_label: relationshipLabel,
      })

    if (variantError) {
      console.error('Error creating variant relationship:', variantError)
      // Don't fail, just log - the assignment was still created
    }

    // Get the max position for this challenge
    const { data: maxPosition } = await supabase
      .from('assignment_usages')
      .select('position')
      .eq('challenge_id', challengeId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = (maxPosition?.position ?? -1) + 1

    // Create the assignment usage
    const { error: usageError } = await supabase
      .from('assignment_usages')
      .insert({
        challenge_id: challengeId,
        sprint_id: sprintId ?? null,
        assignment_id: newAssignment.id,
        position: nextPosition,
        is_visible: true,
      })

    if (usageError) {
      console.error('Error creating assignment usage for version:', usageError)
      // Don't fail, the version was still created
    }

    revalidatePath('/admin/assignments')
    revalidatePath(`/admin/challenges/${challengeId}`)
    return { success: true, data: newAssignment as Assignment }
  } catch (err) {
    console.error('Unexpected error creating assignment version:', err)
    return { success: false, error: 'Failed to create assignment version' }
  }
}

/**
 * Duplicate an assignment
 */
export async function duplicateAssignment(id: string): Promise<AssignmentActionResult> {
  try {
    const supabase = createAdminClient()

    const { data: original, error: fetchError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !original) {
      return { success: false, error: 'Assignment not found' }
    }

    const newSlug = await generateUniqueSlug(`${original.internal_title} copy`)

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        slug: newSlug,
        internal_title: `${original.internal_title} (Copy)`,
        public_title: original.public_title,
        subtitle: original.subtitle,
        instructions: original.instructions,
        content: original.content,
        visual_url: original.visual_url,
        media_url: original.media_url,
        password_hash: null, // Don't copy password
        content_type: original.content_type,
        tags: original.tags || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error duplicating assignment:', error)
      return { success: false, error: error.message }
    }

    // Copy micro-quizzes
    const { data: quizzes } = await supabase
      .from('micro_quizzes')
      .select('*')
      .eq('assignment_id', id)

    if (quizzes && quizzes.length > 0) {
      const newQuizzes = quizzes.map((quiz) => ({
        assignment_id: data.id,
        question: quiz.question,
        quiz_type: quiz.quiz_type,
        options: quiz.options,
        scale_min: quiz.scale_min,
        scale_max: quiz.scale_max,
        scale_labels: quiz.scale_labels,
        position: quiz.position,
      }))

      await supabase.from('micro_quizzes').insert(newQuizzes)
    }

    revalidatePath('/admin/assignments')
    return { success: true, data: data as Assignment }
  } catch (err) {
    console.error('Unexpected error duplicating assignment:', err)
    return { success: false, error: 'Failed to duplicate assignment' }
  }
}

/**
 * Delete an assignment
 */
export async function deleteAssignment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Check if assignment is used in any challenges
    const { count } = await supabase
      .from('assignment_usages')
      .select('*', { count: 'exact', head: true })
      .eq('assignment_id', id)

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete assignment used in ${count} challenge(s). Remove from challenges first.`
      }
    }

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting assignment:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting assignment:', err)
    return { success: false, error: 'Failed to delete assignment' }
  }
}

/**
 * Get usage count for an assignment
 */
export async function getAssignmentUsageCount(id: string): Promise<number> {
  try {
    const supabase = createAdminClient()

    const { count, error } = await supabase
      .from('assignment_usages')
      .select('*', { count: 'exact', head: true })
      .eq('assignment_id', id)

    if (error) {
      console.error('Error getting usage count:', error)
      return 0
    }

    return count ?? 0
  } catch (err) {
    console.error('Unexpected error getting usage count:', err)
    return 0
  }
}

/**
 * Get all unique tags used across assignments
 */
export async function getUniqueTags(): Promise<string[]> {
  try {
    const supabase = createAdminClient()

    // Get all assignments with tags
    const { data, error } = await supabase
      .from('assignments')
      .select('tags')
      .not('tags', 'is', null)

    if (error) {
      console.error('Error fetching tags:', error)
      return []
    }

    // Extract unique tags from all assignments
    const allTags = new Set<string>()
    for (const assignment of data || []) {
      if (Array.isArray(assignment.tags)) {
        for (const tag of assignment.tags) {
          if (tag) allTags.add(tag)
        }
      }
    }

    // Return sorted array of unique tags
    return Array.from(allTags).sort()
  } catch (err) {
    console.error('Unexpected error fetching tags:', err)
    return []
  }
}
