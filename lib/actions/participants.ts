'use server'

import { auth } from '@/lib/auth/mock-server-auth'
import { createAdminClient } from '@/lib/supabase/server'
import type {
  Participant,
  ParticipantInsert,
  ParticipantUpdate,
  ChallengeEnrollment,
  AssignmentProgress,
  AssignmentProgressUpdate,
  MilestoneAchievement,
  QuizResponse,
  ParticipantDashboardStats,
  EnrolledChallengeWithProgress,
  AssignmentWithProgress,
} from '@/lib/types/database'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// =============================================================================
// Participant Management
// =============================================================================

/**
 * Get or create participant for current user
 */
export async function getOrCreateCurrentParticipant(): Promise<ActionResult<Participant>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createAdminClient()

    // Try to find existing participant
    const { data: existing, error: findError } = await supabase
      .from('participants')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (existing) {
      return { success: true, data: existing }
    }

    // If not found (and error is "not found"), create new participant
    if (findError && findError.code !== 'PGRST116') {
      return { success: false, error: findError.message }
    }

    // Create new participant
    const { data: newParticipant, error: createError } = await supabase
      .from('participants')
      .insert({
        clerk_user_id: userId,
        show_in_leaderboard: true,
        show_progress_publicly: false,
      })
      .select()
      .single()

    if (createError) {
      return { success: false, error: createError.message }
    }

    return { success: true, data: newParticipant }
  } catch (error) {
    return { success: false, error: 'Failed to get/create participant' }
  }
}

/**
 * Get current participant (without creating)
 */
export async function getCurrentParticipant(): Promise<ActionResult<Participant | null>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || null }
  } catch (error) {
    return { success: false, error: 'Failed to get participant' }
  }
}

/**
 * Update participant profile
 */
export async function updateParticipant(
  update: ParticipantUpdate
): Promise<ActionResult<Participant>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('participants')
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to update participant' }
  }
}

// =============================================================================
// Dashboard Stats
// =============================================================================

/**
 * Get dashboard stats for current participant
 */
export async function getParticipantDashboardStats(): Promise<ActionResult<ParticipantDashboardStats>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Get enrolled challenges count
    const { count: enrolledCount } = await supabase
      .from('challenge_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', participant.id)
      .is('completed_at', null)

    // Get assignment progress counts
    const { data: progressData } = await supabase
      .from('assignment_progress')
      .select('status')
      .eq('participant_id', participant.id)

    const completedAssignments = progressData?.filter(p => p.status === 'completed').length ?? 0

    // Get total assignments in enrolled challenges
    const { data: enrollments } = await supabase
      .from('challenge_enrollments')
      .select('challenge_id')
      .eq('participant_id', participant.id)

    const challengeIds = enrollments?.map(e => e.challenge_id) ?? []

    let totalAssignments = 0
    if (challengeIds.length > 0) {
      const { count } = await supabase
        .from('assignment_usages')
        .select('*', { count: 'exact', head: true })
        .in('challenge_id', challengeIds)
        .eq('is_visible', true)
      totalAssignments = count ?? 0
    }

    // Get achievements count
    const { count: achievementsCount } = await supabase
      .from('milestone_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', participant.id)

    // Calculate streak (simplified - just consecutive days with completions)
    const currentStreak = await calculateStreak(participant.id)

    return {
      success: true,
      data: {
        enrolledChallenges: enrolledCount ?? 0,
        completedAssignments,
        totalAssignments,
        achievementsEarned: achievementsCount ?? 0,
        currentStreak,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to get dashboard stats' }
  }
}

async function calculateStreak(participantId: string): Promise<number> {
  const supabase = createAdminClient()

  const { data: completions } = await supabase
    .from('assignment_progress')
    .select('completed_at')
    .eq('participant_id', participantId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(30)

  if (!completions || completions.length === 0) return 0

  // Get unique dates
  const uniqueDates = [...new Set(
    completions.map(c => new Date(c.completed_at!).toDateString())
  )]

  // Check for streak (consecutive days)
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < uniqueDates.length; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)

    if (uniqueDates.includes(checkDate.toDateString())) {
      streak++
    } else if (i > 0) {
      // Allow gap for today if no activity yet
      break
    }
  }

  return streak
}

// =============================================================================
// Challenge Enrollment
// =============================================================================

/**
 * Get enrolled challenges with progress
 */
