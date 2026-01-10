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
 * Generate a unique slug
 */
async function generateUniqueSlug(baseName: string): Promise<string> {
  const supabase = createAdminClient()

  let baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 50)

  if (!baseSlug) {
    baseSlug = 'assignment'
  }

  const randomSuffix = Math.random().toString(36).substring(2, 8)
  let slug = `${baseSlug}-${randomSuffix}`

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
 */
async function hashPassword(password: string): Promise<string | null> {
  if (!password) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('hash_password', { password })

  if (error) {
    console.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }

  return data
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
        description: input.description ?? null,
        visual_url: input.visual_url ?? null,
        media_url: input.media_url ?? null,
        password_hash: passwordHash,
        content_type: input.content_type ?? 'standard',
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
    if (input.description !== undefined) updateData.description = input.description
    if (input.visual_url !== undefined) updateData.visual_url = input.visual_url
    if (input.media_url !== undefined) updateData.media_url = input.media_url
    if (input.content_type !== undefined) updateData.content_type = input.content_type

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
        description: original.description,
        visual_url: original.visual_url,
        media_url: original.media_url,
        password_hash: null, // Don't copy password
        content_type: original.content_type,
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
