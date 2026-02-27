'use server'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import type {
  Participant,
  ParticipantUpdate,
  ChallengeEnrollment,
  AssignmentProgress,
  AssignmentProgressUpdate,
  MilestoneAchievement,
  QuizResponse,
  ParticipantDashboardStats,
  EnrolledChallengeWithProgress,
  AssignmentWithProgress,
  SprintProgress,
} from '@/lib/types/database'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

const PARTICIPANT_COOKIE = 'participant_id'

// =============================================================================
// Participant Identification (email-based, cookie-backed)
// =============================================================================

/**
 * Read participant from the cookie. Returns null if no cookie or not found.
 */
export async function getParticipantFromCookie(): Promise<Participant | null> {
  try {
    const cookieStore = await cookies()
    const participantId = cookieStore.get(PARTICIPANT_COOKIE)?.value
    if (!participantId) return null

    const supabase = createAdminClient()
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single()

    return data || null
  } catch {
    return null
  }
}

/**
 * Look up or create a participant by email, then set the cookie.
 */
export async function identifyParticipant(email: string): Promise<ActionResult<Participant>> {
  try {
    const normalized = email.toLowerCase().trim()
    if (!normalized || !normalized.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('participants')
      .select('*')
      .eq('email', normalized)
      .single()

    let participant: Participant

    if (existing) {
      participant = existing
    } else {
      const { data: created, error } = await supabase
        .from('participants')
        .insert({
          email: normalized,
          show_in_leaderboard: true,
          show_progress_publicly: false,
        })
        .select()
        .single()

      if (error || !created) {
        return { success: false, error: error?.message || 'Failed to create participant' }
      }
      participant = created
    }

    const cookieStore = await cookies()
    cookieStore.set(PARTICIPANT_COOKIE, participant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })

    return { success: true, data: participant }
  } catch (error) {
    return { success: false, error: 'Failed to identify participant' }
  }
}

/**
 * Check if a participant cookie is set (for client-side checks).
 */
export async function hasParticipantCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    return !!cookieStore.get(PARTICIPANT_COOKIE)?.value
  } catch {
    return false
  }
}

/**
 * Get current participant (without creating). Reads from cookie.
 */
export async function getCurrentParticipant(): Promise<ActionResult<Participant | null>> {
  const participant = await getParticipantFromCookie()
  return { success: true, data: participant }
}

/**
 * Update participant profile
 */
export async function updateParticipant(
  update: ParticipantUpdate
): Promise<ActionResult<Participant>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('participants')
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq('id', participant.id)
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

export async function getParticipantDashboardStats(): Promise<ActionResult<ParticipantDashboardStats>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

    const { count: enrolledCount } = await supabase
      .from('challenge_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', participant.id)
      .is('completed_at', null)

    const { data: progressData } = await supabase
      .from('assignment_progress')
      .select('status')
      .eq('participant_id', participant.id)

    const completedAssignments = progressData?.filter(p => p.status === 'completed').length ?? 0

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

    const { count: achievementsCount } = await supabase
      .from('milestone_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', participant.id)

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

  const uniqueDates = [...new Set(
    completions.map(c => new Date(c.completed_at!).toDateString())
  )]

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < uniqueDates.length; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)

    if (uniqueDates.includes(checkDate.toDateString())) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

// =============================================================================
// Challenge Enrollment
// =============================================================================

export async function getEnrolledChallenges(): Promise<ActionResult<EnrolledChallengeWithProgress[]>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

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

    const enrollmentsWithProgress: EnrolledChallengeWithProgress[] = await Promise.all(
      (enrollments || []).map(async (enrollment) => {
        const { count: totalCount } = await supabase
          .from('assignment_usages')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', enrollment.challenge_id)
          .eq('is_visible', true)

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

export async function enrollInChallenge(
  challengeId: string
): Promise<ActionResult<ChallengeEnrollment>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('challenge_enrollments')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('challenge_id', challengeId)
      .single()

    if (existing) {
      return { success: true, data: existing }
    }

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

    await initializeSprintProgress(challengeId, participant.id)

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to enroll in challenge' }
  }
}

export async function getAvailableChallenges(): Promise<ActionResult<any[]>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

    const { data: enrollments } = await supabase
      .from('challenge_enrollments')
      .select('challenge_id')
      .eq('participant_id', participant.id)

    const enrolledIds = enrollments?.map(e => e.challenge_id) ?? []

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

export async function getChallengePreview(challengeId: string): Promise<ActionResult<{
  challenge: any
  isEnrolled: boolean
  assignmentCount: number
  sprintCount: number
  estimatedDuration: string
}>> {
  try {
    const participant = await getParticipantFromCookie()
    const supabase = createAdminClient()

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

    let isEnrolled = false
    if (participant) {
      const { data: enrollment } = await supabase
        .from('challenge_enrollments')
        .select('id')
        .eq('participant_id', participant.id)
        .eq('challenge_id', challengeId)
        .single()

      isEnrolled = !!enrollment
    }

    const { count: assignmentCount } = await supabase
      .from('assignment_usages')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)

    const { count: sprintCount } = await supabase
      .from('sprints')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)

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

export async function isEnrolledInChallenge(challengeId: string): Promise<ActionResult<boolean>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: true, data: false }
    }

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

