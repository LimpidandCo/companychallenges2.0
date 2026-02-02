'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import { AuthGate } from '@/components/public/auth-gate'
import { SupportModal } from '@/components/public/support-modal'
import { PasswordGate } from '@/components/public/password-gate'
import { useLabels } from '@/lib/hooks/use-labels'
import { verifySprintPassword } from '@/lib/actions/public'
import type { Challenge, Assignment, AssignmentUsage, Sprint, ChallengeLabel, Milestone } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

// LocalStorage key for tracking completions (matches assignment page)
const getCompletionStorageKey = (challengeId: string) => `cc_completed_${challengeId}`

interface AssignmentsGridClientProps {
  challenge: Challenge
  client: { name: string; logo_url?: string }
  usages: (AssignmentUsage & { assignment: Assignment })[]
  sprints: Sprint[]
  milestones?: Milestone[]
  pendingCount: number
  labels?: ChallengeLabel[]
  // Progress data (for individual mode)
  completedIds?: string[]
  totalProgress?: number // 0-100
}

/**
 * Assignments Grid Page - With Sprint Container Support
 * 
 * When challenge has sprints:
 * - Shows sprint cards (mission cards) first
 * - Clicking a sprint shows its assignments
 * 
 * When challenge has no sprints:
 * - Shows assignment grid directly (current behavior)
 */
