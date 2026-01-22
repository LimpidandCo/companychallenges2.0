'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { AuthGate } from '@/components/public/auth-gate'
import { SupportModal } from '@/components/public/support-modal'
import { PasswordGate } from '@/components/public/password-gate'
import { useLabels } from '@/lib/hooks/use-labels'
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
 * Assignments Grid Page - Enhanced with Gamification
 * 
 * Features:
 * - Sprint tabs for filtering
 * - Progress ring visualization
 * - Milestone celebrations
 * - Completion status badges
 * - Locked/unlocked states
 * - Beautiful tile design
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
  totalProgress: serverTotalProgress = 0,
}: AssignmentsGridClientProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string
    title: string
  } | null>(null)
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null)
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
    // Trigger page load animation
    setIsPageLoaded(true)
  }, [challenge.id])

  // Merge server and local completed IDs
  const completedIds = useMemo(() => {
    const merged = new Set([...serverCompletedIds, ...localCompletedIds])
    return Array.from(merged)
  }, [serverCompletedIds, localCompletedIds])

  // Calculate progress from completed assignments
  const totalProgress = useMemo(() => {
    if (usages.length === 0) return 0
    return Math.round((completedIds.length / usages.length) * 100)
  }, [completedIds.length, usages.length])

  const title = challenge.show_public_title && challenge.public_title
    ? challenge.public_title
    : client.name

  const brandColor = challenge.brand_color || '#ff6b4a'
  // Merge with defaults to ensure all feature flags are present
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

  // Filtered usages based on active sprint
  const filteredUsages = useMemo(() => {
    if (!hasSprints || activeSprintId === null) return usages
    return sprintMap.get(activeSprintId) || []
  }, [hasSprints, activeSprintId, usages, sprintMap])

  // Calculate sprint progress
  const getSprintProgress = (sprintId: string | null) => {
    const sprintUsages = sprintMap.get(sprintId) || []
    const completed = sprintUsages.filter(u => completedIds.includes(u.assignment.id)).length
    return { completed, total: sprintUsages.length }
  }

  // Get next milestone
  const nextMilestone = useMemo(() => {
    if (!showMilestones) return null
    // Find first uncompleted milestone based on progress
    return milestones.find(m => {
      if (m.trigger_type === 'percentage') {
        return totalProgress < parseInt(m.trigger_value)
      }
      return true
    })
  }, [showMilestones, milestones, totalProgress])

  return (
    <AuthGate
      challengeId={challenge.id}
      challengeMode={challenge.mode || 'collective'}
      challengeTitle={title}
      brandColor={brandColor}
    >
      {/* Password Gate Modal */}
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
              {/* Logo & Title */}
              <div className="flex items-center gap-4">
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
                    href={`/c/${challenge.slug}`}
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

              {/* Right side - Progress Ring + Info */}
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

        {/* Sprint Tabs */}
        {hasSprints && (
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex gap-1 overflow-x-auto py-3 -mb-px scrollbar-hide">
                <SprintTab
                  label={getLabel('all') || 'All'}
                  isActive={activeSprintId === null}
                  onClick={() => setActiveSprintId(null)}
                  brandColor={brandColor}
                  progress={showProgress ? { completed: completedIds.length, total: usages.length } : undefined}
                />
                {sprints.map((sprint, index) => {
                  const progress = showProgress ? getSprintProgress(sprint.id) : undefined
                  const isLocked = sprint.starts_at ? new Date(sprint.starts_at) > new Date() : false
                  return (
                    <SprintTab
                      key={sprint.id}
                      label={`${getLabel('sprint')} ${index + 1}`}
                      subtitle={sprint.name}
                      isActive={activeSprintId === sprint.id}
                      onClick={() => setActiveSprintId(sprint.id)}
                      brandColor={brandColor}
                      isLocked={isLocked}
                      progress={progress}
                    />
                  )
                })}
              </div>
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
          {filteredUsages.length === 0 && pendingCount === 0 ? (
            <EmptyState brandColor={brandColor} />
          ) : (
            <div className="space-y-10">
              {/* Active Sprint Header (when filtered) */}
              {hasSprints && activeSprintId && (() => {
                const activeSprint = sprints.find(s => s.id === activeSprintId)
                if (!activeSprint) return null
                return (
                  <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {activeSprint.name}
                    </h2>
                    {activeSprint.description && (
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        {activeSprint.description}
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Assignment Grid */}
              <AssignmentGrid
                usages={filteredUsages}
                brandColor={brandColor}
                challengeSlug={challenge.slug}
                onPasswordRequired={(id, title) => setSelectedAssignment({ id, title })}
                startLabel={getLabel('start')}
                completedIds={completedIds}
                showProgress={showProgress}
              />

              {/* Pending assignments indicator */}
              {pendingCount > 0 && (
                <PendingIndicator 
                  count={pendingCount} 
                  brandColor={brandColor}
                  label={getLabel('coming_soon')}
                />
              )}
            </div>
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
// Sprint Tab Component
// =============================================================================

interface SprintTabProps {
  label: string
  subtitle?: string
  isActive: boolean
  onClick: () => void
  brandColor: string
  isLocked?: boolean
  progress?: { completed: number; total: number }
}

function SprintTab({
  label,
  subtitle,
  isActive,
  onClick,
  brandColor,
  isLocked,
  progress
}: SprintTabProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        'relative flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
        isActive
          ? 'text-white shadow-md'
          : isLocked
          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100'
      )}
      style={isActive ? { backgroundColor: brandColor } : undefined}
    >
      <div className="flex items-center gap-2">
        {isLocked && <LockIcon className="h-3.5 w-3.5" />}
        <span>{label}</span>
        {progress && !isLocked && (
          <span 
            className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            )}
          >
            {progress.completed}/{progress.total}
          </span>
        )}
      </div>
      {subtitle && (
        <div className={cn(
          'text-xs mt-0.5 truncate max-w-[120px]',
          isActive ? 'text-white/80' : 'text-gray-400'
        )}>
          {subtitle}
        </div>
      )}
    </button>
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
        {/* Background circle */}
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
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
  showProgress,
}: AssignmentTileProps) {
  const assignment = usage.assignment
  const displayTitle = usage.public_title_override || assignment.public_title || assignment.internal_title
  const subtitle = usage.subtitle_override || assignment.subtitle
  const label = usage.label || ''  // No default label - admins can customize per assignment
  const hasPassword = !!assignment.password_hash
  const isMilestone = usage.is_milestone
  const href = `/a/${assignment.slug}?from=${challengeSlug}`

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
      {/* Milestone Glow Effect */}
      {isMilestone && !isCompleted && (
        <div 
          className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
          style={{ 
            background: `radial-gradient(ellipse at top, rgba(251, 191, 36, 0.4), transparent 70%)`
          }}
        />
      )}

      {/* Image Container */}
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
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Status Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* Label Badge */}
          <span 
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg',
              isCompleted ? 'bg-green-500 text-white' : 'bg-white text-gray-900'
            )}
          >
            {isCompleted ? '✓ Done' : label}
          </span>

          {/* Right badges */}
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

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Title */}
        <h3 className={cn(
          'font-bold text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors',
          'text-base sm:text-lg leading-tight'
        )}>
          {displayTitle}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Button */}
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
              <CheckCircleIcon className="h-4 w-4" />
              Review
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

// Helper function to get emoji for assignments without images
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