export async function getChallengeAssignmentsWithProgress(
  challengeId: string
): Promise<ActionResult<AssignmentWithProgress[]>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

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

    const usageIds = usages?.map(u => u.id) ?? []

    const { data: progressData } = await supabase
      .from('assignment_progress')
      .select('*')
      .eq('participant_id', participant.id)
      .in('assignment_usage_id', usageIds)

    const progressMap = new Map(
      (progressData || []).map(p => [p.assignment_usage_id, p])
    )

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

export async function startAssignment(
  assignmentUsageId: string
): Promise<ActionResult<AssignmentProgress>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('assignment_progress')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('assignment_usage_id', assignmentUsageId)
      .single()

    if (existing) {
      return { success: true, data: existing }
    }

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

export async function completeAssignment(
  assignmentUsageId: string,
  quizResponses?: QuizResponse[]
): Promise<ActionResult<AssignmentProgress & { sprintCompletion?: SprintCompletionResult }>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

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

    await checkMilestoneAchievements(participant.id, assignmentUsageId)

    let sprintCompletion: SprintCompletionResult | undefined
    const { data: usage } = await supabase
      .from('assignment_usages')
      .select('sprint_id, challenge_id')
      .eq('id', assignmentUsageId)
      .single()

    if (usage?.sprint_id) {
      const result = await completeSprintIfDone(usage.sprint_id, usage.challenge_id)
      if (result.success) {
        sprintCompletion = result.data
      }
    }

    return { success: true, data: { ...data, sprintCompletion } }
  } catch (error) {
    return { success: false, error: 'Failed to complete assignment' }
  }
}

export async function saveQuizResponses(
  assignmentUsageId: string,
  responses: QuizResponse[]
): Promise<ActionResult<AssignmentProgress>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

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

  const { data: usage } = await supabase
    .from('assignment_usages')
    .select('challenge_id, assignment_id')
    .eq('id', completedUsageId)
    .single()

  if (!usage) return

  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('challenge_id', usage.challenge_id)

  if (!milestones) return

  for (const milestone of milestones) {
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
        achieved = usage.assignment_id === milestone.trigger_value ||
                   completedUsageId === milestone.trigger_value
        break

      case 'percentage':
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

export async function getAchievements(): Promise<ActionResult<(MilestoneAchievement & { milestone: any })[]>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

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

export async function getChallengeLeaderboard(
  challengeId: string
): Promise<ActionResult<{
  leaderboard: LeaderboardEntry[]
  currentUserRank: number | null
  totalParticipants: number
}>> {
  try {
    const currentParticipant = await getParticipantFromCookie()
    const supabase = createAdminClient()

    const { count: totalAssignments } = await supabase
      .from('assignment_usages')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)

    const total = totalAssignments ?? 0

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

    const { data: usages } = await supabase
      .from('assignment_usages')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)

    const usageIds = usages?.map(u => u.id) ?? []

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
        isCurrentUser: currentParticipant ? enrollment.participant_id === currentParticipant.id : false,
        completedCount,
        progressPercentage,
        completedAt: enrollment.completed_at,
        lastActivityAt,
      })
    }

    leaderboardData.sort((a, b) => {
      if (a.completedAt && !b.completedAt) return -1
      if (!a.completedAt && b.completedAt) return 1
      if (a.completedAt && b.completedAt) {
        return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      }

      if (b.progressPercentage !== a.progressPercentage) {
        return b.progressPercentage - a.progressPercentage
      }

      if (a.lastActivityAt && b.lastActivityAt) {
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      }
      if (a.lastActivityAt) return -1
      if (b.lastActivityAt) return 1

      return 0
    })

    const leaderboard: LeaderboardEntry[] = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      totalCount: total,
    }))

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
// Sprint Progress (Individual Mode)
// =============================================================================