export function AssignmentsGridClient({
  challenge,
  client,
  usages,
  sprints,
  milestones = [],
  pendingCount,
  labels: initialLabels,
  completedIds: serverCompletedIds = [],
}: AssignmentsGridClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Read sprint ID from URL params (for returning from assignment)
  const urlSprintId = searchParams.get('sprint')
  
  // View state: 'sprints' shows sprint cards, 'assignments' shows assignment grid
  const [currentView, setCurrentView] = useState<'sprints' | 'assignments'>(urlSprintId ? 'assignments' : 'sprints')
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(urlSprintId)
  
  // Password modal state
  const [passwordModalSprint, setPasswordModalSprint] = useState<Sprint | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  
  // Assignment password modal (existing)
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string
    title: string
  } | null>(null)
  
  const [localCompletedIds, setLocalCompletedIds] = useState<string[]>([])
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  const { getLabel } = useLabels({ 
    challengeId: challenge.id, 
    initialLabels 
  })

  // Load completed IDs from localStorage on mount
  useEffect(() => {
    try {
      const key = getCompletionStorageKey(challenge.id)
      const stored = localStorage.getItem(key)
      if (stored) {
        const ids = JSON.parse(stored)
        setLocalCompletedIds(ids)
      }
    } catch (e) {
      // localStorage might not be available
    }
    setIsPageLoaded(true)
    
    // If returning from assignment with sprint param, verify sprint is accessible
    if (urlSprintId) {
      const sprint = sprints.find(s => s.id === urlSprintId)
      if (sprint) {
        // Check if sprint requires password and is not unlocked
        if (sprint.password_hash) {
          const unlockedKey = `cc_unlocked_sprints_${challenge.id}`
          const unlockedStored = localStorage.getItem(unlockedKey)
          const unlockedSprints: string[] = unlockedStored ? JSON.parse(unlockedStored) : []
          if (!unlockedSprints.includes(urlSprintId)) {
            // Sprint needs password, show sprints view
            setCurrentView('sprints')
            setSelectedSprintId(null)
          }
        }
      }
    }
  }, [challenge.id, urlSprintId, sprints])

  // Merge server and local completed IDs
  const completedIds = useMemo(() => {
    const merged = new Set([...serverCompletedIds, ...localCompletedIds])
    return Array.from(merged)
  }, [serverCompletedIds, localCompletedIds])

  const title = challenge.show_public_title && challenge.public_title
    ? challenge.public_title
    : client.name

  const brandColor = challenge.brand_color || '#ff6b4a'
  const defaultFeatures = {
    sprint_structure: true,
    milestones: false,
    progress_tracking: false,
  }
  const features = { ...defaultFeatures, ...(challenge.features || {}) }
  const hasSprints = sprints.length > 0 && features.sprint_structure
  const showProgress = features.progress_tracking && challenge.mode !== 'collective'
  const showMilestones = features.milestones && milestones.length > 0

  // Group usages by sprint
  const sprintMap = useMemo(() => {
    const map = new Map<string | null, (AssignmentUsage & { assignment: Assignment })[]>()
    usages.forEach(usage => {
      const key = usage.sprint_id || null
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(usage)
    })
    return map
  }, [usages])

  // Get assignments for selected sprint (or all if no sprint selected)
  const currentUsages = useMemo(() => {
    if (!hasSprints || currentView === 'sprints') return usages
    if (selectedSprintId) return sprintMap.get(selectedSprintId) || []
    return usages
  }, [hasSprints, currentView, selectedSprintId, usages, sprintMap])

  // Calculate overall progress
  const totalProgress = useMemo(() => {
    if (usages.length === 0) return 0
    return Math.round((completedIds.length / usages.length) * 100)
  }, [completedIds.length, usages.length])

  // Get sprint progress
  const getSprintProgress = (sprintId: string) => {
    const sprintUsages = sprintMap.get(sprintId) || []
    const completed = sprintUsages.filter(u => completedIds.includes(u.assignment.id)).length
    return { completed, total: sprintUsages.length }
  }

  // Get next milestone
  const nextMilestone = useMemo(() => {
    if (!showMilestones) return null
    return milestones.find(m => {
      if (m.trigger_type === 'percentage') {
        return totalProgress < parseInt(m.trigger_value)
      }
      return true
    })
  }, [showMilestones, milestones, totalProgress])

  // Check if a sprint is unlocked (password already entered)
  const isSprintUnlocked = (sprintId: string): boolean => {
    try {
      const key = `cc_unlocked_sprints_${challenge.id}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const unlockedSprints: string[] = JSON.parse(stored)
        return unlockedSprints.includes(sprintId)
      }
    } catch {
      // localStorage might not be available
    }
    return false
  }

  // Handle sprint card click
  const handleSprintClick = async (sprint: Sprint) => {
    const sprintUsages = sprintMap.get(sprint.id) || []
    
    // If sprint has password AND is not already unlocked, show password modal
    if (sprint.password_hash && !isSprintUnlocked(sprint.id)) {
      setPasswordModalSprint(sprint)
      return
    }
    
    // If only 1 assignment, navigate directly to it
    if (sprintUsages.length === 1) {
      const assignment = sprintUsages[0].assignment
      router.push(`/${assignment.slug}?from=${challenge.slug}`)
      return
    }
    
    // Otherwise show sprint's assignments
    setSelectedSprintId(sprint.id)
    setCurrentView('assignments')
  }

  // Handle sprint password verification
  const handleSprintPasswordSubmit = async (password: string) => {
    if (!passwordModalSprint) return
    
    setIsVerifying(true)
    setPasswordError(null)
    
    try {
      const result = await verifySprintPassword(passwordModalSprint.id, password)
      
      if (result.success) {
        // Store unlocked sprint in localStorage so assignments in this sprint are also unlocked
        try {
          const key = `cc_unlocked_sprints_${challenge.id}`
          const stored = localStorage.getItem(key)
          const unlockedSprints: string[] = stored ? JSON.parse(stored) : []
          if (!unlockedSprints.includes(passwordModalSprint.id)) {
            unlockedSprints.push(passwordModalSprint.id)
            localStorage.setItem(key, JSON.stringify(unlockedSprints))
          }
        } catch {
          // localStorage might not be available
        }
        
        const sprintUsages = sprintMap.get(passwordModalSprint.id) || []
        setPasswordModalSprint(null)
        
        // If only 1 assignment, navigate directly
        if (sprintUsages.length === 1) {
          const assignment = sprintUsages[0].assignment
          router.push(`/${assignment.slug}?from=${challenge.slug}`)
        } else {
          // Show sprint's assignments
          setSelectedSprintId(passwordModalSprint.id)
          setCurrentView('assignments')
        }
      } else {
        setPasswordError(result.error || '✕')
      }
    } catch {
      setPasswordError('✕')
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle back to sprints
  const handleBackToSprints = () => {
    setSelectedSprintId(null)
    setCurrentView('sprints')
  }

  // Get current sprint for header
  const currentSprint = selectedSprintId 
    ? sprints.find(s => s.id === selectedSprintId) 
    : null

  // Determine what to show
  const showSprintCards = hasSprints && currentView === 'sprints'
  const showAssignments = !hasSprints || currentView === 'assignments'

  return (
    <AuthGate
      challengeId={challenge.id}
      challengeMode={challenge.mode || 'collective'}
      challengeTitle={title}
      brandColor={brandColor}
    >
      {/* Sprint Password Modal */}
      {passwordModalSprint && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" 
          onClick={() => setPasswordModalSprint(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="animate-pop-in w-full max-w-md">
            <SprintPasswordGate
              sprint={passwordModalSprint}
              brandColor={brandColor}
              error={passwordError}
              isVerifying={isVerifying}
              onSubmit={handleSprintPasswordSubmit}
              onClose={() => setPasswordModalSprint(null)}
              passwordInstructions={challenge.password_instructions || undefined}
            />
          </div>
        </div>
      )}

      {/* Assignment Password Modal */}
      {selectedAssignment && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" 
          onClick={() => setSelectedAssignment(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="animate-pop-in w-full max-w-md">
            <PasswordGate
              assignmentId={selectedAssignment.id}
              assignmentTitle={selectedAssignment.title}
              onSuccess={() => setSelectedAssignment(null)}
              passwordInstructions={challenge.password_instructions || undefined}
            />
          </div>
        </div>
      )}

      <div 
        className={cn(
          "min-h-screen flex flex-col transition-opacity duration-500",
          isPageLoaded ? "opacity-100" : "opacity-0"
        )} 
        style={{ backgroundColor: `${brandColor}08` }}
      >
        {/* Header */}
        <header className="bg-white border-b shadow-sm animate-slide-down">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Logo & Title with Back Button */}
              <div className="flex items-center gap-4">
                {/* Back button when viewing sprint's assignments */}
                {currentView === 'assignments' && hasSprints && (
                  <button
                    onClick={handleBackToSprints}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                )}
                
                {client.logo_url ? (
                  <img
                    src={client.logo_url}
                    alt={client.name}
                    className="h-10 w-auto sm:h-12"
                  />
                ) : (
                  <div 
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: brandColor }}
                  >
                    {client.name.charAt(0)}
                  </div>
                )}
                <div>
                  <Link 
                    href={`/${challenge.slug}`}
                    className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
                  >
                    {title}
                  </Link>
                  {showProgress && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${totalProgress}%`, backgroundColor: brandColor }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{totalProgress}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Info */}
              <div className="flex items-center gap-4">
                {showProgress && (
                  <div className="hidden sm:flex items-center gap-3">
                    <ProgressRing 
                      progress={totalProgress} 
                      brandColor={brandColor}
                      size={48}
                    />
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {completedIds.length}/{usages.length}
                      </div>
                      <div className="text-xs text-gray-500">completed</div>
                    </div>
                  </div>
                )}
                
                {(challenge.support_info || challenge.contact_info || challenge.password_instructions) && (
                  <SupportModal 
                    supportInfo={challenge.support_info}
                    contactInfo={challenge.contact_info}
                    passwordInstructions={challenge.password_instructions}
                    brandColor={brandColor}
                    variant="icon"
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Sprint Header when viewing sprint assignments */}
        {currentSprint && currentView === 'assignments' && (
          <div 
            className="border-b"
            style={{ backgroundColor: `${brandColor}10` }}
          >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div 
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white font-bold text-xl shadow-lg"
                  style={{ backgroundColor: brandColor }}
                >
                  {sprints.findIndex(s => s.id === currentSprint.id) + 1}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {currentSprint.name}
                  </h2>
                  {currentSprint.subtitle && (
                    <p className="text-sm text-gray-600 mt-0.5">{currentSprint.subtitle}</p>
                  )}
                </div>
              </div>
              {currentSprint.description_html && (
                <div 
                  className="mt-4 text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentSprint.description_html }}
                />
              )}
            </div>
          </div>
        )}

        {/* Next Milestone Banner */}
        {nextMilestone && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <TrophyIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-amber-900">
                    Next Milestone: {nextMilestone.name}
                  </div>
                  {nextMilestone.description && (
                    <div className="text-xs text-amber-700">{nextMilestone.description}</div>
                  )}
                </div>
                {nextMilestone.trigger_type === 'percentage' && (
                  <div className="ml-auto text-right">
                    <div className="text-xs text-amber-600">
                      {parseInt(nextMilestone.trigger_value) - totalProgress}% to go
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
          {/* Sprint Cards View */}
          {showSprintCards && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {getLabel('sprint') || 'Missions'}
                </h2>
                <p className="text-gray-600 mt-2">
                  Select a mission to begin
                </p>
              </div>
              
              <SprintCardsGrid
                sprints={sprints}
                sprintMap={sprintMap}
                brandColor={brandColor}
                completedIds={completedIds}
                showProgress={showProgress}
                getSprintProgress={getSprintProgress}
                onSprintClick={handleSprintClick}
                getLabel={getLabel}
              />
            </div>
          )}

          {/* Assignments View */}
          {showAssignments && (
            <>
              {currentUsages.length === 0 && pendingCount === 0 ? (
                <EmptyState brandColor={brandColor} />
              ) : (
                <div className="space-y-10">
                  <AssignmentGrid
                    usages={currentUsages}
                    brandColor={brandColor}
                    challengeSlug={challenge.slug}
                    onPasswordRequired={(id, title) => setSelectedAssignment({ id, title })}
                    startLabel={getLabel('start')}
                    completedIds={completedIds}
                    showProgress={showProgress}
                  />

                  {pendingCount > 0 && (
                    <PendingIndicator 
                      count={pendingCount} 
                      brandColor={brandColor}
                      label={getLabel('coming_soon')}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {getLabel('powered_by')} <span className="font-semibold text-gray-700">Company Challenges</span>
              </p>
              {showProgress && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>{completedIds.length} of {usages.length} completed</span>
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </AuthGate>
  )
}

// =============================================================================
// Sprint Cards Grid - Distinct Mission-style UI
// =============================================================================

interface SprintCardsGridProps {
  sprints: Sprint[]
  sprintMap: Map<string | null, (AssignmentUsage & { assignment: Assignment })[]>
  brandColor: string
  completedIds: string[]
  showProgress: boolean
  getSprintProgress: (sprintId: string) => { completed: number; total: number }
  onSprintClick: (sprint: Sprint) => void
  getLabel: (key: string) => string
}

function SprintCardsGrid({
  sprints,
  sprintMap,
  brandColor,
  completedIds,
  showProgress,
  getSprintProgress,
  onSprintClick,
  getLabel,
}: SprintCardsGridProps) {
  return (
    <div className="space-y-4">
      {sprints.map((sprint, index) => {
        const progress = getSprintProgress(sprint.id)
        const isLocked = sprint.starts_at ? new Date(sprint.starts_at) > new Date() : false
        const hasPassword = !!sprint.password_hash
        const isComplete = progress.completed === progress.total && progress.total > 0
        
        return (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
            index={index + 1}
            brandColor={brandColor}
            progress={progress}
            isLocked={isLocked}
            hasPassword={hasPassword}
            isComplete={isComplete}
            showProgress={showProgress}
            onClick={() => !isLocked && onSprintClick(sprint)}
            missionLabel={getLabel('sprint') || 'Mission'}
          />
        )
      })}
    </div>
  )
}

// =============================================================================
// Sprint Card - Mission-style horizontal card
// =============================================================================

interface SprintCardProps {
  sprint: Sprint
  index: number
  brandColor: string
  progress: { completed: number; total: number }
  isLocked: boolean
  hasPassword: boolean
  isComplete: boolean
  showProgress: boolean
  onClick: () => void
  missionLabel: string
}

function SprintCard({
  sprint,
  index,
  brandColor,
  progress,
  isLocked,
  hasPassword,
  isComplete,
  showProgress,
  onClick,
  missionLabel,
}: SprintCardProps) {
  const progressPercent = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        'w-full text-left rounded-2xl bg-white border-2 overflow-hidden transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-0.5',
        isLocked 
          ? 'opacity-60 cursor-not-allowed border-gray-200' 
          : isComplete
          ? 'border-green-300 shadow-green-100'
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      {/* Progress bar at top */}
      {showProgress && !isLocked && (
        <div className="h-1.5 bg-gray-100">
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${progressPercent}%`, 
              backgroundColor: isComplete ? '#22c55e' : brandColor 
            }}
          />
        </div>
      )}
      
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:gap-6">
          {/* Mission Number Badge */}
          <div 
            className={cn(
              'flex-shrink-0 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl text-white font-bold text-2xl sm:text-3xl shadow-lg transition-transform',
              !isLocked && 'group-hover:scale-105'
            )}
            style={{ 
              backgroundColor: isLocked ? '#9ca3af' : isComplete ? '#22c55e' : brandColor 
            }}
          >
            {isLocked ? (
              <LockIcon className="h-8 w-8" />
            ) : isComplete ? (
              <CheckCircleIcon className="h-10 w-10" />
            ) : (
              index
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Mission label + status */}
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: isLocked ? '#9ca3af' : brandColor }}
              >
                {missionLabel} {index}
              </span>
              {hasPassword && !isLocked && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <LockIcon className="h-3 w-3" />
                  Password
                </span>
              )}
              {isComplete && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircleIcon className="h-3 w-3" />
                  Complete
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className={cn(
              'text-lg sm:text-xl font-bold mb-1',
              isLocked ? 'text-gray-400' : 'text-gray-900'
            )}>
              {sprint.name}
            </h3>

            {/* Subtitle */}
            {sprint.subtitle && (
              <p className={cn(
                'text-sm mb-3',
                isLocked ? 'text-gray-400' : 'text-gray-600'
              )}>
                {sprint.subtitle}
              </p>
            )}

            {/* Assignment indicators */}
            <div className="flex items-center gap-3">
              {/* Assignment dots */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(progress.total, 8) }).map((_, i) => {
                  const sprintUsages = Array.from({ length: progress.total })
                  const isAssignmentComplete = i < progress.completed
                  return (
                    <div
                      key={i}
                      className={cn(
                        'w-2.5 h-2.5 rounded-full transition-colors',
                        isLocked 
                          ? 'bg-gray-300'
                          : isAssignmentComplete 
                          ? 'bg-green-500' 
                          : 'bg-gray-200'
                      )}
                    />
                  )
                })}
                {progress.total > 8 && (
                  <span className="text-xs text-gray-400 ml-1">+{progress.total - 8}</span>
                )}
              </div>
              
              {/* Count text */}
              <span className={cn(
                'text-sm',
                isLocked ? 'text-gray-400' : 'text-gray-500'
              )}>
                {progress.total} assignment{progress.total !== 1 ? 's' : ''}
                {showProgress && !isLocked && ` • ${progress.completed}/${progress.total} done`}
              </span>
            </div>
          </div>

          {/* Arrow */}
          {!isLocked && (
            <div className="flex-shrink-0 self-center">
              <ChevronRightIcon 
                className="h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1"
              />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// =============================================================================
// Sprint Password Gate
// =============================================================================

interface SprintPasswordGateProps {
  sprint: Sprint
  brandColor: string
  error: string | null
  isVerifying: boolean
  onSubmit: (password: string) => void
  onClose: () => void
  passwordInstructions?: string | null
}

function SprintPasswordGate({
  sprint,
  brandColor,
  error,
  isVerifying,
  onSubmit,
  onClose,
  passwordInstructions,
}: SprintPasswordGateProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      onSubmit(password.trim())
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div 
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: brandColor }}
        >
          <LockIcon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {sprint.name}
        </h2>
      </div>

      {passwordInstructions && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>{passwordInstructions}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoFocus
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          className={cn(
            'w-full rounded-xl border-2 px-4 py-3 text-center text-lg font-medium transition-colors',
            'focus:outline-none',
            error 
              ? 'border-red-300 bg-red-50 text-red-900' 
              : 'border-gray-200 focus:border-gray-400'
          )}
        />
        
        {error && (
          <p className="mt-2 text-center text-sm text-red-600">✕</p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={isVerifying || !password.trim()}
            className="flex-1 rounded-xl py-3 font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center"
            style={{ backgroundColor: brandColor }}
          >
            {isVerifying ? <Spinner className="h-5 w-5" /> : <UnlockIcon className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  )
}

// =============================================================================
// Progress Ring Component
// =============================================================================

interface ProgressRingProps {
  progress: number
  brandColor: string
  size?: number
}

function ProgressRing({ progress, brandColor, size = 48 }: ProgressRingProps) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={brandColor}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color: brandColor }}>
          {progress}%
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// Assignment Grid Component
// =============================================================================

interface AssignmentGridProps {
  usages: (AssignmentUsage & { assignment: Assignment })[]
  brandColor: string
  challengeSlug: string
  onPasswordRequired: (id: string, title: string) => void
  startLabel: string
  completedIds: string[]
  showProgress: boolean
}

function AssignmentGrid({
  usages,
  brandColor,
  challengeSlug,
  onPasswordRequired,
  startLabel,
  completedIds,
  showProgress
}: AssignmentGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
      {usages.map((usage, index) => (
        <AssignmentTile
          key={usage.id}
          usage={usage}
          index={index + 1}
          brandColor={brandColor}
          challengeSlug={challengeSlug}
          onPasswordRequired={onPasswordRequired}
          startLabel={startLabel}
          isCompleted={completedIds.includes(usage.assignment.id)}
          showProgress={showProgress}
        />
      ))}
    </div>
  )
}

// =============================================================================
// Assignment Tile Component
// =============================================================================

interface AssignmentTileProps {
  usage: AssignmentUsage & { assignment: Assignment }
  index: number
  brandColor: string
  challengeSlug: string
  onPasswordRequired: (id: string, title: string) => void
  startLabel: string
  isCompleted: boolean
  showProgress: boolean
}

function AssignmentTile({
  usage,
  index,
  brandColor,
  challengeSlug,
  startLabel,
  isCompleted,
}: AssignmentTileProps) {
  const assignment = usage.assignment
  const displayTitle = usage.public_title_override || assignment.public_title || assignment.internal_title
  const subtitle = usage.subtitle_override || assignment.subtitle
  const label = usage.label || ''
  const hasPassword = !!assignment.password_hash
  const isMilestone = usage.is_milestone
  const href = `/${assignment.slug}?from=${challengeSlug}`

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col rounded-2xl bg-white overflow-hidden transition-all duration-300',
        'border-2 hover:shadow-xl hover:-translate-y-1',
        isCompleted 
          ? 'border-green-300 shadow-green-100' 
          : isMilestone
          ? 'border-amber-300 shadow-amber-100'
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      {isMilestone && !isCompleted && (
        <div 
          className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
          style={{ 
            background: `radial-gradient(ellipse at top, rgba(251, 191, 36, 0.4), transparent 70%)`
          }}
        />
      )}

      <div className="relative aspect-[16/10] overflow-hidden">
        {assignment.visual_url ? (
          <img
            src={assignment.visual_url}
            alt={displayTitle}
            className={cn(
              'h-full w-full object-cover transition-all duration-500',
              'group-hover:scale-105',
              isCompleted && 'grayscale-[30%]'
            )}
          />
        ) : (
          <div 
            className="h-full w-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${brandColor}20, ${brandColor}40)` 
            }}
          >
            <span className="text-5xl drop-shadow-md">{getAssignmentEmoji(index)}</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {isCompleted ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
              <CheckCircleIcon className="h-4 w-4" />
            </span>
          ) : label ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg bg-white text-gray-900">
              {label}
            </span>
          ) : null}

          <div className="flex gap-2">
            {isMilestone && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white shadow-lg">
                <TrophyIcon className="h-4 w-4" />
              </span>
            )}
            {hasPassword && !isCompleted && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg">
                <LockIcon className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <h3 className={cn(
          'font-bold text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors',
          'text-base sm:text-lg leading-tight'
        )}>
          {displayTitle}
        </h3>
        {subtitle && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="p-4 pt-0">
        <div
          className={cn(
            'w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-300',
            'shadow-sm group-hover:shadow-md',
            isCompleted 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'text-white'
          )}
          style={!isCompleted ? { backgroundColor: brandColor } : undefined}
        >
          {isCompleted ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {startLabel}
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// =============================================================================
// Helper Components
// =============================================================================

function EmptyState({ brandColor }: { brandColor: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div 
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl"
        style={{ backgroundColor: `${brandColor}15` }}
      >
        <span className="text-5xl">📚</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">No assignments yet</h3>
      <p className="text-gray-600 max-w-md">
        Content is being prepared for you. Check back soon!
      </p>
    </div>
  )
}

function PendingIndicator({ 
  count, 
  brandColor, 
  label 
}: { 
  count: number
  brandColor: string
  label: string 
}) {
  return (
    <div 
      className="rounded-2xl border-2 border-dashed p-8 text-center"
      style={{ borderColor: `${brandColor}40`, backgroundColor: `${brandColor}05` }}
    >
      <div className="mb-4 flex items-center justify-center">
        <div 
          className="flex h-16 w-16 items-center justify-center rounded-2xl animate-pulse"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <span className="text-3xl">⏳</span>
        </div>
      </div>
      <h4 className="font-bold text-gray-900 text-lg">
        {count} more assignment{count !== 1 ? 's' : ''} {label}
      </h4>
      <p className="mt-2 text-sm text-gray-500">
        Check back later for new content
      </p>
    </div>
  )
}

function getAssignmentEmoji(index: number): string {
  const emojis = ['📖', '✏️', '💡', '🎯', '🚀', '⭐', '🔥', '💪', '🎨', '📝', '🏆', '💎']
  return emojis[(index - 1) % emojis.length]
}

// =============================================================================
// Icons
// =============================================================================

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.748 0" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
