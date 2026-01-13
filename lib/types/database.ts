/**
 * Database entity types for Company Challenges Platform.
 * Supports both Collective Mode (anonymous) and Individual Mode (authenticated).
 */

// =============================================================================
// Core Entities
// =============================================================================

export interface Client {
  id: string
  name: string
  logo_url: string | null
  
  // Mode configuration
  mode: 'collective' | 'individual' | 'hybrid'
  
  // Feature flags
  features: ClientFeatures
  
  created_at: string
  updated_at: string
}

export interface ClientFeatures {
  // Collective features
  announcements: boolean
  host_videos: boolean
  sprint_structure: boolean
  collective_progress: boolean
  
  // Gamification
  time_based_unlocks: boolean
  milestones: boolean
  reveal_moments: boolean
  micro_quizzes: boolean
  
  // Individual features (only active if mode is 'individual' or 'hybrid')
  progress_tracking: boolean
  session_persistence: boolean
  private_views: boolean
}

export const DEFAULT_CLIENT_FEATURES: ClientFeatures = {
  announcements: false,
  host_videos: false,
  sprint_structure: false,
  collective_progress: false,
  time_based_unlocks: false,
  milestones: false,
  reveal_moments: false,
  micro_quizzes: false,
  progress_tracking: false,
  session_persistence: false,
  private_views: false,
}

export interface Challenge {
  id: string
  client_id: string
  slug: string // unique public URL segment (can be custom)
  internal_name: string
  public_title: string | null
  show_public_title: boolean
  description: string | null // rich text (stored as HTML)
  brand_color: string | null // hex color, e.g., "#3b82f6"
  support_info: string | null // rich text
  visual_url: string | null
  is_archived: boolean
  folder: string | null // simple folder/project grouping
  
  // Scheduling
  starts_at: string | null // challenge start date
  ends_at: string | null // challenge end date
  
  created_at: string
  updated_at: string
}

export interface Sprint {
  id: string
  challenge_id: string
  name: string
  description: string | null
  position: number // order within challenge
  visual_url: string | null
  
  // Host content
  intro_video_url: string | null
  recap_video_url: string | null
  
  // Scheduling
  starts_at: string | null
  ends_at: string | null
  
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  slug: string // unique public URL segment
  internal_title: string
  public_title: string | null
  subtitle: string | null
  description: string | null // rich text
  visual_url: string | null
  media_url: string | null // embedded video URL
  password_hash: string | null // hashed shared access key
  
  // Content type
  content_type: 'standard' | 'quiz' | 'video' | 'announcement'
  
  created_at: string
  updated_at: string
}

// =============================================================================
// Relationship Entities
// =============================================================================

/**
 * AssignmentUsage defines how an assignment appears within a specific challenge/sprint.
 */
export interface AssignmentUsage {
  id: string
  challenge_id: string
  sprint_id: string | null // null = not part of a sprint
  assignment_id: string
  position: number // ordering within challenge/sprint
  is_visible: boolean // can be hidden without removing
  release_at: string | null // scheduled release datetime
  label: string | null // optional custom label
  
  // Gamification
  is_milestone: boolean // marks completion of this as a milestone
  reveal_style: 'instant' | 'fade' | 'dramatic' | null
  
  created_at: string
  updated_at: string
}

/**
 * AssignmentVariant tracks relationships between assignments.
 */
export interface AssignmentVariant {
  id: string
  source_assignment_id: string
  target_assignment_id: string
  relationship_label: string // e.g., "French translation", "Advanced version"
  created_at: string
}

// =============================================================================
// Gamification Entities
// =============================================================================

/**
 * MicroQuiz - reflective, non-scored check-ins
 */
export interface MicroQuiz {
  id: string
  assignment_id: string
  question: string
  quiz_type: 'reflection' | 'multiple_choice' | 'scale'
  options: string[] | null // for multiple choice
  scale_min: number | null // for scale type
  scale_max: number | null
  scale_labels: { min: string; max: string } | null
  position: number
  created_at: string
  updated_at: string
}

/**
 * Announcement - admin-posted updates visible to all participants
 */
export interface Announcement {
  id: string
  challenge_id: string
  title: string
  content: string // rich text
  visual_url: string | null
  is_pinned: boolean
  published_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Milestone - editorial celebration moments
 */
export interface Milestone {
  id: string
  challenge_id: string
  name: string
  description: string | null
  trigger_type: 'assignment_complete' | 'sprint_complete' | 'percentage' | 'custom'
  trigger_value: string // assignment_id, sprint_id, percentage value, or custom key
  celebration_type: 'badge' | 'message' | 'animation' | 'unlock'
  celebration_content: string | null // message text, badge URL, etc.
  position: number
  created_at: string
  updated_at: string
}

// =============================================================================
// Individual Mode Entities
// =============================================================================

/**
 * Participant - tracks Individual Mode users
 * Clerk handles auth, this stores app-specific data
 */
export interface Participant {
  id: string
  clerk_user_id: string // Clerk's user ID
  display_name: string | null
  avatar_url: string | null
  
