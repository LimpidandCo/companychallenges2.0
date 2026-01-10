'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Select,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  Spinner,
  RichTextEditor,
} from '@/components/ui'
import { createAssignment, updateAssignment } from '@/lib/actions/assignments'
import type { Assignment, AssignmentWithUsages } from '@/lib/types/database'

interface AssignmentFormProps {
  assignment?: AssignmentWithUsages | null
  open: boolean
  onClose: () => void
  onSuccess?: (assignment: Assignment) => void
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'video', label: 'Video' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'announcement', label: 'Announcement' },
]

export function AssignmentForm({ assignment, open, onClose, onSuccess }: AssignmentFormProps) {
  const isEditing = !!assignment
  const usageCount = assignment?.assignment_usages?.length ?? 0
  const isSharedAssignment = usageCount > 1

  const [internalTitle, setInternalTitle] = useState(assignment?.internal_title ?? '')
  const [publicTitle, setPublicTitle] = useState(assignment?.public_title ?? '')
  const [subtitle, setSubtitle] = useState(assignment?.subtitle ?? '')
  const [description, setDescription] = useState(assignment?.description ?? '')
  const [mediaUrl, setMediaUrl] = useState(assignment?.media_url ?? '')
  const [contentType, setContentType] = useState<'standard' | 'quiz' | 'video' | 'announcement'>(
    assignment?.content_type ?? 'standard'
  )
  const [password, setPassword] = useState('')
  const [removePassword, setRemovePassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasPassword = assignment?.password_hash !== null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = isEditing
        ? await updateAssignment(assignment.id, {
            internal_title: internalTitle,
            public_title: publicTitle || null,
            subtitle: subtitle || null,
            description: description || null,
            media_url: mediaUrl || null,
            content_type: contentType,
            password: removePassword ? null : (password || undefined),
          })
        : await createAssignment({
            internal_title: internalTitle,
            public_title: publicTitle || null,
            subtitle: subtitle || null,
            description: description || null,
            media_url: mediaUrl || null,
            content_type: contentType,
            password: password || undefined,
          })

      if (result.success) {
        onSuccess?.(result.data)
        onClose()
        // Reset form for next use
        if (!isEditing) {
          setInternalTitle('')
          setPublicTitle('')
          setSubtitle('')
          setDescription('')
          setMediaUrl('')
          setContentType('standard')
          setPassword('')
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the assignment content. Changes apply everywhere this assignment is used.'
              : 'Create a new reusable content unit.'}
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Warning for shared assignments */}
          {isEditing && isSharedAssignment && (
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-amber-50 p-3 dark:bg-amber-950/30">
              <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Shared Content Warning
                </p>
                <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                  This assignment is used in <strong>{usageCount} challenges</strong>.
                  Changes will apply everywhere it's used.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <Input
            label="Internal Title"
            name="internal_title"
            value={internalTitle}
            onChange={(e) => setInternalTitle(e.target.value)}
            placeholder="Week 1: Introduction"
            hint="Admin-only identifier for this assignment."
            required
          />

          <Input
            label="Public Title"
            name="public_title"
            value={publicTitle}
            onChange={(e) => setPublicTitle(e.target.value)}
            placeholder="Getting Started"
            hint="Optional. Title shown to participants."
          />

          <Input
            label="Subtitle"
            name="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Learn the basics..."
            hint="Optional. Short description below title."
          />

          <Select
            label="Content Type"
            name="content_type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as typeof contentType)}
            options={CONTENT_TYPE_OPTIONS}
          />

          <RichTextEditor
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Full content of the assignment..."
            hint="Use the toolbar to format text, add links, images, and embed videos."
          />

          <Input
            label="Media URL"
            name="media_url"
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://www.youtube.com/embed/..."
            hint="Optional. Embedded video URL."
          />

          <div className="space-y-2">
            <Input
              label="Password Protection"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={hasPassword ? '(unchanged)' : 'Leave empty for no password'}
              hint="Shared access key for participants."
            />
            {isEditing && hasPassword && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={removePassword}
                  onChange={(e) => setRemovePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                />
                <span className="text-[var(--color-fg)]">Remove password protection</span>
              </label>
            )}
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !internalTitle.trim()}>
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            {isEditing ? 'Save Changes' : 'Create Assignment'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}