export async function getEnrolledChallenges(): Promise<ActionResult<EnrolledChallengeWithProgress[]>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Get enrollments with challenge data
    const { data: enrollments, error } = await supabase
      .from('challenge_enrollments')
      .select(`
        *,
        challenge:challenges(
          *,
          client:clients(*)
        )
      `)
      .eq('participant_id', participant.id)
      .order('enrolled_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    // Calculate progress for each enrollment
    const enrollmentsWithProgress: EnrolledChallengeWithProgress[] = await Promise.all(
      (enrollments || []).map(async (enrollment) => {
        // Get total assignments in challenge
        const { count: totalCount } = await supabase
          .from('assignment_usages')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', enrollment.challenge_id)
          .eq('is_visible', true)

        // Get completed assignments
        const { data: usages } = await supabase
          .from('assignment_usages')
          .select('id')
          .eq('challenge_id', enrollment.challenge_id)
          .eq('is_visible', true)

        const usageIds = usages?.map(u => u.id) ?? []

        let completedCount = 0
        if (usageIds.length > 0) {
          const { count } = await supabase
            .from('assignment_progress')
            .select('*', { count: 'exact', head: true })
            .eq('participant_id', participant.id)
            .in('assignment_usage_id', usageIds)
            .eq('status', 'completed')
          completedCount = count ?? 0
        }

        const total = totalCount ?? 0
        const progressPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0

        return {
          ...enrollment,
          completedCount,
          totalCount: total,
          progressPercentage,
        }
      })
    )

    return { success: true, data: enrollmentsWithProgress }
  } catch (error) {
    return { success: false, error: 'Failed to get enrolled challenges' }
  }
}

/**
 * Enroll in a challenge
 */
