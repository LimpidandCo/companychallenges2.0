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

// =============================================================================
// Milestone Trigger System
// =============================================================================

export type TriggeredMilestone = Milestone & { alreadyAchieved: boolean }

export type CheckMilestonesResult =
  | { success: true; data: { triggered: Milestone[]; alreadyAchieved: Milestone[] } }
  | { success: false; error: string }

/**
 * Check which milestones should be triggered for a participant after an action
 * This doesn't award them - just identifies which ones should trigger
 */
export async function checkMilestonesForParticipant(
  participantId: string,
  challengeId: string,
  context: {
    completedAssignmentId?: string
    completedSprintId?: string
    completionPercentage?: number
  }
): Promise<CheckMilestonesResult> {
  try {
    const supabase = createAdminClient()

    // Get all milestones for this challenge
    const { data: milestones, error: milestoneError } = await supabase
      .from('milestones')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('position', { ascending: true })

    if (milestoneError) {
      return { success: false, error: milestoneError.message }
    }

    // Get already achieved milestones for this participant
    const { data: achievements, error: achievementError } = await supabase
      .from('milestone_achievements')
      .select('milestone_id')
      .eq('participant_id', participantId)

    if (achievementError) {
      return { success: false, error: achievementError.message }
    }

    const achievedIds = new Set(achievements?.map(a => a.milestone_id) || [])

    const triggered: Milestone[] = []
    const alreadyAchieved: Milestone[] = []

    for (const milestone of milestones || []) {
      // Check if already achieved
      if (achievedIds.has(milestone.id)) {
        alreadyAchieved.push(milestone)
        continue
      }

      // Check trigger conditions
      let shouldTrigger = false

      switch (milestone.trigger_type) {
        case 'assignment_complete':
          if (context.completedAssignmentId === milestone.trigger_value) {
            shouldTrigger = true
          }
          break

        case 'sprint_complete':
          if (context.completedSprintId === milestone.trigger_value) {
            shouldTrigger = true
          }
          break

        case 'percentage':
          const targetPercentage = parseInt(milestone.trigger_value, 10)
          if (context.completionPercentage && context.completionPercentage >= targetPercentage) {
            shouldTrigger = true
          }
          break

        case 'custom':
          // Custom triggers require manual triggering
          break
      }

      if (shouldTrigger) {
        triggered.push(milestone)
      }
    }

    return { success: true, data: { triggered, alreadyAchieved } }
  } catch (err) {
    console.error('Error checking milestones:', err)
    return { success: false, error: 'Failed to check milestones' }
  }
}

export type AwardMilestoneResult =
  | { success: true; data: { milestoneId: string; achievementId: string } }
  | { success: false; error: string }

/**
 * Award a milestone to a participant
 */
export async function awardMilestone(
  participantId: string,
  milestoneId: string
): Promise<AwardMilestoneResult> {
  try {
    const supabase = createAdminClient()

    // Check if already awarded
    const { data: existing } = await supabase
      .from('milestone_achievements')
      .select('id')
      .eq('participant_id', participantId)
      .eq('milestone_id', milestoneId)
      .single()

    if (existing) {
      return { success: true, data: { milestoneId, achievementId: existing.id } }
    }

    // Award the milestone
    const { data: achievement, error } = await supabase
      .from('milestone_achievements')
      .insert({
        participant_id: participantId,
        milestone_id: milestoneId,
        achieved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { milestoneId, achievementId: achievement.id } }
  } catch (err) {
    console.error('Error awarding milestone:', err)
    return { success: false, error: 'Failed to award milestone' }
  }
}

/**
 * Process milestone triggers after an assignment completion
 * Returns any newly triggered milestones
 */
export async function processAssignmentCompletion(
  participantId: string,
  challengeId: string,
  assignmentId: string
): Promise<{ success: true; data: Milestone[] } | { success: false; error: string }> {
  try {
    const supabase = createAdminClient()

    // Calculate completion percentage
    const { data: allUsages } = await supabase
      .from('assignment_usages')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)

    const { data: completedProgress } = await supabase
      .from('assignment_progress')
      .select('assignment_usage_id')
      .eq('participant_id', participantId)
      .eq('status', 'completed')

    const totalUsages = allUsages?.length || 0
    const completedCount = completedProgress?.length || 0
    const completionPercentage = totalUsages > 0 ? Math.round((completedCount / totalUsages) * 100) : 0

    // Check if this assignment completes a sprint
    const { data: usage } = await supabase
      .from('assignment_usages')
      .select('sprint_id')
      .eq('assignment_id', assignmentId)
      .eq('challenge_id', challengeId)
      .single()

    let completedSprintId: string | undefined

    if (usage?.sprint_id) {
      // Get all usages in this sprint
      const { data: sprintUsages } = await supabase
        .from('assignment_usages')
        .select('id')
        .eq('sprint_id', usage.sprint_id)
        .eq('is_visible', true)

      const sprintUsageIds = new Set(sprintUsages?.map(u => u.id) || [])
      const completedUsageIds = new Set(completedProgress?.map(p => p.assignment_usage_id) || [])

      // Check if all sprint usages are completed
      const allSprintCompleted = [...sprintUsageIds].every(id => completedUsageIds.has(id))
      if (allSprintCompleted) {
        completedSprintId = usage.sprint_id
      }
    }

    // Check milestones
    const checkResult = await checkMilestonesForParticipant(participantId, challengeId, {
      completedAssignmentId: assignmentId,
      completedSprintId,
      completionPercentage,
    })

    if (!checkResult.success) {
      return { success: false, error: checkResult.error }
    }

    // Award triggered milestones
    const awardedMilestones: Milestone[] = []

    for (const milestone of checkResult.data.triggered) {
      const awardResult = await awardMilestone(participantId, milestone.id)
      if (awardResult.success) {
        awardedMilestones.push(milestone)
      }
    }

    return { success: true, data: awardedMilestones }
  } catch (err) {
    console.error('Error processing assignment completion:', err)
    return { success: false, error: 'Failed to process milestones' }
  }
}

/**
 * Get all achieved milestones for a participant in a challenge
 */
export async function getAchievedMilestones(
  participantId: string,
  challengeId: string
): Promise<{ success: true; data: Milestone[] } | { success: false; error: string }> {
  try {
    const supabase = createAdminClient()

    // Get milestone IDs achieved by participant
    const { data: achievements, error: achievementError } = await supabase
      .from('milestone_achievements')
      .select('milestone_id')
      .eq('participant_id', participantId)

    if (achievementError) {
      return { success: false, error: achievementError.message }
    }

    if (!achievements || achievements.length === 0) {
      return { success: true, data: [] }
    }

    // Get the actual milestones for this challenge
    const milestoneIds = achievements.map(a => a.milestone_id)
    
    const { data: milestones, error: milestoneError } = await supabase
      .from('milestones')
      .select('*')
      .eq('challenge_id', challengeId)
      .in('id', milestoneIds)
      .order('position', { ascending: true })

    if (milestoneError) {
      return { success: false, error: milestoneError.message }
    }

    return { success: true, data: (milestones || []) as Milestone[] }
  } catch (err) {
    console.error('Error getting achieved milestones:', err)
    return { success: false, error: 'Failed to get achieved milestones' }
  }
}
