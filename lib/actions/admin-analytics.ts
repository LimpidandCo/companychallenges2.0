'use server'

import { createAdminClient } from '@/lib/supabase/server'

export interface DateRange {
  from: string // ISO date string
  to: string // ISO date string
}

export interface ClientOption {
  id: string
  name: string
}

export interface ChallengeStats {
  challengeId: string
  challengeName: string
  clientId: string
  clientName: string
  totalViews: number
  uniqueSessions: number
  assignmentViews: number
  mediaPlays: number
  completions: number
}

export interface AssignmentStats {
  assignmentId: string
  assignmentTitle: string
  position: number
  sprintId: string | null
  sprintName: string | null
  views: number
  uniqueSessions: number
  mediaPlays: number
  completions: number
  passwordAttempts: number
  passwordSuccesses: number
}

export interface SprintStats {
  sprintId: string
  sprintName: string
  position: number
  totalViews: number
  uniqueSessions: number
  mediaPlays: number
  completions: number
  assignmentCount: number
  completionRate: number
}

export interface OverviewStats {
  totalChallengeViews: number
  totalAssignmentViews: number
  totalMediaPlays: number
  totalCompletions: number
  uniqueSessions: number
}

export interface ChallengeDetail {
  id: string
  internalName: string
  publicTitle: string | null
  clientId: string
  clientName: string
  slug: string
}

/**
 * Fetch all clients for the filter dropdown
 */
export async function getClientOptions(): Promise<ClientOption[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true })

  if (error || !data) {
    console.error('Error fetching client options:', error)
    return []
  }
  return data
}

/**
 * Get challenge detail for the drill-down header
 */