  // Privacy settings
  show_in_leaderboard: boolean
  show_progress_publicly: boolean
  
  created_at: string
  updated_at: string
}

/**
 * ChallengeEnrollment - tracks which challenges a participant is enrolled in
 */
export interface ChallengeEnrollment {
  id: string
  participant_id: string
  challenge_id: string
  enrolled_at: string
  completed_at: string | null
  
  // Progress
  last_assignment_id: string | null // for "continue where you left off"
  
  created_at: string
  updated_at: string
}

/**
 * AssignmentProgress - per-user completion state
 */
export interface AssignmentProgress {
  id: string
  participant_id: string
  assignment_usage_id: string
  
  status: 'not_started' | 'in_progress' | 'completed'
  started_at: string | null
  completed_at: string | null
  
  // Quiz responses (if assignment has quiz)
  quiz_responses: QuizResponse[] | null
  
  created_at: string
  updated_at: string
}

export interface QuizResponse {
  quiz_id: string
  response: string | number
  responded_at: string
}

/**
 * MilestoneAchievement - tracks which milestones a participant has earned
 */
export interface MilestoneAchievement {
  id: string
  participant_id: string
  milestone_id: string
  achieved_at: string
  created_at: string
}

// =============================================================================
// Analytics Entities (Anonymous for Collective Mode)
// =============================================================================

export interface AnalyticsEvent {
  id: string
  event_type: 'challenge_view' | 'assignment_view' | 'assignment_complete' | 'media_play' | 'password_attempt' | 'quiz_response'
  
  // Context
  client_id: string
  challenge_id: string
  assignment_id: string | null
  sprint_id: string | null
  
  // Anonymous session (not linked to user)
  session_id: string // anonymous session identifier
  
  // Event data
  metadata: Record<string, unknown> | null
  
