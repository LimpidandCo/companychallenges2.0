'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type {
  AssignmentUsage,
  AssignmentUsageInsert,
  AssignmentUsageUpdate,
  AssignmentUsageWithAssignment,
} from '@/lib/types/database'

type AssignmentUsagesListResult =
  | { success: true; data: AssignmentUsageWithAssignment[] }
  | { success: false; error: string }

type AssignmentUsageActionResult =
  | { success: true; data: AssignmentUsage }
  | { success: false; error: string }

/**
 * Get all assignment usages for a challenge, ordered by position.
 */
export async function getAssignmentUsages(
  challengeId: string
): Promise<AssignmentUsagesListResult> {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('assignment_usages')
      .select(`
        *,
        assignment:assignments(*)
      `)
      .eq('challenge_id', challengeId)
      .order('position', { ascending: true })

    if (error) {
      console.error('[getAssignmentUsages] Database error:', error)
      return { success: false, error: 'Failed to load assignment usages' }
    }

    return { success: true, data: data as AssignmentUsageWithAssignment[] }
  } catch (err) {
    console.error('[getAssignmentUsages] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Add an existing assignment to a challenge.
 */
export async function addAssignmentToChallenge(
  input: AssignmentUsageInsert
): Promise<AssignmentUsageActionResult> {
  try {
    const supabase = await createAdminClient()

    // Get the next position if not provided
    let position = input.position
    if (position === undefined) {
      const { data: existing } = await supabase
        .from('assignment_usages')
        .select('position')
        .eq('challenge_id', input.challenge_id)
        .order('position', { ascending: false })
        .limit(1)

      position = existing && existing.length > 0 ? existing[0].position + 1 : 0
    }

    const { data, error } = await supabase
      .from('assignment_usages')
      .insert({
        challenge_id: input.challenge_id,
        sprint_id: input.sprint_id ?? null,
        assignment_id: input.assignment_id,
        position,
        is_visible: input.is_visible ?? true,
        release_at: input.release_at ?? null,
        label: input.label ?? null,
        is_milestone: input.is_milestone ?? false,
        reveal_style: input.reveal_style ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('[addAssignmentToChallenge] Database error:', error)
      if (error.code === '23505') {
        return { success: false, error: 'This assignment is already in this challenge' }
      }
      return { success: false, error: 'Failed to add assignment to challenge' }
    }

    revalidatePath('/admin/challenges')
    revalidatePath(`/admin/challenges/${input.challenge_id}`)

    return { success: true, data }
  } catch (err) {
    console.error('[addAssignmentToChallenge] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update an assignment usage (position, visibility, scheduling, etc.).
 */
export async function updateAssignmentUsage(
  id: string,
  input: AssignmentUsageUpdate
): Promise<AssignmentUsageActionResult> {
  try {
    const supabase = await createAdminClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.sprint_id !== undefined) updateData.sprint_id = input.sprint_id
    if (input.position !== undefined) updateData.position = input.position
    if (input.is_visible !== undefined) updateData.is_visible = input.is_visible
    if (input.release_at !== undefined) updateData.release_at = input.release_at
    if (input.label !== undefined) updateData.label = input.label
    if (input.is_milestone !== undefined) updateData.is_milestone = input.is_milestone
    if (input.reveal_style !== undefined) updateData.reveal_style = input.reveal_style

    const { data, error } = await supabase
      .from('assignment_usages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[updateAssignmentUsage] Database error:', error)
      return { success: false, error: 'Failed to update assignment usage' }
    }

    revalidatePath('/admin/challenges')

    return { success: true, data }
  } catch (err) {
    console.error('[updateAssignmentUsage] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Remove an assignment from a challenge (does not delete the source assignment).
 */
export async function removeAssignmentFromChallenge(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient()

    // Get the usage to find challenge_id for revalidation
    const { data: usage } = await supabase
      .from('assignment_usages')
      .select('challenge_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('assignment_usages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[removeAssignmentFromChallenge] Database error:', error)
      return { success: false, error: 'Failed to remove assignment from challenge' }
    }

    revalidatePath('/admin/challenges')
    if (usage) {
      revalidatePath(`/admin/challenges/${usage.challenge_id}`)
    }

    return { success: true }
  } catch (err) {
    console.error('[removeAssignmentFromChallenge] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reorder assignments within a challenge.
 */
export async function reorderAssignmentUsages(
  usageIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient()

    // Update each usage with its new position
    const updates = usageIds.map((id, index) =>
      supabase
        .from('assignment_usages')
        .update({ position: index, updated_at: new Date().toISOString() })
        .eq('id', id)
    )

    await Promise.all(updates)

    revalidatePath('/admin/challenges')

    return { success: true }
  } catch (err) {
    console.error('[reorderAssignmentUsages] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
