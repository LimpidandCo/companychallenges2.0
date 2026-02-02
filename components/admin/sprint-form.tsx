'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Button,
  Input,
  Textarea,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@/components/ui'
import { InlineRichEditor } from '@/components/ui/inline-rich-editor'
import { createSprint, updateSprint } from '@/lib/actions/sprints'
import { decodePassword } from '@/lib/utils/password'
import { uploadFile } from '@/lib/actions/upload'
import type { Sprint, SprintInsert, SprintUpdate } from '@/lib/types/database'

interface SprintFormProps {
  challengeId: string
  sprint?: Sprint | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SprintForm({ challengeId, sprint, open, onClose, onSuccess }: SprintFormProps) {
  const isEditing = !!sprint
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(sprint?.name ?? '')
  const [subtitle, setSubtitle] = useState(sprint?.subtitle ?? '')
  const [description, setDescription] = useState(sprint?.description ?? '')
  const [descriptionHtml, setDescriptionHtml] = useState(sprint?.description_html ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(sprint?.cover_image_url ?? '')
  const [password, setPassword] = useState(decodePassword(sprint?.password_hash ?? null))
  const [introVideoUrl, setIntroVideoUrl] = useState(sprint?.intro_video_url ?? '')
  const [recapVideoUrl, setRecapVideoUrl] = useState(sprint?.recap_video_url ?? '')
  const [startsAt, setStartsAt] = useState(sprint?.starts_at?.slice(0, 16) ?? '')
  const [endsAt, setEndsAt] = useState(sprint?.ends_at?.slice(0, 16) ?? '')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(sprint?.name ?? '')
      setSubtitle(sprint?.subtitle ?? '')
      setDescription(sprint?.description ?? '')
      setDescriptionHtml(sprint?.description_html ?? '')
      setCoverImageUrl(sprint?.cover_image_url ?? '')
      // Show the actual password (decoded from storage)
      setPassword(decodePassword(sprint?.password_hash ?? null))
      setIntroVideoUrl(sprint?.intro_video_url ?? '')
      setRecapVideoUrl(sprint?.recap_video_url ?? '')
      setStartsAt(sprint?.starts_at?.slice(0, 16) ?? '')
      setEndsAt(sprint?.ends_at?.slice(0, 16) ?? '')
      setError(null)
    }
  }, [open, sprint])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCover(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadFile(formData, 'challenges')
      if (result.success) {
        setCoverImageUrl(result.url)
      } else {
        setError(result.error || 'Failed to upload cover image')
      }
    } catch {
      setError('Failed to upload cover image')
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isEditing && sprint) {
        const update: SprintUpdate = {
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          description: description.trim() || null,
          description_html: descriptionHtml.trim() || null,
          cover_image_url: coverImageUrl.trim() || null,
          // Pass password value directly - empty string clears it
          password: password.trim() || null,
          intro_video_url: introVideoUrl.trim() || null,
          recap_video_url: recapVideoUrl.trim() || null,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        }

        const result = await updateSprint(sprint.id, update)

        if (result.success) {
          onSuccess()
          handleClose()
        } else {
          setError(result.error)
        }
      } else {
        const input: SprintInsert = {
          challenge_id: challengeId,
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          description: description.trim() || null,
          description_html: descriptionHtml.trim() || null,
          cover_image_url: coverImageUrl.trim() || null,
          password: password.trim() || undefined,
          intro_video_url: introVideoUrl.trim() || null,
          recap_video_url: recapVideoUrl.trim() || null,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        }

        const result = await createSprint(input)

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

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Sprint' : 'Create Sprint'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the sprint details below.'
              : 'Create a new sprint to group assignments into themed phases.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Sprint Name <span className="text-[var(--color-error)]">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Week 1: Getting Started"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Subtitle
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Short teaser text"
                disabled={loading}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Cover Image
            </label>
            <div className="flex items-center gap-3">
              {coverImageUrl && (
                <img src={coverImageUrl} alt="Cover" className="h-16 w-24 object-cover rounded" />
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                disabled={loading || isUploadingCover}
              >
                {isUploadingCover ? <Spinner size="sm" /> : coverImageUrl ? 'Change' : 'Upload'}
              </Button>
              {coverImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverImageUrl('')}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Rich Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Sprint Description (Rich Text)
            </label>
            <InlineRichEditor
              value={descriptionHtml}
              onChange={setDescriptionHtml}
              placeholder="Rich description shown on sprint detail page..."
              minHeight="100px"
            />
          </div>

          {/* Simple Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Simple Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief plain-text description..."
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-fg)]">
              Password
            </label>
            
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                disabled={loading}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                className="flex-1"
              />
              {/* Clear password button */}
              {password && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPassword('')}
                  disabled={loading}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Intro Video URL
              </label>
              <Input
                type="url"
                value={introVideoUrl}
                onChange={(e) => setIntroVideoUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                YouTube, Vimeo, or direct video URL
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Recap Video URL
              </label>
              <Input
                type="url"
                value={recapVideoUrl}
                onChange={(e) => setRecapVideoUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                Optional wrap-up video
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                Start Date
              </label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
                End Date
              </label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SaveIcon className="h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Save Sprint'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
    </svg>
  )
}function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}