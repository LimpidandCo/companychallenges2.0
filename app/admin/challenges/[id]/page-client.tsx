'use client'

import { useState } from 'react'
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
import { AssignmentPicker, AssignmentUsageEditor, SprintForm, SprintList, AnnouncementForm, AnnouncementList, MilestoneForm, MilestoneList, MicroQuizEditor, AssignmentForm } from '@/components/admin'
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
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false)
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
    <div className="p-6 lg:p-8">
      {/* Header with breadcrumb */}
      <div className="mb-6">
        <nav className="mb-2 text-sm text-[var(--color-fg-muted)]">
          <Link href="/admin/clients" className="hover:text-[var(--color-primary)]">
            Clients
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/admin/clients/${challenge.client_id}`} className="hover:text-[var(--color-primary)]">
            {challenge.client.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-fg)]">{challenge.internal_name}</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-fg)]">
              {challenge.internal_name}
            </h1>
            {challenge.public_title && (
              <p className="mt-1 text-[var(--color-fg-muted)]">
                {challenge.public_title}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsAssignmentFormOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              Create New
            </Button>
            <Button variant="secondary" onClick={() => setIsPickerOpen(true)}>
              <LibraryIcon className="h-4 w-4" />
              From Library
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-4 text-sm text-[var(--color-error)]">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Challenge Info Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[var(--color-fg)]">
              {usages.length}
            </div>
            <div className="text-sm text-[var(--color-fg-muted)]">Assignments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[var(--color-fg)]">
              {sprints.length}
            </div>
            <div className="text-sm text-[var(--color-fg-muted)]">Sprints</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[var(--color-fg)]">
              {usages.filter((u) => u.is_visible).length}
            </div>
            <div className="text-sm text-[var(--color-fg-muted)]">Visible</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div
              className="h-6 w-6 rounded-full border border-[var(--color-border)]"
              style={{ backgroundColor: challenge.brand_color ?? '#3b82f6' }}
            />
            <div className="mt-1 text-sm text-[var(--color-fg-muted)]">Brand Color</div>
          </CardContent>
        </Card>
      </div>

      {/* Sprints Section */}
      {(sprints.length > 0 || true) && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sprints</CardTitle>
                <CardDescription>
                  Organize assignments into themed phases. Drag to reorder.
                </CardDescription>
              </div>
              {sprints.length === 0 && (
                <Button variant="secondary" size="sm" onClick={() => setIsSprintFormOpen(true)}>
                  <PlusIcon className="h-4 w-4" />
                  Create Sprint
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sprints.length > 0 ? (
              <SprintList
                sprints={sprints}
                usages={usages}
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

      {/* Announcements Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>
                Post updates and communicate with participants.
              </CardDescription>
            </div>
            {announcements.length === 0 && (
              <Button variant="secondary" size="sm" onClick={() => setIsAnnouncementFormOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Post Announcement
              </Button>
            )}
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

      {/* Milestones Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                Define achievement moments to celebrate participant progress.
              </CardDescription>
            </div>
            {milestones.length === 0 && (
              <Button variant="secondary" size="sm" onClick={() => setIsMilestoneFormOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Add Milestone
              </Button>
            )}
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

      {/* Assignments List with Drag-Drop */}
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>
            Drag to reorder. Click settings to configure visibility and scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
                <div className="divide-y divide-[var(--color-border)]">
                  {usages.map((usage, index) => (
                    <SortableAssignmentRow
                      key={usage.id}
                      usage={usage}
                      index={index}
                      actionId={actionId}
                      onEdit={() => setEditingUsage(usage)}
                      onQuiz={() => setQuizEditorUsage(usage)}
                      onToggleVisibility={() => handleToggleVisibility(usage)}
                      onRemove={() => handleRemoveAssignment(usage.id, usage.assignment.internal_title)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center text-[var(--color-fg-muted)]">
              <div className="text-center">
                <FileTextIcon className="mx-auto h-12 w-12 text-[var(--color-fg-subtle)]" />
                <h3 className="mt-4 text-lg font-medium text-[var(--color-fg)]">
                  No assignments yet
                </h3>
                <p className="mt-1 text-sm">
                  Create a new assignment or pick from your library.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="secondary" onClick={() => setIsAssignmentFormOpen(true)}>
                    <PlusIcon className="h-4 w-4" />
                    Create New
                  </Button>
                  <Button variant="secondary" onClick={() => setIsPickerOpen(true)}>
                    <LibraryIcon className="h-4 w-4" />
                    From Library
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
        challengeId={challenge.id}
        open={isAssignmentFormOpen}
        onClose={() => setIsAssignmentFormOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}

// Sortable Assignment Row Component
interface SortableAssignmentRowProps {
  usage: AssignmentUsageWithAssignment
  index: number
  actionId: string | null
  onEdit: () => void
  onQuiz: () => void
  onToggleVisibility: () => void
  onRemove: () => void
}

function SortableAssignmentRow({
  usage,
  index,
  actionId,
  onEdit,
  onQuiz,
  onToggleVisibility,
  onRemove,
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
    opacity: isDragging ? 0.5 : 1,
  }

  const assignment = usage.assignment
  const badge = CONTENT_TYPE_BADGES[assignment.content_type] ?? CONTENT_TYPE_BADGES.standard

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-subtle)]"
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)] active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripIcon className="h-5 w-5" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-sm font-medium text-[var(--color-fg-muted)]">
          {index + 1}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--color-fg)]">
              {assignment.internal_title}
            </span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {!usage.is_visible && (
              <Badge variant="outline">Hidden</Badge>
            )}
            {usage.release_at && new Date(usage.release_at) > new Date() && (
              <Badge variant="warning">Scheduled</Badge>
            )}
            {usage.is_milestone && (
              <Badge variant="success">Milestone</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-fg-subtle)]">
            {assignment.public_title && (
              <span>{assignment.public_title}</span>
            )}
            {usage.label && (
              <span className="text-[var(--color-primary)]">{usage.label}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={actionId === usage.id}
          title="Edit settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onQuiz}
          disabled={actionId === usage.id}
          title="Manage quizzes"
        >
          <QuizIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          disabled={actionId === usage.id}
          title={usage.is_visible ? 'Hide assignment' : 'Show assignment'}
        >
          {usage.is_visible ? (
            <EyeIcon className="h-4 w-4" />
          ) : (
            <EyeOffIcon className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={actionId === usage.id}
          className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
          title="Remove from challenge"
        >
          {actionId === usage.id ? (
            <Spinner size="sm" />
          ) : (
            <TrashIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
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