export async function getChallengeDetail(challengeId: string): Promise<ChallengeDetail | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      id,
      internal_name,
      public_title,
      client_id,
      slug,
      client:clients (name)
    `)
    .eq('id', challengeId)
    .single()

  if (error || !data) {
    console.error('Error fetching challenge detail:', error)
    return null
  }

  const clientData = data.client as { name: string } | { name: string }[] | null
  const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name

  return {
    id: data.id,
    internalName: data.internal_name,
    publicTitle: data.public_title,
    clientId: data.client_id,
    clientName: clientName || 'Unknown',
    slug: data.slug
  }
}

/**
 * Get overview analytics stats
 */
export async function getOverviewStats(dateRange?: DateRange, clientId?: string, challengeId?: string): Promise<OverviewStats> {
  const supabase = createAdminClient()

  let query = supabase.from('analytics_events').select('event_type, session_id')

  if (dateRange) {
    query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to)
  }
  if (clientId) {
    query = query.eq('client_id', clientId)
  }
  if (challengeId) {
    query = query.eq('challenge_id', challengeId)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Error fetching overview stats:', error)
    return {
      totalChallengeViews: 0,
      totalAssignmentViews: 0,
      totalMediaPlays: 0,
      totalCompletions: 0,
      uniqueSessions: 0
    }
  }

  const uniqueSessions = new Set(data.map(e => e.session_id)).size

  return {
    totalChallengeViews: data.filter(e => e.event_type === 'challenge_view').length,
    totalAssignmentViews: data.filter(e => e.event_type === 'assignment_view').length,
    totalMediaPlays: data.filter(e => e.event_type === 'media_play').length,
    totalCompletions: data.filter(e => e.event_type === 'assignment_complete').length,
    uniqueSessions
  }
}

/**
 * Get analytics stats per challenge
 */
export async function getChallengeStats(dateRange?: DateRange, clientId?: string): Promise<ChallengeStats[]> {
  const supabase = createAdminClient()

  // Get all challenges with their clients
  let challengeQuery = supabase
    .from('challenges')
    .select(`
      id,
      internal_name,
      public_title,
      client_id,
      client:clients (name)
    `)
    .eq('is_archived', false)

  if (clientId) {
    challengeQuery = challengeQuery.eq('client_id', clientId)
  }

  const { data: challenges, error: challengesError } = await challengeQuery

  if (challengesError || !challenges) {
    console.error('Error fetching challenges:', challengesError)
    return []
  }

  // Get events
  let eventsQuery = supabase
    .from('analytics_events')
    .select('event_type, challenge_id, session_id')

  if (dateRange) {
    eventsQuery = eventsQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to)
  }
  if (clientId) {
    eventsQuery = eventsQuery.eq('client_id', clientId)
  }

  const { data: events, error: eventsError } = await eventsQuery

  if (eventsError || !events) {
    console.error('Error fetching events:', eventsError)
    return []
  }

  // Aggregate stats per challenge
  return challenges.map(challenge => {
    const challengeEvents = events.filter(e => e.challenge_id === challenge.id)
    const uniqueSessions = new Set(challengeEvents.map(e => e.session_id)).size
    // Client comes from a join, could be an array or single object
    const clientData = challenge.client as { name: string } | { name: string }[] | null
    const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name

    return {
      challengeId: challenge.id,
      challengeName: challenge.public_title || challenge.internal_name,
      clientId: challenge.client_id,
      clientName: clientName || 'Unknown',
      totalViews: challengeEvents.filter(e => e.event_type === 'challenge_view').length,
      uniqueSessions,
      assignmentViews: challengeEvents.filter(e => e.event_type === 'assignment_view').length,
      mediaPlays: challengeEvents.filter(e => e.event_type === 'media_play').length,
      completions: challengeEvents.filter(e => e.event_type === 'assignment_complete').length
    }
  }).sort((a, b) => b.totalViews - a.totalViews)
}

/**
 * Get analytics stats per assignment for a specific challenge
 */
export async function getAssignmentStats(
  challengeId: string,
  dateRange?: DateRange
): Promise<AssignmentStats[]> {
  const supabase = createAdminClient()

  // Get assignments for this challenge through usages, including sprint info
  const { data: usages, error: usagesError } = await supabase
    .from('assignment_usages')
    .select(`
      assignment_id,
      position,
      sprint_id,
      sprint:sprints (name),
      assignment:assignments (
        id,
        internal_title,
        public_title
      )
    `)
    .eq('challenge_id', challengeId)
    .order('position', { ascending: true })

  if (usagesError || !usages) {
    console.error('Error fetching usages:', usagesError)
    return []
  }

  // Get events for this challenge
  let eventsQuery = supabase
    .from('analytics_events')
    .select('event_type, assignment_id, session_id, metadata')
    .eq('challenge_id', challengeId)
    .not('assignment_id', 'is', null)

  if (dateRange) {
    eventsQuery = eventsQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to)
  }

  const { data: events, error: eventsError } = await eventsQuery

  if (eventsError) {
    console.error('Error fetching events:', eventsError)
    return []
  }

  // Aggregate stats per assignment
  return usages.map((usage, index) => {
    type AssignmentType = { id: string; internal_title: string; public_title: string | null }
    type SprintType = { name: string }
    const assignmentData = usage.assignment as AssignmentType | AssignmentType[] | null
    const assignment = Array.isArray(assignmentData) ? assignmentData[0] : assignmentData
    if (!assignment) return null

    const sprintData = usage.sprint as SprintType | SprintType[] | null
    const sprint = Array.isArray(sprintData) ? sprintData[0] : sprintData

    const assignmentEvents = (events || []).filter(e => e.assignment_id === assignment.id)
    const uniqueSessions = new Set(assignmentEvents.map(e => e.session_id)).size

    const passwordAttempts = assignmentEvents.filter(e => e.event_type === 'password_attempt')
    const passwordSuccesses = passwordAttempts.filter(e => {
      const metadata = e.metadata as { success?: boolean } | null
      return metadata?.success === true
    })

    return {
      assignmentId: assignment.id,
      assignmentTitle: assignment.public_title || assignment.internal_title,
      position: usage.position ?? index,
      sprintId: usage.sprint_id || null,
      sprintName: sprint?.name || null,
      views: assignmentEvents.filter(e => e.event_type === 'assignment_view').length,
      uniqueSessions,
      mediaPlays: assignmentEvents.filter(e => e.event_type === 'media_play').length,
      completions: assignmentEvents.filter(e => e.event_type === 'assignment_complete').length,
      passwordAttempts: passwordAttempts.length,
      passwordSuccesses: passwordSuccesses.length
    }
  }).filter((s): s is AssignmentStats => s !== null)
}

/**
 * Get analytics stats per sprint for a specific challenge
 */
export async function getSprintStats(
  challengeId: string,
  dateRange?: DateRange
): Promise<SprintStats[]> {
  const supabase = createAdminClient()

  // Get sprints for this challenge
  const { data: sprints, error: sprintsError } = await supabase
    .from('sprints')
    .select('id, name, position')
    .eq('challenge_id', challengeId)
    .order('position', { ascending: true })

  if (sprintsError || !sprints || sprints.length === 0) {
    return []
  }

  // Get assignment counts per sprint
  const { data: usages } = await supabase
    .from('assignment_usages')
    .select('sprint_id')
    .eq('challenge_id', challengeId)
    .not('sprint_id', 'is', null)

  // Get events for this challenge that have a sprint_id
  let eventsQuery = supabase
    .from('analytics_events')
    .select('event_type, sprint_id, session_id')
    .eq('challenge_id', challengeId)
    .not('sprint_id', 'is', null)

  if (dateRange) {
    eventsQuery = eventsQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to)
  }

  const { data: events, error: eventsError } = await eventsQuery

  if (eventsError) {
    console.error('Error fetching sprint events:', eventsError)
    return []
  }

  return sprints.map(sprint => {
    const sprintEvents = (events || []).filter(e => e.sprint_id === sprint.id)
    const uniqueSessions = new Set(sprintEvents.map(e => e.session_id)).size
    const assignmentCount = (usages || []).filter(u => u.sprint_id === sprint.id).length
    const views = sprintEvents.filter(e => e.event_type === 'assignment_view').length
    const completions = sprintEvents.filter(e => e.event_type === 'assignment_complete').length

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      position: sprint.position,
      totalViews: views,
      uniqueSessions,
      mediaPlays: sprintEvents.filter(e => e.event_type === 'media_play').length,
      completions,
      assignmentCount,
      completionRate: views > 0 ? Math.round((completions / views) * 100) : 0
    }
  })
}

/**
 * Get daily view counts for a chart
 */
export async function getDailyViewCounts(
  challengeId?: string,
  days: number = 30,
  clientId?: string,
  customDateRange?: DateRange
): Promise<{ date: string; views: number; uniqueSessions: number }[]> {
  const supabase = createAdminClient()

  let startDate: Date
  let endDate: Date

  if (customDateRange) {
    startDate = new Date(customDateRange.from)
    endDate = new Date(customDateRange.to)
  } else {
    endDate = new Date()
    startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
  }

  let query = supabase
    .from('analytics_events')
    .select('created_at, session_id, event_type')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .in('event_type', ['challenge_view', 'assignment_view'])

  if (challengeId) {
    query = query.eq('challenge_id', challengeId)
  }
  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Error fetching daily views:', error)
    return []
  }

  // Group by date
  const dailyStats = new Map<string, { views: number; sessions: Set<string> }>()

  // Initialize all days in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    dailyStats.set(dateKey, { views: 0, sessions: new Set() })
  }

  // Aggregate data
  data.forEach(event => {
    const dateKey = event.created_at.split('T')[0]
    const stats = dailyStats.get(dateKey)
    if (stats) {
      stats.views += 1
      stats.sessions.add(event.session_id)
    }
  })

  // Convert to array
  return Array.from(dailyStats.entries()).map(([date, stats]) => ({
    date,
    views: stats.views,
    uniqueSessions: stats.sessions.size
  })).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Export analytics data as CSV
 */
export async function exportAnalyticsCSV(
  challengeId?: string,
  dateRange?: DateRange,
  clientId?: string
): Promise<string> {
  const supabase = createAdminClient()

  let query = supabase
    .from('analytics_events')
    .select(`
      event_type,
      created_at,
      session_id,
      sprint_id,
      challenge:challenges (internal_name, public_title),
      assignment:assignments (internal_title, public_title),
      client:clients (name),
      sprint:sprints (name)
    `)
    .order('created_at', { ascending: false })

  if (challengeId) {
    query = query.eq('challenge_id', challengeId)
  }
  if (clientId) {
    query = query.eq('client_id', clientId)
  }
  if (dateRange) {
    query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to)
  }

  // Fetch all data in pages of 10,000
  const allData: typeof firstPage = []
  let offset = 0
  const pageSize = 10000
  const { data: firstPage, error: firstError } = await query.range(0, pageSize - 1)

  if (firstError || !firstPage) {
    console.error('Error exporting analytics:', firstError)
    return ''
  }
  allData.push(...firstPage)

  // Continue paginating if we got a full page
  while (allData.length === offset + pageSize) {
    offset += pageSize
    const { data: page, error: pageError } = await query.range(offset, offset + pageSize - 1)
    if (pageError || !page || page.length === 0) break
    allData.push(...page)
    // Safety cap at 100k rows
    if (allData.length >= 100000) break
  }

  // Build CSV
  const headers = ['Date', 'Event Type', 'Client', 'Challenge', 'Sprint', 'Assignment', 'Session ID']
  const rows = allData.map(event => {
    type ChallengeType = { internal_name: string; public_title: string | null }
    type AssignmentType = { internal_title: string; public_title: string | null }
    type ClientType = { name: string }
    type SprintType = { name: string }

    const challengeData = event.challenge as ChallengeType | ChallengeType[] | null
    const assignmentData = event.assignment as AssignmentType | AssignmentType[] | null
    const clientData = event.client as ClientType | ClientType[] | null
    const sprintData = event.sprint as SprintType | SprintType[] | null

    const challenge = Array.isArray(challengeData) ? challengeData[0] : challengeData
    const assignment = Array.isArray(assignmentData) ? assignmentData[0] : assignmentData
    const client = Array.isArray(clientData) ? clientData[0] : clientData
    const sprint = Array.isArray(sprintData) ? sprintData[0] : sprintData

    return [
      event.created_at,
      event.event_type,
      client?.name || '',
      challenge?.public_title || challenge?.internal_name || '',
      sprint?.name || '',
      assignment?.public_title || assignment?.internal_title || '',
      event.session_id
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  })

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

/**
 * Export a per-assignment summary CSV for a specific challenge.
 * Gives: position, assignment, sprint, views, unique sessions, media plays,
 * completions, completion rate — exactly the data for drop-off analysis.
 */
export async function exportAssignmentSummaryCSV(
  challengeId: string,
  dateRange?: DateRange
): Promise<string> {
  const assignments = await getAssignmentStats(challengeId, dateRange)

  if (!assignments.length) return ''

  const headers = [
    'Position',
    'Assignment',
    'Sprint',
    'Views',
    'Unique Sessions',
    'Media Plays',
    'Completions',
    'Password Attempts',
    'Password Successes',
    'Completion Rate %',
  ]

  const rows = assignments.map((a, i) => {
    const rate = a.views > 0 ? Math.round((a.completions / a.views) * 100) : 0
    return [
      i + 1,
      a.assignmentTitle,
      a.sprintName || '',
      a.views,
      a.uniqueSessions,
      a.mediaPlays,
      a.completions,
      a.passwordAttempts,
      a.passwordSuccesses,
      rate,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  })

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}