  created_at: string
}

// =============================================================================
// Joined/Expanded Types (for queries)
// =============================================================================

export interface ChallengeWithClient extends Challenge {
  client: Client
}

export interface AssignmentUsageWithAssignment extends AssignmentUsage {
  assignment: Assignment
  micro_quizzes?: MicroQuiz[]
}

export interface SprintWithAssignments extends Sprint {
  assignment_usages: AssignmentUsageWithAssignment[]
}

export interface ChallengeWithContent extends Challenge {
  client: Client
  sprints: SprintWithAssignments[]
  assignment_usages: AssignmentUsageWithAssignment[] // assignments not in sprints
  announcements: Announcement[]
  milestones: Milestone[]
}

export interface AssignmentWithUsages extends Assignment {
  assignment_usages: (AssignmentUsage & { challenge: Challenge })[]
  variants_as_source: (AssignmentVariant & { target: Assignment })[]
  variants_as_target: (AssignmentVariant & { source: Assignment })[]
  micro_quizzes: MicroQuiz[]
}

export interface ParticipantWithProgress extends Participant {
  enrollments: (ChallengeEnrollment & {
    challenge: Challenge
    progress: AssignmentProgress[]
  })[]
  achievements: (MilestoneAchievement & { milestone: Milestone })[]
}

// =============================================================================
// Input Types (for create/update operations)
// =============================================================================

export interface ClientInsert {
  name: string
  logo_url?: string | null
  mode?: 'collective' | 'individual' | 'hybrid'
  features?: Partial<ClientFeatures>
}

export interface ClientUpdate {
  name?: string
  logo_url?: string | null
  mode?: 'collective' | 'individual' | 'hybrid'
  features?: Partial<ClientFeatures>
}

export interface ChallengeInsert {
  client_id: string
  slug?: string // auto-generated if not provided
  internal_name: string
  public_title?: string | null
  show_public_title?: boolean
  description?: string | null
  brand_color?: string | null
  support_info?: string | null
  visual_url?: string | null
  folder?: string | null
  starts_at?: string | null
  ends_at?: string | null
}

export interface ChallengeUpdate {
  slug?: string
  internal_name?: string
  public_title?: string | null
  show_public_title?: boolean
  description?: string | null
  brand_color?: string | null
  support_info?: string | null
  visual_url?: string | null
  is_archived?: boolean
  folder?: string | null
  starts_at?: string | null
  ends_at?: string | null
}

export interface SprintInsert {
  challenge_id: string
  name: string
  description?: string | null
  position?: number
  visual_url?: string | null
  intro_video_url?: string | null
  recap_video_url?: string | null
  starts_at?: string | null
  ends_at?: string | null
}

export interface SprintUpdate {
  name?: string
  description?: string | null
  position?: number
  visual_url?: string | null
  intro_video_url?: string | null
  recap_video_url?: string | null
  starts_at?: string | null
  ends_at?: string | null
}

export interface AssignmentInsert {
  slug?: string // auto-generated if not provided
  internal_title: string
  public_title?: string | null
  subtitle?: string | null
  description?: string | null
  visual_url?: string | null
  media_url?: string | null
  password?: string // plain text, will be hashed
  content_type?: 'standard' | 'quiz' | 'video' | 'announcement'
}

export interface AssignmentUpdate {
  slug?: string
  internal_title?: string
  public_title?: string | null
  subtitle?: string | null
  description?: string | null
  visual_url?: string | null
  media_url?: string | null
  password?: string | null // plain text or null to remove
  content_type?: 'standard' | 'quiz' | 'video' | 'announcement'
}

export interface AssignmentUsageInsert {
  challenge_id: string
  sprint_id?: string | null
  assignment_id: string
  position?: number
  is_visible?: boolean
  release_at?: string | null
  label?: string | null
  is_milestone?: boolean
  reveal_style?: 'instant' | 'fade' | 'dramatic' | null
}

export interface AssignmentUsageUpdate {
  sprint_id?: string | null
  position?: number
  is_visible?: boolean
  release_at?: string | null
  label?: string | null
  is_milestone?: boolean
  reveal_style?: 'instant' | 'fade' | 'dramatic' | null
}

export interface MicroQuizInsert {
  assignment_id: string
  question: string
  quiz_type: 'reflection' | 'multiple_choice' | 'scale'
  options?: string[] | null
  scale_min?: number | null
  scale_max?: number | null
  scale_labels?: { min: string; max: string } | null
  position?: number
}

export interface MicroQuizUpdate {
  question?: string
  quiz_type?: 'reflection' | 'multiple_choice' | 'scale'
  options?: string[] | null
  scale_min?: number | null
  scale_max?: number | null
  scale_labels?: { min: string; max: string } | null
  position?: number
}

export interface AnnouncementInsert {
  challenge_id: string
  title: string
  content: string
  visual_url?: string | null
  is_pinned?: boolean
  published_at?: string
  expires_at?: string | null
}

export interface MilestoneInsert {
  challenge_id: string
  name: string
  description?: string | null
  trigger_type: 'assignment_complete' | 'sprint_complete' | 'percentage' | 'custom'
  trigger_value: string
  celebration_type: 'badge' | 'message' | 'animation' | 'unlock'
  celebration_content?: string | null
  position?: number
}

export interface MilestoneUpdate {
  name?: string
  description?: string | null
  trigger_type?: 'assignment_complete' | 'sprint_complete' | 'percentage' | 'custom'
  trigger_value?: string
  celebration_type?: 'badge' | 'message' | 'animation' | 'unlock'
  celebration_content?: string | null
  position?: number
}

// =============================================================================
// Participant Input Types
// =============================================================================

export interface ParticipantInsert {
  clerk_user_id: string
  display_name?: string | null
  avatar_url?: string | null
  show_in_leaderboard?: boolean
  show_progress_publicly?: boolean
}

export interface ParticipantUpdate {
  display_name?: string | null
  avatar_url?: string | null
  show_in_leaderboard?: boolean
  show_progress_publicly?: boolean
}

export interface ChallengeEnrollmentInsert {
  participant_id: string
  challenge_id: string
  last_assignment_id?: string | null
}

export interface AssignmentProgressInsert {
  participant_id: string
  assignment_usage_id: string
  status?: 'not_started' | 'in_progress' | 'completed'
  started_at?: string | null
  completed_at?: string | null
  quiz_responses?: QuizResponse[] | null
}

export interface AssignmentProgressUpdate {
  status?: 'not_started' | 'in_progress' | 'completed'
  started_at?: string | null
  completed_at?: string | null
  quiz_responses?: QuizResponse[] | null
}

export interface MilestoneAchievementInsert {
  participant_id: string
  milestone_id: string
  achieved_at?: string
}

// =============================================================================
// Participant Dashboard Types
// =============================================================================

export interface ParticipantDashboardStats {
  enrolledChallenges: number
  completedAssignments: number
  totalAssignments: number
  achievementsEarned: number
  currentStreak: number
}

export interface EnrolledChallengeWithProgress extends ChallengeEnrollment {
  challenge: Challenge & { client: Client }
  completedCount: number
  totalCount: number
  progressPercentage: number
}

export interface AssignmentWithProgress extends AssignmentUsage {
  assignment: Assignment
  sprint: Sprint | null
  progress: AssignmentProgress | null
  micro_quizzes: MicroQuiz[]
}
