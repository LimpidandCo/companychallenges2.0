'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Textarea,
  Select,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@/components/ui'
import { createMilestone, updateMilestone } from '@/lib/actions/milestones'
import type { Milestone, MilestoneInsert, MilestoneUpdate, Sprint, AssignmentUsageWithAssignment } from '@/lib/types/database'

interface MilestoneFormProps {
  challengeId: string
  milestone?: Milestone | null
  sprints: Sprint[]
  usages: AssignmentUsageWithAssignment[]
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const TRIGGER_TYPE_OPTIONS = [
  { value: 'assignment_complete', label: 'Assignment Complete' },
  { value: 'sprint_complete', label: 'Sprint Complete' },
  { value: 'percentage', label: 'Percentage Complete' },
  { value: 'custom', label: 'Custom Trigger' },
]

const CELEBRATION_TYPE_OPTIONS = [
  { value: 'message', label: 'Message' },
  { value: 'badge', label: 'Badge' },
  { value: 'animation', label: 'Animation' },
  { value: 'unlock', label: 'Unlock Content' },
]

export function MilestoneForm({
  challengeId,
  milestone,
  sprints,
  usages,
  open,
  onClose,
  onSuccess,
}: MilestoneFormProps) {
  const isEditing = !!milestone
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<'assignment_complete' | 'sprint_complete' | 'percentage' | 'custom'>('assignment_complete')
  const [triggerValue, setTriggerValue] = useState('')
  const [celebrationType, setCelebrationType] = useState<'badge' | 'message' | 'animation' | 'unlock'>('message')
  const [celebrationContent, setCelebrationContent] = useState('')

  // Reset form when dialog opens or milestone changes
  useEffect(() => {
    if (open) {
      setName(milestone?.name ?? '')
      setDescription(milestone?.description ?? '')
      setTriggerType(milestone?.trigger_type ?? 'assignment_complete')
      setTriggerValue(milestone?.trigger_value ?? '')
      setCelebrationType(milestone?.celebration_type ?? 'message')
      setCelebrationContent(milestone?.celebration_content ?? '')
      setError(null)
    }
  }, [open, milestone])

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate trigger value
    if (!triggerValue.trim()) {
      setError('Please select or enter a trigger value')
      setLoading(false)
      return
    }

    try {
      if (isEditing && milestone) {
        const update: MilestoneUpdate = {
          name: name.trim(),
          description: description.trim() || null,
          trigger_type: triggerType,
          trigger_value: triggerValue.trim(),
          celebration_type: celebrationType,
          celebration_content: celebrationContent.trim() || null,
        }

        const result = await updateMilestone(milestone.id, update)

        if (result.success) {
          onSuccess()
          handleClose()
        } else {
          setError(result.error)
        }
      } else {
        const input: MilestoneInsert = {
          challenge_id: challengeId,
          name: name.trim(),
          description: description.trim() || null,
          trigger_type: triggerType,
          trigger_value: triggerValue.trim(),
          celebration_type: celebrationType,
          celebration_content: celebrationContent.trim() || null,
        }

        const result = await createMilestone(input)

        if (result.success) {
          onSuccess()
          handleClose()
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Build assignment options
  const assignmentOptions = [
    { value: '', label: 'Select an assignment...' },
    ...usages.map((u) => ({
      value: u.assignment_id,
      label: u.assignment.internal_title,
    })),
  ]

  // Build sprint options
  const sprintOptions = [
    { value: '', label: 'Select a sprint...' },
    ...sprints.map((s) => ({
      value: s.id,
      label: s.name,
    })),
  ]

  // Get helper text for trigger value input
  const getTriggerHint = () => {
    switch (triggerType) {
      case 'assignment_complete':
        return 'Triggered when user completes this assignment'
      case 'sprint_complete':
        return 'Triggered when user completes all assignments in this sprint'
      case 'percentage':
        return 'Triggered when user completes this percentage of the challenge (0-100)'
      case 'custom':
        return 'Custom trigger key for programmatic triggering'
      default:
        return ''
    }
  }

  // Get helper text for celebration content
  const getCelebrationHint = () => {
    switch (celebrationType) {
      case 'message':
        return 'The congratulations message to display'
      case 'badge':
        return 'URL to the badge image'
      case 'animation':
        return 'Animation name or URL (e.g., confetti, fireworks)'
      case 'unlock':
        return 'ID or URL of content to unlock'
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Milestone' : 'Create Milestone'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the milestone details below.'
              : 'Create a milestone to celebrate participant achievements.'}
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Milestone Name <span className="text-[var(--color-error)]">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., First Assignment Complete!"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this milestone..."
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Trigger Type <span className="text-[var(--color-error)]">*</span>
              </label>
              <Select
                value={triggerType}
                onChange={(e) => {
                  setTriggerType(e.target.value as typeof triggerType)
                  setTriggerValue('') // Reset trigger value when type changes
                }}
                options={TRIGGER_TYPE_OPTIONS}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Trigger Value <span className="text-[var(--color-error)]">*</span>
              </label>
              {triggerType === 'assignment_complete' ? (
                <Select
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  options={assignmentOptions}
                  disabled={loading}
                />
              ) : triggerType === 'sprint_complete' ? (
                <Select
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  options={sprintOptions}
                  disabled={loading}
                />
              ) : triggerType === 'percentage' ? (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  placeholder="e.g., 50"
                  disabled={loading}
                />
              ) : (
                <Input
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  placeholder="e.g., custom_trigger_key"
                  disabled={loading}
                />
              )}
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                {getTriggerHint()}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Celebration Type <span className="text-[var(--color-error)]">*</span>
              </label>
              <Select
                value={celebrationType}
                onChange={(e) => setCelebrationType(e.target.value as typeof celebrationType)}
                options={CELEBRATION_TYPE_OPTIONS}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Celebration Content
              </label>
              {celebrationType === 'message' ? (
                <Textarea
                  value={celebrationContent}
                  onChange={(e) => setCelebrationContent(e.target.value)}
                  placeholder="Congratulations! You've completed..."
                  rows={2}
                  disabled={loading}
                />
              ) : (
                <Input
                  value={celebrationContent}
                  onChange={(e) => setCelebrationContent(e.target.value)}
                  placeholder={celebrationType === 'badge' ? 'https://...' : celebrationType === 'animation' ? 'confetti' : 'content_id'}
                  disabled={loading}
                />
              )}
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                {getCelebrationHint()}
              </p>
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim() || !triggerValue.trim()}>
            {loading ? <Spinner size="sm" /> : isEditing ? 'Update Milestone' : 'Create Milestone'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
