'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Milestone, MilestoneInsert, MilestoneUpdate } from '@/lib/types/database'

export type MilestoneActionResult =
  | { success: true; data: Milestone }
  | { success: false; error: string }

export type MilestonesListResult =
  | { success: true; data: Milestone[] }
  | { success: false; error: string }

/**
 * Fetch all milestones for a challenge
 */
export async function getMilestonesForChallenge(challengeId: string): Promise<MilestonesListResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching milestones:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Milestone[] }
  } catch (err) {
    console.error('Unexpected error fetching milestones:', err)
    return { success: false, error: 'Failed to fetch milestones' }
  }
}

/**
 * Fetch a single milestone by ID
 */
export async function getMilestone(id: string): Promise<MilestoneActionResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching milestone:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Milestone }
  } catch (err) {
    console.error('Unexpected error fetching milestone:', err)
    return { success: false, error: 'Failed to fetch milestone' }
  }
}

/**
 * Get the next position for a new milestone
 */
async function getNextMilestonePosition(challengeId: string): Promise<number> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('milestones')
    .select('position')
    .eq('challenge_id', challengeId)
    .order('position', { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    return data[0].position + 1
  }

  return 0
}

/**
 * Create a new milestone
 */
export async function createMilestone(input: MilestoneInsert): Promise<MilestoneActionResult> {
  try {
    const supabase = createAdminClient()

    // Get next position if not provided
    const position = input.position ?? await getNextMilestonePosition(input.challenge_id)

    const { data, error } = await supabase
      .from('milestones')
      .insert({
        challenge_id: input.challenge_id,
        name: input.name,
        description: input.description ?? null,
        trigger_type: input.trigger_type,
        trigger_value: input.trigger_value,
        celebration_type: input.celebration_type,
        celebration_content: input.celebration_content ?? null,
        position,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating milestone:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/challenges/${input.challenge_id}`)
    return { success: true, data: data as Milestone }
  } catch (err) {
    console.error('Unexpected error creating milestone:', err)
    return { success: false, error: 'Failed to create milestone' }
  }
}

/**
 * Update an existing milestone
 */
export async function updateMilestone(id: string, input: MilestoneUpdate): Promise<MilestoneActionResult> {
  try {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.trigger_type !== undefined) updateData.trigger_type = input.trigger_type
    if (input.trigger_value !== undefined) updateData.trigger_value = input.trigger_value
    if (input.celebration_type !== undefined) updateData.celebration_type = input.celebration_type
    if (input.celebration_content !== undefined) updateData.celebration_content = input.celebration_content
    if (input.position !== undefined) updateData.position = input.position

    const { data, error } = await supabase
      .from('milestones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating milestone:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/challenges/${data.challenge_id}`)
    return { success: true, data: data as Milestone }
  } catch (err) {
    console.error('Unexpected error updating milestone:', err)
    return { success: false, error: 'Failed to update milestone' }
  }
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // First get the milestone to know the challenge_id for revalidation
    const { data: milestone } = await supabase
      .from('milestones')
      .select('challenge_id')
      .eq('id', id)
      .single()

    // Delete the milestone
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting milestone:', error)
      return { success: false, error: error.message }
    }

    if (milestone) {
      revalidatePath(`/admin/challenges/${milestone.challenge_id}`)
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting milestone:', err)
    return { success: false, error: 'Failed to delete milestone' }
  }
}

/**
 * Reorder milestones
 */
export async function reorderMilestones(milestoneIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Update positions for all milestones
    const updates = milestoneIds.map((id, index) =>
      supabase
        .from('milestones')
        .update({ position: index })
        .eq('id', id)
    )

    const results = await Promise.all(updates)
    const error = results.find((r) => r.error)?.error

    if (error) {
      console.error('Error reordering milestones:', error)
      return { success: false, error: error.message }
    }

    // Get challenge_id for revalidation from first milestone
    if (milestoneIds.length > 0) {
      const { data } = await supabase
        .from('milestones')
        .select('challenge_id')
        .eq('id', milestoneIds[0])
        .single()

      if (data) {
        revalidatePath(`/admin/challenges/${data.challenge_id}`)
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error reordering milestones:', err)
    return { success: false, error: 'Failed to reorder milestones' }
  }
}
