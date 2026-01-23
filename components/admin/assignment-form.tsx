'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button, Input, Spinner, TagInput } from '@/components/ui'
import { InlineRichEditor } from '@/components/ui/inline-rich-editor'
import { createAssignment, updateAssignment, createAssignmentForChallenge } from '@/lib/actions/assignments'
import { uploadFile } from '@/lib/actions/upload'
import type { Assignment, AssignmentWithUsages, EditorContent } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface AssignmentFormProps {
  assignment?: AssignmentWithUsages | null
  challengeId?: string
  sprintId?: string | null
  open: boolean
  onClose: () => void
  onSuccess?: (assignment: Assignment) => void
}

export function AssignmentForm({
  assignment,
  challengeId,
  sprintId,
  open,
  onClose,
  onSuccess
}: AssignmentFormProps) {
  const isEditing = !!assignment
  const isCreatingForChallenge = !isEditing && !!challengeId
  const usageCount = assignment?.assignment_usages?.length ?? 0
  const isSharedAssignment = usageCount > 1

  const visualInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [internalTitle, setInternalTitle] = useState(assignment?.internal_title ?? '')
  const [publicTitle, setPublicTitle] = useState(assignment?.public_title ?? '')
  const [subtitle, setSubtitle] = useState(assignment?.subtitle ?? '')
  const [contentType, setContentType] = useState<'standard' | 'video' | 'quiz' | 'announcement'>(assignment?.content_type ?? 'standard')
  const [mediaUrl, setMediaUrl] = useState(assignment?.media_url ?? '')
  const [visualUrl, setVisualUrl] = useState(assignment?.visual_url ?? '')
  const [password, setPassword] = useState('')
  const [removePassword, setRemovePassword] = useState(false)
  const [saveForFutureReference, setSaveForFutureReference] = useState(true)
  const [tags, setTags] = useState<string[]>(assignment?.tags ?? [])

  // HTML content state (simplified - just use HTML, no JSON)
  const [instructionsHtml, setInstructionsHtml] = useState<string>(assignment?.instructions_html ?? '')
  const [contentHtml, setContentHtml] = useState<string>(assignment?.content_html ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingVisual, setIsUploadingVisual] = useState(false)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasPassword = assignment?.password_hash !== null

  useEffect(() => {
    if (open) {
      if (isEditing && assignment) {
        setInternalTitle(assignment.internal_title ?? '')
        setPublicTitle(assignment.public_title ?? '')
        setSubtitle(assignment.subtitle ?? '')
        setContentType(assignment.content_type ?? 'standard')
        setInstructionsHtml(assignment.instructions_html ?? '')
        setContentHtml(assignment.content_html ?? '')
        setMediaUrl(assignment.media_url ?? '')
        setVisualUrl(assignment.visual_url ?? '')
        setPassword('')
        setRemovePassword(false)
        setSaveForFutureReference(true)
        setTags(assignment.tags ?? [])
        setError(null)
      } else {
        setInternalTitle('')
        setPublicTitle('')
        setSubtitle('')
        setContentType('standard')
        setInstructionsHtml('')
        setContentHtml('')
        setMediaUrl('')
        setVisualUrl('')
        setPassword('')
        setRemovePassword(false)
        setSaveForFutureReference(true)
        setTags([])
        setError(null)
      }
    }
  }, [open, isEditing, assignment])

  const handleVisualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation for better UX
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, GIF, WebP, SVG, or HEIC image')
      return
    }

    // Check file size (50MB limit)
    if (file.size > 52428800) {
      setError('Image is too large. Maximum size is 50MB')
      return
    }

    setIsUploadingVisual(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadFile(formData, 'assignments')
      if (result.success) {
        setVisualUrl(result.url)
      } else {
        setError(result.error || 'Failed to upload image')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsUploadingVisual(false)
    }
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadFile(formData, 'assignments')
      if (result.success) {
        setMediaUrl(result.url)
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    } finally {
      setIsUploadingMedia(false)
    }
  }

  // Handler for image uploads from the rich text editor
  const handleEditorImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadFile(formData, 'assignments')
    if (result.success) {
      return result.url
    }
    throw new Error(result.error || 'Upload failed')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!internalTitle.trim()) return

    // Validate required fields
    if (!publicTitle.trim()) {
      setError('Public title is required (this is what participants see)')
      return
    }
    if (!visualUrl.trim()) {
      setError('Cover image is required')
      return
    }
    
    const strippedInstructions = instructionsHtml.replace(/<[^>]*>/g, '').trim()
    const strippedContent = contentHtml.replace(/<[^>]*>/g, '').trim()
    
    if (!strippedInstructions) {
      setError('Instructions are required')
      return
    }
    if (!strippedContent) {
      setError('Assignment content is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let result

      if (isEditing && assignment) {
        result = await updateAssignment(assignment.id, {
          internal_title: internalTitle,
          public_title: publicTitle || null,
          subtitle: subtitle || null,
          content_type: contentType,
          instructions_html: instructionsHtml || null,
          content_html: contentHtml || null,
          media_url: mediaUrl || null,
          visual_url: visualUrl || null,
          // If removePassword is checked, pass null to remove; otherwise pass new password or undefined to keep existing
          password: removePassword ? null : (password || undefined),
          is_reusable: saveForFutureReference,
          tags,
        })
      } else if (isCreatingForChallenge) {
        result = await createAssignmentForChallenge(
          {
            internal_title: internalTitle,
            public_title: publicTitle || null,
            subtitle: subtitle || null,
            content_type: contentType,
            instructions_html: instructionsHtml || null,
            content_html: contentHtml || null,
            media_url: mediaUrl || null,
            visual_url: visualUrl || null,
            password: password || undefined,
            is_reusable: saveForFutureReference,
            tags,
          },
          challengeId,
          sprintId
        )
      } else {
        result = await createAssignment({
          internal_title: internalTitle,
          public_title: publicTitle || null,
          subtitle: subtitle || null,
          content_type: contentType,
          instructions_html: instructionsHtml || null,
          content_html: contentHtml || null,
          media_url: mediaUrl || null,
          visual_url: visualUrl || null,
          password: password || undefined,
          is_reusable: saveForFutureReference,
          tags,
        })
      }

      if (result.success) {
        onSuccess?.(result.data)
        onClose()
      } else {
        setError(result.error)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  const previewUrl = isEditing && assignment ? `/a/${assignment.slug}` : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl">
        <div className="rounded-xl bg-white shadow-xl border border-gray-200 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Assignment' : 'Create Assignment'}
              </h2>
              {isEditing && assignment && (
                <p className="text-sm text-gray-500 mt-0.5">
                  URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/a/{assignment.slug}</code>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {previewUrl && (
                <Link
                  href={previewUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <PreviewIcon className="h-4 w-4" />
                  Preview
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Shared warning */}
              {isEditing && isSharedAssignment && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                  <WarningIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800">Shared in {usageCount} challenges</p>
                    <p className="text-amber-700">Changes will apply everywhere this is used.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Internal Title"
                  value={internalTitle}
                  onChange={(e) => setInternalTitle(e.target.value)}
                  placeholder="Admin reference"
                  required
                  autoFocus
                />
                <Input
                  label="Public Title"
                  value={publicTitle}
                  onChange={(e) => setPublicTitle(e.target.value)}
                  placeholder="What participants see"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Short teaser text"
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-900">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as 'standard' | 'video' | 'quiz' | 'announcement')}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="video">Video</option>
                    <option value="quiz">Quiz</option>
                    <option value="announcement">Announcement</option>
                  </select>
                  <p className="text-xs text-gray-500">Affects how assignment is displayed</p>
                </div>
              </div>

              {/* Instructions */}
              <InlineRichEditor
                key={`instr-${assignment?.id || 'new'}-${open}`}
                label="Instructions"
                value={instructionsHtml}
                onChange={setInstructionsHtml}
                placeholder="How to complete this assignment..."
                hint="Context and guidance for participants (left column on assignment page)"
                minHeight="120px"
                required
                onUploadImage={handleEditorImageUpload}
              />

              {/* Content */}
              <InlineRichEditor
                key={`content-${assignment?.id || 'new'}-${open}`}
                label="Assignment"
                value={contentHtml}
                onChange={setContentHtml}
                placeholder="The actual task and materials..."
                hint="The main assignment content (right column on assignment page)"
                minHeight="120px"
                required
                onUploadImage={handleEditorImageUpload}
              />

              {/* Media Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cover Image (Required) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Cover Image <span className="text-red-500">*</span>
                  </label>
                  <div className={cn(
                    "aspect-video rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden relative",
                    visualUrl ? "border-blue-300 bg-gray-50" : "border-gray-200 bg-gray-50"
                  )}>
                    {visualUrl ? (
                      <>
                        <img src={visualUrl} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setVisualUrl('')}
                          className="absolute top-2 right-2 p-1 rounded bg-black/60 text-white hover:bg-black/80"
                        >
                          <CloseIcon className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => visualInputRef.current?.click()}
                        className="text-center p-4"
                        disabled={isUploadingVisual}
                      >
                        {isUploadingVisual ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1 block">Upload image</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    ref={visualInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/heic,image/heif,.jpg,.jpeg,.png,.gif,.webp,.svg,.heic,.heif"
                    onChange={handleVisualUpload}
                    className="hidden"
                  />
                </div>

                {/* Video/Media */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Video URL</label>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="YouTube, Vimeo, or direct URL"
                  />
                  <p className="text-xs text-gray-500">Or upload a video file:</p>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleMediaUpload}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {isUploadingMedia && <Spinner size="sm" />}
                </div>
              </div>

              {/* Tags */}
              <TagInput
                label="Tags"
                value={tags}
                onChange={setTags}
                placeholder="Press Enter to add"
              />

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Password Protection <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={hasPassword ? "Enter new password to change" : "Set a password"}
                />
                {isEditing && hasPassword && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={removePassword}
                      onChange={(e) => setRemovePassword(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Remove existing password
                  </label>
                )}
              </div>

              {/* Library toggle */}
              {!isEditing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveForFutureReference}
                    onChange={(e) => setSaveForFutureReference(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-600">Save to library for reuse</span>
                </label>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !internalTitle.trim()}>
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {isEditing ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Save Changes' : 'Create Assignment'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function PreviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}
