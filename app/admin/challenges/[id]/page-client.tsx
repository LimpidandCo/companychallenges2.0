'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Spinner,
} from '@/components/ui'
import { AssignmentPicker, AssignmentUsageEditor, SprintForm, SprintList, AnnouncementForm, AnnouncementList, MilestoneForm, MilestoneList, MicroQuizEditor, AssignmentForm, ChallengeForm } from '@/components/admin'
import {
  addAssignmentToChallenge,
  removeAssignmentFromChallenge,
  updateAssignmentUsage,
  reorderAssignmentUsages,
} from '@/lib/actions/assignment-usages'
import type {
  ChallengeWithClient,
  AssignmentUsageWithAssignment,
  AssignmentWithUsages,
  Sprint,
  Announcement,
  Milestone,
} from '@/lib/types/database'
import { DEFAULT_CHALLENGE_FEATURES } from '@/lib/types/database'

interface ChallengeDetailClientProps {
  challenge: ChallengeWithClient
  initialUsages: AssignmentUsageWithAssignment[]
  allAssignments: AssignmentWithUsages[]
  initialSprints: Sprint[]
  initialAnnouncements: Announcement[]
  initialMilestones: Milestone[]
  initialError: string | null
}

const CONTENT_TYPE_BADGES: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }> = {
  standard: { label: 'Standard', variant: 'default' },
  video: { label: 'Video', variant: 'success' },
  quiz: { label: 'Quiz', variant: 'warning' },
  announcement: { label: 'Announcement', variant: 'outline' },
}