export async function enrollInChallenge(
  challengeId: string
): Promise<ActionResult<ChallengeEnrollment>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('challenge_enrollments')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('challenge_id', challengeId)
      .single()

    if (existing) {
      return { success: true, data: existing }
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('challenge_enrollments')
      .insert({
        participant_id: participant.id,
        challenge_id: challengeId,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to enroll in challenge' }
  }
}

/**
 * Get available challenges (not enrolled in yet)
 */
export async function getAvailableChallenges(): Promise<ActionResult<any[]>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Get IDs of challenges already enrolled in
    const { data: enrollments } = await supabase
      .from('challenge_enrollments')
      .select('challenge_id')
      .eq('participant_id', participant.id)

    const enrolledIds = enrollments?.map(e => e.challenge_id) ?? []

    // Get all non-archived challenges not yet enrolled in
    let query = supabase
      .from('challenges')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (enrolledIds.length > 0) {
      query = query.not('id', 'in', `(${enrolledIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // Add assignment count for each challenge
    const challengesWithCounts = await Promise.all(
      (data || []).map(async (challenge) => {
        const { count } = await supabase
          .from('assignment_usages')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id)
          .eq('is_visible', true)

        return {
          ...challenge,
          assignmentCount: count ?? 0,
        }
      })
    )

    return { success: true, data: challengesWithCounts }
  } catch (error) {
    return { success: false, error: 'Failed to get available challenges' }
  }
}

/**
 * Get challenge preview (for enrollment page)
 */
export async function getChallengePreview(challengeId: string): Promise<ActionResult<{
  challenge: any
  isEnrolled: boolean
  assignmentCount: number
  sprintCount: number
  estimatedDuration: string
}>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Get challenge details
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', challengeId)
      .single()

    if (error || !challenge) {
      return { success: false, error: 'Challenge not found' }
    }

    // Check if enrolled
    const { data: enrollment } = await supabase
      .from('challenge_enrollments')
      .select('id')
      .eq('participant_id', participant.id)
      .eq('challenge_id', challengeId)
      .single()

    const isEnrolled = !!enrollment

    // Get assignment count
    const { count: assignmentCount } = await supabase
      .from('assignment_usages')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)

    // Get sprint count
    const { count: sprintCount } = await supabase
      .from('sprints')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)

    // Estimate duration (rough: 10-15 min per assignment)
    const totalAssignments = assignmentCount ?? 0
    const estimatedMinutes = totalAssignments * 12
    let estimatedDuration = ''
    if (estimatedMinutes < 60) {
      estimatedDuration = `${estimatedMinutes} min`
    } else {
      const hours = Math.round(estimatedMinutes / 60)
      estimatedDuration = `${hours} hour${hours > 1 ? 's' : ''}`
    }

    return {
      success: true,
      data: {
        challenge,
        isEnrolled,
        assignmentCount: assignmentCount ?? 0,
        sprintCount: sprintCount ?? 0,
        estimatedDuration,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to get challenge preview' }
  }
}

/**
 * Check if participant is enrolled in a challenge
 */
export async function isEnrolledInChallenge(challengeId: string): Promise<ActionResult<boolean>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('challenge_enrollments')
      .select('id')
      .eq('participant_id', participant.id)
      .eq('challenge_id', challengeId)
      .single()

    return { success: true, data: !!data }
  } catch (error) {
    return { success: false, error: 'Failed to check enrollment' }
  }
}

// =============================================================================
// Assignment Progress
// =============================================================================

/**
 * Get assignments with progress for a challenge
 */
export async function getChallengeAssignmentsWithProgress(
  challengeId: string
): Promise<ActionResult<AssignmentWithProgress[]>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Get assignment usages with assignment details
    const { data: usages, error } = await supabase
      .from('assignment_usages')
      .select(`
        *,
        assignment:assignments(*),
        sprint:sprints(*)
      `)
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)
      .order('position')

    if (error) {
      return { success: false, error: error.message }
    }

    // Get progress for each usage
    const usageIds = usages?.map(u => u.id) ?? []

    const { data: progressData } = await supabase
      .from('assignment_progress')
      .select('*')
      .eq('participant_id', participant.id)
      .in('assignment_usage_id', usageIds)

    const progressMap = new Map(
      (progressData || []).map(p => [p.assignment_usage_id, p])
    )

    // Get micro quizzes for assignments
    const assignmentIds = [...new Set(usages?.map(u => u.assignment_id) ?? [])]

    const { data: quizzes } = await supabase
      .from('micro_quizzes')
      .select('*')
      .in('assignment_id', assignmentIds)
      .order('position')

    const quizMap = new Map<string, typeof quizzes>()
    quizzes?.forEach(q => {
      const existing = quizMap.get(q.assignment_id) || []
      quizMap.set(q.assignment_id, [...existing, q])
    })

    const assignmentsWithProgress: AssignmentWithProgress[] = (usages || []).map(usage => ({
      ...usage,
      progress: progressMap.get(usage.id) || null,
      micro_quizzes: quizMap.get(usage.assignment_id) || [],
    }))

    return { success: true, data: assignmentsWithProgress }
  } catch (error) {
    return { success: false, error: 'Failed to get assignments with progress' }
  }
}

/**
 * Start an assignment
 */
export async function startAssignment(
  assignmentUsageId: string
): Promise<ActionResult<AssignmentProgress>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Check if already started
    const { data: existing } = await supabase
      .from('assignment_progress')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('assignment_usage_id', assignmentUsageId)
      .single()

    if (existing) {
      return { success: true, data: existing }
    }

    // Create progress record
    const { data, error } = await supabase
      .from('assignment_progress')
      .insert({
        participant_id: participant.id,
        assignment_usage_id: assignmentUsageId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Update last assignment in enrollment
    const { data: usage } = await supabase
      .from('assignment_usages')
      .select('challenge_id')
      .eq('id', assignmentUsageId)
      .single()

    if (usage) {
      await supabase
        .from('challenge_enrollments')
        .update({ last_assignment_id: assignmentUsageId })
        .eq('participant_id', participant.id)
        .eq('challenge_id', usage.challenge_id)
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to start assignment' }
  }
}

/**
 * Complete an assignment
 */
export async function completeAssignment(
  assignmentUsageId: string,
  quizResponses?: QuizResponse[]
): Promise<ActionResult<AssignmentProgress>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Get or create progress record
    const { data: existing } = await supabase
      .from('assignment_progress')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('assignment_usage_id', assignmentUsageId)
      .single()

    const now = new Date().toISOString()
    const updateData: AssignmentProgressUpdate = {
      status: 'completed',
      completed_at: now,
      quiz_responses: quizResponses || null,
    }

    let data: AssignmentProgress

    if (existing) {
      const { data: updated, error } = await supabase
        .from('assignment_progress')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }
      data = updated
    } else {
      const { data: created, error } = await supabase
        .from('assignment_progress')
        .insert({
          participant_id: participant.id,
          assignment_usage_id: assignmentUsageId,
          status: 'completed',
          started_at: now,
          completed_at: now,
          quiz_responses: quizResponses || null,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }
      data = created
    }

    // Check for milestone achievements
    await checkMilestoneAchievements(participant.id, assignmentUsageId)

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to complete assignment' }
  }
}

/**
 * Save quiz responses
 */
export async function saveQuizResponses(
  assignmentUsageId: string,
  responses: QuizResponse[]
): Promise<ActionResult<AssignmentProgress>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Get existing progress
    const { data: existing } = await supabase
      .from('assignment_progress')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('assignment_usage_id', assignmentUsageId)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('assignment_progress')
        .update({
          quiz_responses: responses,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true, data }
    }

    // Create new progress with responses
    const { data, error } = await supabase
      .from('assignment_progress')
      .insert({
        participant_id: participant.id,
        assignment_usage_id: assignmentUsageId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        quiz_responses: responses,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to save quiz responses' }
  }
}

// =============================================================================
// Milestone Achievements
// =============================================================================

async function checkMilestoneAchievements(
  participantId: string,
  completedUsageId: string
): Promise<void> {
  const supabase = createAdminClient()

  // Get the usage to find the challenge
  const { data: usage } = await supabase
    .from('assignment_usages')
    .select('challenge_id, assignment_id')
    .eq('id', completedUsageId)
    .single()

  if (!usage) return

  // Get milestones for this challenge
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('challenge_id', usage.challenge_id)

  if (!milestones) return

  // Check each milestone
  for (const milestone of milestones) {
    // Skip if already achieved
    const { data: existing } = await supabase
      .from('milestone_achievements')
      .select('id')
      .eq('participant_id', participantId)
      .eq('milestone_id', milestone.id)
      .single()

    if (existing) continue

    let achieved = false

    switch (milestone.trigger_type) {
      case 'assignment_complete':
        // Check if specific assignment is completed
        achieved = usage.assignment_id === milestone.trigger_value ||
                   completedUsageId === milestone.trigger_value
        break

      case 'percentage':
        // Check percentage completion
        const targetPercentage = parseInt(milestone.trigger_value, 10)
        const { count: total } = await supabase
          .from('assignment_usages')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', usage.challenge_id)
          .eq('is_visible', true)

        const { data: usageIds } = await supabase
          .from('assignment_usages')
          .select('id')
          .eq('challenge_id', usage.challenge_id)
          .eq('is_visible', true)

        if (usageIds) {
          const { count: completed } = await supabase
            .from('assignment_progress')
            .select('*', { count: 'exact', head: true })
            .eq('participant_id', participantId)
            .in('assignment_usage_id', usageIds.map(u => u.id))
            .eq('status', 'completed')

          const percentage = (total || 0) > 0 ? ((completed || 0) / (total || 1)) * 100 : 0
          achieved = percentage >= targetPercentage
        }
        break

      // Add more trigger types as needed
    }

    if (achieved) {
      await supabase
        .from('milestone_achievements')
        .insert({
          participant_id: participantId,
          milestone_id: milestone.id,
          achieved_at: new Date().toISOString(),
        })
    }
  }
}

/**
 * Get achievements for current participant
 */
export async function getAchievements(): Promise<ActionResult<(MilestoneAchievement & { milestone: any })[]>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('milestone_achievements')
      .select(`
        *,
        milestone:milestones(*)
      `)
      .eq('participant_id', participant.id)
      .order('achieved_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: 'Failed to get achievements' }
  }
}

// =============================================================================
// Leaderboard
// =============================================================================

export interface LeaderboardEntry {
  rank: number
  participantId: string
  displayName: string
  isCurrentUser: boolean
  completedCount: number
  totalCount: number
  progressPercentage: number
  completedAt: string | null
  lastActivityAt: string | null
}

/**
 * Get leaderboard for a challenge
 */
export async function getChallengeLeaderboard(
  challengeId: string
): Promise<ActionResult<{
  leaderboard: LeaderboardEntry[]
  currentUserRank: number | null
  totalParticipants: number
}>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const currentParticipant = participantResult.data
    const supabase = createAdminClient()

    // Get total assignments in challenge
    const { count: totalAssignments } = await supabase
      .from('assignment_usages')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)

    const total = totalAssignments ?? 0

    // Get all enrollments with participant data (only those who opted into leaderboard)
    const { data: enrollments, error } = await supabase
      .from('challenge_enrollments')
      .select(`
        id,
        participant_id,
        completed_at,
        enrolled_at,
        participant:participants!inner(
          id,
          display_name,
          show_in_leaderboard
        )
      `)
      .eq('challenge_id', challengeId)
      .eq('participants.show_in_leaderboard', true)

    if (error) {
      return { success: false, error: error.message }
    }

    // Get assignment usages for this challenge
    const { data: usages } = await supabase
      .from('assignment_usages')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)

    const usageIds = usages?.map(u => u.id) ?? []

    // Calculate progress for each participant
    const leaderboardData: {
      participantId: string
      displayName: string
      isCurrentUser: boolean
      completedCount: number
      progressPercentage: number
      completedAt: string | null
      lastActivityAt: string | null
    }[] = []

    for (const enrollment of enrollments || []) {
      const participant = enrollment.participant as any

      // Get completed assignments count
      let completedCount = 0
      let lastActivityAt: string | null = null

      if (usageIds.length > 0) {
        const { count, data: progressData } = await supabase
          .from('assignment_progress')
          .select('completed_at', { count: 'exact' })
          .eq('participant_id', enrollment.participant_id)
          .in('assignment_usage_id', usageIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)

        completedCount = count ?? 0

        if (progressData && progressData.length > 0) {
          lastActivityAt = progressData[0].completed_at
        }
      }

      const progressPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0

      leaderboardData.push({
        participantId: enrollment.participant_id,
        displayName: participant.display_name || `Participant ${enrollment.participant_id.slice(0, 6)}`,
        isCurrentUser: enrollment.participant_id === currentParticipant.id,
        completedCount,
        progressPercentage,
        completedAt: enrollment.completed_at,
        lastActivityAt,
      })
    }

    // Sort by: 1) completion status, 2) progress percentage, 3) last activity
    leaderboardData.sort((a, b) => {
      // Completed challenges first (sorted by completion time)
      if (a.completedAt && !b.completedAt) return -1
      if (!a.completedAt && b.completedAt) return 1
      if (a.completedAt && b.completedAt) {
        return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      }

      // Then by progress percentage
      if (b.progressPercentage !== a.progressPercentage) {
        return b.progressPercentage - a.progressPercentage
      }

      // Then by last activity (most recent first)
      if (a.lastActivityAt && b.lastActivityAt) {
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      }
      if (a.lastActivityAt) return -1
      if (b.lastActivityAt) return 1

      return 0
    })

    // Add ranks
    const leaderboard: LeaderboardEntry[] = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      totalCount: total,
    }))

    // Find current user's rank
    const currentUserEntry = leaderboard.find(e => e.isCurrentUser)
    const currentUserRank = currentUserEntry?.rank ?? null

    return {
      success: true,
      data: {
        leaderboard,
        currentUserRank,
        totalParticipants: leaderboard.length,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to get leaderboard' }
  }
}

// =============================================================================
// Recent Activity
// =============================================================================

/**
 * Get recent activity for participant
 */
export async function getRecentActivity(
  limit: number = 10
): Promise<ActionResult<{ type: string; title: string; timestamp: string }[]>> {
  try {
    const participantResult = await getOrCreateCurrentParticipant()
    if (!participantResult.success) {
      return { success: false, error: participantResult.error }
    }

    const participant = participantResult.data
    const supabase = createAdminClient()

    // Get recent completions with assignment details
    const { data: completions } = await supabase
      .from('assignment_progress')
      .select('completed_at, assignment_usage_id')
      .eq('participant_id', participant.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit)

    // Get assignment usage details for completions
    const usageIds = completions?.map(c => c.assignment_usage_id) ?? []
    let usageMap = new Map<string, string>()

    if (usageIds.length > 0) {
      const { data: usages } = await supabase
        .from('assignment_usages')
        .select('id, assignment:assignments(internal_title)')
        .in('id', usageIds)

      usages?.forEach((u: any) => {
        if (u.assignment?.internal_title) {
          usageMap.set(u.id, u.assignment.internal_title)
        }
      })
    }

    // Get recent achievements
    const { data: achievements } = await supabase
      .from('milestone_achievements')
      .select('achieved_at, milestone:milestones(name)')
      .eq('participant_id', participant.id)
      .order('achieved_at', { ascending: false })
      .limit(limit)

    // Combine and sort
    const activities: { type: string; title: string; timestamp: string }[] = []

    completions?.forEach(c => {
      const title = usageMap.get(c.assignment_usage_id)
      if (c.completed_at && title) {
        activities.push({
          type: 'assignment_completed',
          title: `Completed: ${title}`,
          timestamp: c.completed_at,
        })
      }
    })

    achievements?.forEach((a: any) => {
      if (a.achieved_at && a.milestone?.name) {
        activities.push({
          type: 'milestone_achieved',
          title: `Achievement: ${a.milestone.name}`,
          timestamp: a.achieved_at,
        })
      }
    })

    // Sort by timestamp
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return { success: true, data: activities.slice(0, limit) }
  } catch (error) {
    return { success: false, error: 'Failed to get recent activity' }
  }
}
