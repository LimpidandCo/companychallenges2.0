'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Sprint, SprintInsert, SprintUpdate } from '@/lib/types/database'

export type SprintActionResult =
  | { success: true; data: Sprint }
  | { success: false; error: string }

export type SprintsListResult =
  | { success: true; data: Sprint[] }
  | { success: false; error: string }

/**
 * Fetch all sprints for a challenge
 */
export async function getSprintsForChallenge(challengeId: string): Promise<SprintsListResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching sprints:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Sprint[] }
  } catch (err) {
    console.error('Unexpected error fetching sprints:', err)
    return { success: false, error: 'Failed to fetch sprints' }
  }
}

/**
 * Fetch a single sprint by ID
 */
export async function getSprint(id: string): Promise<SprintActionResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching sprint:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Sprint }
  } catch (err) {
    console.error('Unexpected error fetching sprint:', err)
    return { success: false, error: 'Failed to fetch sprint' }
  }
}

/**
 * Get the next position for a new sprint
 */
async function getNextSprintPosition(challengeId: string): Promise<number> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('sprints')
    .select('position')
    .eq('challenge_id', challengeId)
    .order('position', { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    return data[0].position + 1
  }

  return 0
}

import { encodePassword } from '@/lib/utils/password'

/**
 * Generate unique slug for sprint
 */
function generateSprintSlug(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Create a new sprint
 */
export async function createSprint(input: SprintInsert): Promise<SprintActionResult> {
  let supabase
  try {
    supabase = createAdminClient()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to connect to database'
    console.error('Supabase client error:', message)
    return { success: false, error: message }
  }

  try {
    // Get next position if not provided
    const position = input.position ?? await getNextSprintPosition(input.challenge_id)
    
    // Generate slug
    const slug = input.slug || generateSprintSlug()
    
    // Encode password if provided (stored in reversible format for gamification)
    const passwordHash = input.password ? encodePassword(input.password) : null

    const { data, error } = await supabase
      .from('sprints')
      .insert({
        challenge_id: input.challenge_id,
        name: input.name,
        description: input.description ?? null,
        position,
        visual_url: input.visual_url ?? null,
        // New sprint-as-container fields
        slug,
        subtitle: input.subtitle ?? null,
        description_html: input.description_html ?? null,
        cover_image_url: input.cover_image_url ?? null,
        password_hash: passwordHash,
        // Host content
        intro_video_url: input.intro_video_url ?? null,
        recap_video_url: input.recap_video_url ?? null,
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sprint:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/challenges/${input.challenge_id}`)
    return { success: true, data: data as Sprint }
  } catch (err) {
    console.error('Unexpected error creating sprint:', err)
    return { success: false, error: 'Failed to create sprint' }
  }
}

/**
 * Update an existing sprint
 */
export async function updateSprint(id: string, input: SprintUpdate): Promise<SprintActionResult> {
  try {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.position !== undefined) updateData.position = input.position
    if (input.visual_url !== undefined) updateData.visual_url = input.visual_url
    // New sprint-as-container fields
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.subtitle !== undefined) updateData.subtitle = input.subtitle
    if (input.description_html !== undefined) updateData.description_html = input.description_html
    if (input.cover_image_url !== undefined) updateData.cover_image_url = input.cover_image_url
    // Host content
    if (input.intro_video_url !== undefined) updateData.intro_video_url = input.intro_video_url
    if (input.recap_video_url !== undefined) updateData.recap_video_url = input.recap_video_url
    if (input.starts_at !== undefined) updateData.starts_at = input.starts_at
    if (input.ends_at !== undefined) updateData.ends_at = input.ends_at
    
    // Handle password update (stored in reversible format for gamification)
    if (input.password !== undefined) {
      if (input.password === null || input.password === '') {
        updateData.password_hash = null
      } else {
        const encoded = encodePassword(input.password)
        updateData.password_hash = encoded || null
      }
    }

    const { data, error } = await supabase
      .from('sprints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sprint:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/challenges/${data.challenge_id}`)
    return { success: true, data: data as Sprint }
  } catch (err) {
    console.error('Unexpected error updating sprint:', err)
    return { success: false, error: 'Failed to update sprint' }
  }
}

/**
 * Delete a sprint
 */
export async function deleteSprint(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // First get the sprint to know the challenge_id for revalidation
    const { data: sprint } = await supabase
      .from('sprints')
      .select('challenge_id')
      .eq('id', id)
      .single()

    // Remove sprint_id from all assignment usages that reference this sprint
    await supabase
      .from('assignment_usages')
      .update({ sprint_id: null })
      .eq('sprint_id', id)

    // Delete the sprint
    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting sprint:', error)
      return { success: false, error: error.message }
    }

    if (sprint) {
      revalidatePath(`/admin/challenges/${sprint.challenge_id}`)
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting sprint:', err)
    return { success: false, error: 'Failed to delete sprint' }
  }
}

/**
 * Reorder sprints
 */
export async function reorderSprints(sprintIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Update positions for all sprints
    const updates = sprintIds.map((id, index) =>
      supabase
        .from('sprints')
        .update({ position: index })
        .eq('id', id)
    )

    const results = await Promise.all(updates)
    const error = results.find((r) => r.error)?.error

    if (error) {
      console.error('Error reordering sprints:', error)
      return { success: false, error: error.message }
    }

    // Get challenge_id for revalidation from first sprint
    if (sprintIds.length > 0) {
      const { data } = await supabase
        .from('sprints')
        .select('challenge_id')
        .eq('id', sprintIds[0])
        .single()

      if (data) {
        revalidatePath(`/admin/challenges/${data.challenge_id}`)
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error reordering sprints:', err)
    return { success: false, error: 'Failed to reorder sprints' }
  }
}

/**
 * Move an assignment usage to a sprint (or remove from sprint)
 */
export async function assignUsageToSprint(
  usageId: string,
  sprintId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('assignment_usages')
      .update({ sprint_id: sprintId })
      .eq('id', usageId)
      .select('challenge_id')
      .single()

    if (error) {
      console.error('Error assigning usage to sprint:', error)
      return { success: false, error: error.message }
    }

    if (data) {
      revalidatePath(`/admin/challenges/${data.challenge_id}`)
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error assigning usage to sprint:', err)
    return { success: false, error: 'Failed to assign to sprint' }
  }
}