export function ChallengeDetailClient({
  challenge,
  initialUsages,
  allAssignments,
  initialSprints,
  initialAnnouncements,
  initialMilestones,
  initialError,
}: ChallengeDetailClientProps) {
  const router = useRouter()
  const [usages, setUsages] = useState(initialUsages)
  const [sprints, setSprints] = useState(initialSprints)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [milestones, setMilestones] = useState(initialMilestones)

  // Sync state with props when they change (after router.refresh())
  useEffect(() => {
    setUsages(initialUsages)
  }, [initialUsages])

  useEffect(() => {
    setSprints(initialSprints)
  }, [initialSprints])

  useEffect(() => {
    setAnnouncements(initialAnnouncements)
  }, [initialAnnouncements])

  useEffect(() => {
    setMilestones(initialMilestones)
  }, [initialMilestones])

  // Feature flags from challenge settings (merge with defaults for missing keys)
  const features = { ...DEFAULT_CHALLENGE_FEATURES, ...(challenge.features ?? {}) }
  const isIndividualMode = challenge.mode === 'individual' || challenge.mode === 'hybrid'
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isChallengeFormOpen, setIsChallengeFormOpen] = useState(false)
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithUsages | null>(null)
  const [editingUsage, setEditingUsage] = useState<AssignmentUsageWithAssignment | null>(null)
  const [isSprintFormOpen, setIsSprintFormOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [isAnnouncementFormOpen, setIsAnnouncementFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [quizEditorUsage, setQuizEditorUsage] = useState<AssignmentUsageWithAssignment | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(initialError)

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter out assignments already in use
  const usedAssignmentIds = new Set(usages.map((u) => u.assignment_id))
  const availableAssignments = allAssignments.filter((a) => !usedAssignmentIds.has(a.id))

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = usages.findIndex((u) => u.id === active.id)
      const newIndex = usages.findIndex((u) => u.id === over.id)

      // Optimistically update UI
      const newUsages = arrayMove(usages, oldIndex, newIndex)
      setUsages(newUsages)

      // Persist the new order
      try {
        const result = await reorderAssignmentUsages(newUsages.map((u) => u.id))
        if (!result.success) {
          // Revert on error
          setUsages(usages)
          setError(result.error ?? 'Failed to reorder assignments')
        }
      } catch (err) {
        setUsages(usages)
        setError('Failed to reorder assignments')
      }
    }
  }

  const handleAddAssignment = async (assignmentId: string) => {
    setActionId(assignmentId)
    setError(null)

    try {
      const result = await addAssignmentToChallenge({
        challenge_id: challenge.id,
        assignment_id: assignmentId,
      })

      if (result.success) {
        router.refresh()
        setIsPickerOpen(false)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to add assignment')
    } finally {
      setActionId(null)
    }
  }

  const handleRemoveAssignment = async (usageId: string, title: string) => {
    if (!confirm(`Remove "${title}" from this challenge? The assignment itself will not be deleted.`)) {
      return
    }

    setActionId(usageId)
    setError(null)

    try {
      const result = await removeAssignmentFromChallenge(usageId)

      if (result.success) {
        setUsages(usages.filter((u) => u.id !== usageId))
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to remove assignment')
      }
    } catch (err) {
      setError('Failed to remove assignment')
    } finally {
      setActionId(null)
    }
  }

  const handleToggleVisibility = async (usage: AssignmentUsageWithAssignment) => {
    setActionId(usage.id)

    try {
      const result = await updateAssignmentUsage(usage.id, {
        is_visible: !usage.is_visible,
      })

      if (result.success) {
        setUsages(usages.map((u) =>
          u.id === usage.id ? { ...u, is_visible: !u.is_visible } : u
        ))
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to update visibility')
    } finally {
      setActionId(null)
    }
  }

  const handleSprintChange = async (usageId: string, sprintId: string | null) => {
    setActionId(usageId)

    try {
      const result = await updateAssignmentUsage(usageId, {
        sprint_id: sprintId,
      })

      if (result.success) {
        setUsages(usages.map((u) =>
          u.id === usageId ? { ...u, sprint_id: sprintId } : u
        ))
      } else {
        setError(result.error ?? 'Failed to assign sprint')
      }
    } catch (err) {
      setError('Failed to assign sprint')
    } finally {
      setActionId(null)
    }
  }

  const handleEditSuccess = () => {
    router.refresh()
  }

  const handleSprintRefresh = () => {
    router.refresh()
  }

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint)
    setIsSprintFormOpen(true)
  }

  const handleSprintFormClose = () => {
    setEditingSprint(null)
    setIsSprintFormOpen(false)
  }

  const handleAnnouncementRefresh = () => {
    router.refresh()
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setIsAnnouncementFormOpen(true)
  }

  const handleAnnouncementFormClose = () => {
    setEditingAnnouncement(null)
    setIsAnnouncementFormOpen(false)
  }

  const handleMilestoneRefresh = () => {
    router.refresh()
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setIsMilestoneFormOpen(true)
  }

  const handleMilestoneFormClose = () => {
    setEditingMilestone(null)
    setIsMilestoneFormOpen(false)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Link href="/admin/clients" className="hover:text-gray-900 transition-colors">
            Clients
          </Link>
          <ChevronIcon className="h-4 w-4 text-gray-300" />
          <Link href={`/admin/clients/${challenge.client_id}`} className="hover:text-gray-900 transition-colors">
            {challenge.client.name}
          </Link>
          <ChevronIcon className="h-4 w-4 text-gray-300" />
          <span className="text-gray-900 font-medium">{challenge.internal_name}</span>
        </nav>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
              style={{ backgroundColor: challenge.brand_color || '#3b82f6' }}
            >
              {challenge.internal_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {challenge.internal_name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <code className="px-2 py-0.5 bg-gray-100 rounded font-mono text-gray-700">
                  /{challenge.slug}
                </code>
                {challenge.folder && (
                  <span className="flex items-center gap-1">
                    <FolderIcon className="h-3.5 w-3.5" />
                    {challenge.folder}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChallengeFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Challenge
            </button>
            <a
              href={`/${challenge.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              style={{ backgroundColor: challenge.brand_color || '#3b82f6' }}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Preview
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="mb-8 flex items-center gap-6 py-4 px-6 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
        <StatPill label="Assignments" value={usages.length} icon="📋" />
        <div className="h-8 w-px bg-gray-200" />
        <StatPill label="Visible" value={usages.filter(u => u.is_visible).length} icon="👁️" />
        <div className="h-8 w-px bg-gray-200" />
        <StatPill label="Sprints" value={sprints.length} icon="🏃" />
        {features.milestones && (
          <>
            <div className="h-8 w-px bg-gray-200" />
            <StatPill label="Milestones" value={milestones.length} icon="🏆" />
          </>
        )}
      </div>

      {/* Sprints Section - Only show if sprint_structure feature is enabled */}
      {features.sprint_structure && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sprints</CardTitle>
                <CardDescription>
                  Organize assignments into themed phases. Drag to reorder.
                </CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsSprintFormOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Create Sprint
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sprints.length > 0 ? (
              <SprintList
                sprints={sprints}
                usages={usages}
                challengeSlug={challenge.slug}
                onEdit={handleEditSprint}
                onRefresh={handleSprintRefresh}
              />
            ) : (
              <div className="flex min-h-[100px] items-center justify-center text-[var(--color-fg-muted)]">
                <div className="text-center">
                  <LayersIcon className="mx-auto h-8 w-8 text-[var(--color-fg-subtle)]" />
                  <p className="mt-2 text-sm">
                    No sprints yet. Create sprints to group assignments into phases.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Announcements Section - Only show if announcements feature is enabled */}
      {features.announcements && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>
                  Post updates and communicate with participants.
                </CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsAnnouncementFormOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Post Announcement
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {announcements.length > 0 ? (
              <AnnouncementList
                announcements={announcements}
                onEdit={handleEditAnnouncement}
                onRefresh={handleAnnouncementRefresh}
              />
            ) : (
              <div className="flex min-h-[100px] items-center justify-center text-[var(--color-fg-muted)]">
                <div className="text-center">
                  <MegaphoneIcon className="mx-auto h-8 w-8 text-[var(--color-fg-subtle)]" />
                  <p className="mt-2 text-sm">
                    No announcements yet. Post updates to communicate with participants.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Milestones Section - Only show if milestones feature is enabled AND mode supports it */}
      {features.milestones && isIndividualMode && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>
                  Define achievement moments to celebrate participant progress.
                </CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsMilestoneFormOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Add Milestone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {milestones.length > 0 ? (
              <MilestoneList
                milestones={milestones}
                sprints={sprints}
                usages={usages}
                onEdit={handleEditMilestone}
                onRefresh={handleMilestoneRefresh}
              />
            ) : (
              <div className="flex min-h-[100px] items-center justify-center text-[var(--color-fg-muted)]">
                <div className="text-center">
                  <TrophyIcon className="mx-auto h-8 w-8 text-[var(--color-fg-subtle)]" />
                  <p className="mt-2 text-sm">
                    No milestones yet. Add milestones to celebrate achievements.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignments Section */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
            <p className="text-sm text-gray-500 mt-0.5">Drag to reorder • Click to edit</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setIsPickerOpen(true)}
              className="rounded-lg"
            >
              <LibraryIcon className="h-4 w-4" />
              Library
            </Button>
            <Button 
              size="sm"
              onClick={() => setIsAssignmentFormOpen(true)}
              className="rounded-lg"
            >
              <PlusIcon className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </div>

        {/* Assignments List */}
        {usages.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={usages.map((u) => u.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-100">
                {usages.map((usage, index) => (
                  <SortableAssignmentRow
                    key={usage.id}
                    usage={usage}
                    index={index}
                    actionId={actionId}
                    showQuizButton={usage.assignment.content_type === 'quiz'}
                    challengeSlug={challenge.slug}
                    brandColor={challenge.brand_color || '#3b82f6'}
                    sprints={sprints}
                    onEditSettings={() => setEditingUsage(usage)}
                    onEditContent={() => {
                      const fullAssignment = allAssignments.find(a => a.id === usage.assignment_id)
                      if (fullAssignment) {
                        setEditingAssignment(fullAssignment)
                        setIsAssignmentFormOpen(true)
                      }
                    }}
                    onQuiz={() => setQuizEditorUsage(usage)}
                    onToggleVisibility={() => handleToggleVisibility(usage)}
                    onRemove={() => handleRemoveAssignment(usage.id, usage.assignment.internal_title)}
                    onSprintChange={(sprintId) => handleSprintChange(usage.id, sprintId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No assignments yet
            </h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
              Create new assignments or pick existing ones from your library.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setIsPickerOpen(true)}>
                <LibraryIcon className="h-4 w-4" />
                From Library
              </Button>
              <Button onClick={() => setIsAssignmentFormOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Create New
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Picker Dialog */}
      <AssignmentPicker
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        assignments={availableAssignments}
        challengeId={challenge.id}
        onSelect={handleAddAssignment}
        loading={actionId !== null}
      />

      {/* Assignment Usage Editor Dialog */}
      <AssignmentUsageEditor
        usage={editingUsage}
        sprints={sprints}
        open={!!editingUsage}
        onClose={() => setEditingUsage(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Sprint Form Dialog */}
      <SprintForm
        challengeId={challenge.id}
        sprint={editingSprint}
        open={isSprintFormOpen}
        onClose={handleSprintFormClose}
        onSuccess={handleSprintRefresh}
      />

      {/* Announcement Form Dialog */}
      <AnnouncementForm
        challengeId={challenge.id}
        announcement={editingAnnouncement}
        open={isAnnouncementFormOpen}
        onClose={handleAnnouncementFormClose}
        onSuccess={handleAnnouncementRefresh}
      />

      {/* Milestone Form Dialog */}
      <MilestoneForm
        challengeId={challenge.id}
        milestone={editingMilestone}
        sprints={sprints}
        usages={usages}
        open={isMilestoneFormOpen}
        onClose={handleMilestoneFormClose}
        onSuccess={handleMilestoneRefresh}
      />

      {/* Micro-Quiz Editor Dialog */}
      <MicroQuizEditor
        usage={quizEditorUsage}
        open={!!quizEditorUsage}
        onClose={() => setQuizEditorUsage(null)}
      />

      {/* Assignment Form Dialog */}
      <AssignmentForm
        assignment={editingAssignment}
        challengeId={editingAssignment ? undefined : challenge.id}
        open={isAssignmentFormOpen}
        onClose={() => {
          setIsAssignmentFormOpen(false)
          setEditingAssignment(null)
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Challenge Form Dialog */}
      <ChallengeForm
        clientId={challenge.client_id}
        challenge={challenge}
        open={isChallengeFormOpen}
        onClose={() => setIsChallengeFormOpen(false)}
        onSuccess={() => {
          setIsChallengeFormOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}

// Helper Components

function StatPill({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  )
}

// Sortable Assignment Row Component
interface SortableAssignmentRowProps {
  usage: AssignmentUsageWithAssignment
  index: number
  actionId: string | null
  showQuizButton: boolean
  challengeSlug: string
  brandColor: string
  sprints: Sprint[]
  onEditSettings: () => void
  onEditContent: () => void
  onQuiz: () => void
  onToggleVisibility: () => void
  onRemove: () => void
  onSprintChange: (sprintId: string | null) => void
}

function SortableAssignmentRow({
  usage,
  index,
  actionId,
  showQuizButton,
  challengeSlug,
  brandColor,
  sprints,
  onEditSettings,
  onEditContent,
  onQuiz,
  onToggleVisibility,
  onRemove,
  onSprintChange,
}: SortableAssignmentRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: usage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const assignment = usage.assignment
  const isHidden = !usage.is_visible
  const isScheduled = usage.release_at && new Date(usage.release_at) > new Date()
  const assignedSprint = sprints.find(s => s.id === usage.sprint_id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 px-5 py-4 transition-all ${
        isDragging ? 'opacity-50 bg-blue-50' : 'hover:bg-gray-50'
      } ${isHidden ? 'opacity-60' : ''}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-gray-300 hover:text-gray-400 active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripIcon className="h-5 w-5" />
      </button>

      {/* Order Number */}
      <div 
        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
        style={{ backgroundColor: brandColor }}
      >
        {index + 1}
      </div>

      {/* Assignment Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 truncate">
            {assignment.internal_title}
          </span>
          {usage.label && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: brandColor }}
            >
              {usage.label}
            </span>
          )}
          {assignment.content_type !== 'standard' && (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-gray-600">
              {assignment.content_type}
            </span>
          )}
          {isHidden && (
            <span className="px-2 py-0.5 rounded bg-gray-200 text-xs font-medium text-gray-500">
              Hidden
            </span>
          )}
          {isScheduled && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-xs font-medium text-amber-700">
              Scheduled
            </span>
          )}
          {usage.is_milestone && (
            <span className="px-2 py-0.5 rounded bg-green-100 text-xs font-medium text-green-700">
              🏆 Milestone
            </span>
          )}
          {assignedSprint && (
            <span className="px-2 py-0.5 rounded bg-purple-100 text-xs font-medium text-purple-700">
              📦 {assignedSprint.name}
            </span>
          )}
        </div>
        {assignment.public_title && (
          <p className="text-sm text-gray-500 truncate mt-0.5">{assignment.public_title}</p>
        )}
      </div>

      {/* Actions - Always visible for clarity */}
      <div className="flex items-center gap-1">
        {/* Sprint selector dropdown */}
        {sprints.length > 0 && (
          <select
            value={usage.sprint_id || ''}
            onChange={(e) => onSprintChange(e.target.value || null)}
            disabled={actionId === usage.id}
            className="h-8 px-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            title="Assign to sprint"
          >
            <option value="">No Sprint</option>
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <ActionButton onClick={onEditContent} title="Edit content" disabled={actionId === usage.id}>
          <EditIcon className="h-4 w-4" />
        </ActionButton>
        <ActionButton onClick={onEditSettings} title="Settings" disabled={actionId === usage.id}>
          <SettingsIcon className="h-4 w-4" />
        </ActionButton>
        {showQuizButton && (
          <ActionButton onClick={onQuiz} title="Quizzes" disabled={actionId === usage.id}>
            <QuizIcon className="h-4 w-4" />
          </ActionButton>
        )}
        <ActionButton
          onClick={() => {
            const url = `${window.location.origin}/${assignment.slug}`
            navigator.clipboard.writeText(url)
          }}
          title="Copy link"
          disabled={actionId === usage.id}
        >
          <CopyIcon className="h-4 w-4" />
        </ActionButton>
        <a
          href={`/${assignment.slug}?from=${challengeSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Preview"
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </a>
        <ActionButton 
          onClick={onToggleVisibility} 
          title={usage.is_visible ? 'Hide' : 'Show'}
          disabled={actionId === usage.id}
        >
          {usage.is_visible ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
        </ActionButton>
        <ActionButton 
          onClick={onRemove} 
          title="Remove" 
          disabled={actionId === usage.id}
          danger
        >
          {actionId === usage.id ? <Spinner size="sm" /> : <TrashIcon className="h-4 w-4" />}
        </ActionButton>
      </div>
    </div>
  )
}

function ActionButton({ 
  onClick, 
  title, 
  disabled, 
  danger, 
  children 
}: { 
  onClick: () => void
  title: string
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
        danger 
          ? 'text-gray-400 hover:bg-red-50 hover:text-red-600' 
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      }`}
    >
      {children}
    </button>
  )
}

// Icons

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
    </svg>
  )
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.992 0" />
    </svg>
  )
}

function QuizIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  )
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  )
}