export async function initializeSprintProgress(
  challengeId: string,
  participantId: string
): Promise<void> {
  const supabase = createAdminClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('sequential_sprints')
    .eq('id', challengeId)
    .single()

  const { data: sprints } = await supabase
    .from('sprints')
    .select('id, position')
    .eq('challenge_id', challengeId)
    .order('position', { ascending: true })

  if (!sprints || sprints.length === 0) return

  const isSequential = challenge?.sequential_sprints ?? false
  const now = new Date().toISOString()

  const rows = sprints.map((sprint, index) => {
    const isFirst = index === 0
    const shouldUnlock = !isSequential || isFirst

    return {
      participant_id: participantId,
      sprint_id: sprint.id,
      status: shouldUnlock ? 'unlocked' : 'locked',
      unlocked_at: shouldUnlock ? now : null,
    }
  })

  await supabase
    .from('sprint_progress')
    .upsert(rows, { onConflict: 'participant_id,sprint_id', ignoreDuplicates: true })
}

export async function getSprintProgressForChallenge(
  challengeId: string
): Promise<ActionResult<SprintProgress[]>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

    const { data: sprints } = await supabase
      .from('sprints')
      .select('id')
      .eq('challenge_id', challengeId)

    if (!sprints || sprints.length === 0) {
      return { success: true, data: [] }
    }

    const sprintIds = sprints.map(s => s.id)

    const { data, error } = await supabase
      .from('sprint_progress')
      .select('*')
      .eq('participant_id', participant.id)
      .in('sprint_id', sprintIds)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data || []) as SprintProgress[] }
  } catch (error) {
    return { success: false, error: 'Failed to get sprint progress' }
  }
}

export interface SprintCompletionResult {
  sprintCompleted: boolean
  nextSprintUnlocked: boolean
}

export async function completeSprintIfDone(
  sprintId: string,
  challengeId: string
): Promise<ActionResult<SprintCompletionResult>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

    const { data: usages } = await supabase
      .from('assignment_usages')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('sprint_id', sprintId)
      .eq('is_visible', true)

    if (!usages || usages.length === 0) {
      return { success: true, data: { sprintCompleted: false, nextSprintUnlocked: false } }
    }

    const usageIds = usages.map(u => u.id)

    const { count: completedCount } = await supabase
      .from('assignment_progress')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', participant.id)
      .in('assignment_usage_id', usageIds)
      .eq('status', 'completed')

    const allDone = (completedCount ?? 0) >= usages.length

    if (!allDone) {
      await supabase
        .from('sprint_progress')
        .update({ status: 'in_progress' })
        .eq('participant_id', participant.id)
        .eq('sprint_id', sprintId)
        .in('status', ['unlocked'])

      return { success: true, data: { sprintCompleted: false, nextSprintUnlocked: false } }
    }

    const now = new Date().toISOString()
    await supabase
      .from('sprint_progress')
      .update({ status: 'completed', completed_at: now })
      .eq('participant_id', participant.id)
      .eq('sprint_id', sprintId)

    const { data: challenge } = await supabase
      .from('challenges')
      .select('sequential_sprints')
      .eq('id', challengeId)
      .single()

    let nextSprintUnlocked = false

    if (challenge?.sequential_sprints) {
      const { data: currentSprint } = await supabase
        .from('sprints')
        .select('position')
        .eq('id', sprintId)
        .single()

      if (currentSprint) {
        const { data: nextSprint } = await supabase
          .from('sprints')
          .select('id')
          .eq('challenge_id', challengeId)
          .gt('position', currentSprint.position)
          .order('position', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (nextSprint) {
          const { data: updated } = await supabase
            .from('sprint_progress')
            .update({ status: 'unlocked', unlocked_at: now })
            .eq('participant_id', participant.id)
            .eq('sprint_id', nextSprint.id)
            .eq('status', 'locked')
            .select()
            .single()

          nextSprintUnlocked = !!updated
        }
      }
    }

    return { success: true, data: { sprintCompleted: true, nextSprintUnlocked } }
  } catch (error) {
    return { success: false, error: 'Failed to check sprint completion' }
  }
}

// =============================================================================
// Recent Activity
// =============================================================================

export async function getRecentActivity(
  limit: number = 10
): Promise<ActionResult<{ type: string; title: string; timestamp: string }[]>> {
  try {
    const participant = await getParticipantFromCookie()
    if (!participant) {
      return { success: false, error: 'Not identified' }
    }

    const supabase = createAdminClient()

    const { data: completions } = await supabase
      .from('assignment_progress')
      .select('completed_at, assignment_usage_id')
      .eq('participant_id', participant.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit)

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

    const { data: achievements } = await supabase
      .from('milestone_achievements')
      .select('achieved_at, milestone:milestones(name)')
      .eq('participant_id', participant.id)
      .order('achieved_at', { ascending: false })
      .limit(limit)

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

    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return { success: true, data: activities.slice(0, limit) }
  } catch (error) {
    return { success: false, error: 'Failed to get recent activity' }
  }
}
