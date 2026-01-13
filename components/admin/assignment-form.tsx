'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Spinner, RichTextEditor } from '@/components/ui'
import { createAssignment, updateAssignment } from '@/lib/actions/assignments'
import type { Assignment, AssignmentWithUsages } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface AssignmentFormProps {
  assignment?: AssignmentWithUsages | null
  open: boolean
  onClose: () => void
  onSuccess?: (assignment: Assignment) => void
}

const CONTENT_TYPES = [
  { 
    value: 'standard', 
    label: 'Standard',
    description: 'Rich text content with formatting',
    emoji: '📄',
  },
  { 
    value: 'video', 
    label: 'Video',
    description: 'Video-focused with embed support',
    emoji: '🎬',
  },
  { 
    value: 'quiz', 
    label: 'Quiz',
    description: 'Interactive assessment content',
    emoji: '❓',
  },
  { 
    value: 'announcement', 
    label: 'Announcement',
    description: 'Short updates and notices',
    emoji: '📢',
  },
]

const STEPS = ['basics', 'content', 'media', 'settings'] as const
type Step = typeof STEPS[number]

export function AssignmentForm({ assignment, open, onClose, onSuccess }: AssignmentFormProps) {
  const isEditing = !!assignment
  const usageCount = assignment?.assignment_usages?.length ?? 0
  const isSharedAssignment = usageCount > 1

  const [step, setStep] = useState<Step>(isEditing ? 'basics' : 'basics')

  const [internalTitle, setInternalTitle] = useState(assignment?.internal_title ?? '')
  const [publicTitle, setPublicTitle] = useState(assignment?.public_title ?? '')
  const [subtitle, setSubtitle] = useState(assignment?.subtitle ?? '')
  const [description, setDescription] = useState(assignment?.description ?? '')
  const [mediaUrl, setMediaUrl] = useState(assignment?.media_url ?? '')
  const [visualUrl, setVisualUrl] = useState(assignment?.visual_url ?? '')
  const [contentType, setContentType] = useState<'standard' | 'quiz' | 'video' | 'announcement'>(
    assignment?.content_type ?? 'standard'
  )
  const [password, setPassword] = useState('')
  const [removePassword, setRemovePassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasPassword = assignment?.password_hash !== null

  // Reset form when opening
  useEffect(() => {
    if (open && !isEditing) {
      setStep('basics')
      setInternalTitle('')
      setPublicTitle('')
      setSubtitle('')
      setDescription('')
      setMediaUrl('')
      setVisualUrl('')
      setContentType('standard')
      setPassword('')
      setRemovePassword(false)
    }
  }, [open, isEditing])

  const handleSubmit = async () => {
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
            visual_url: visualUrl || null,
            content_type: contentType,
            password: removePassword ? null : (password || undefined),
          })
        : await createAssignment({
            internal_title: internalTitle,
            public_title: publicTitle || null,
            subtitle: subtitle || null,
            description: description || null,
            media_url: mediaUrl || null,
            visual_url: visualUrl || null,
            content_type: contentType,
            password: password || undefined,
          })

      if (result.success) {
        onSuccess?.(result.data)
        onClose()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToStep = (newStep: Step) => {
    setStep(newStep)
  }

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(step)
    if (currentIndex < STEPS.length - 1) {
      goToStep(STEPS[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(step)
    if (currentIndex > 0) {
      goToStep(STEPS[currentIndex - 1])
    }
  }

  const currentStepIndex = STEPS.indexOf(step)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl animate-scale-in">
        <div className="rounded-2xl bg-[var(--color-bg-elevated)] shadow-2xl overflow-hidden border border-[var(--color-border)]">
          
          {/* Header with step info */}
          <div className="px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[var(--color-fg)]">
                {isEditing ? 'Edit Assignment' : 'Create Assignment'}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)] transition-colors"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Step tabs */}
            <div className="flex gap-1">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => goToStep(s)}
                  className={cn(
                    "flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all",
                    s === step
                      ? "bg-[var(--color-accent)] text-white"
                      : i <= currentStepIndex
                        ? "bg-[var(--color-bg-muted)] text-[var(--color-fg)] hover:bg-[var(--color-bg-muted)]/80"
                        : "bg-[var(--color-bg-muted)]/50 text-[var(--color-fg-subtle)]"
                  )}
                >
                  {s === 'basics' && '1. Basics'}
                  {s === 'content' && '2. Content'}
                  {s === 'media' && '3. Media'}
                  {s === 'settings' && '4. Settings'}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Shared assignment warning */}
            {isEditing && isSharedAssignment && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-6">
                <span className="text-xl">⚠️</span>
                <div className="text-sm">
                  <p className="font-semibold text-amber-200">
                    Shared in {usageCount} challenges
                  </p>
                  <p className="text-amber-200/80">
                    Changes will apply everywhere this is used.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl bg-[var(--color-error-subtle)] p-4 text-sm text-[var(--color-error)]">
                {error}
              </div>
            )}

            {/* Step: Basics */}
            {step === 'basics' && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">📝</span>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Start with the basic information
                  </p>
                </div>

                <Input
                  label="Internal Title"
                  value={internalTitle}
                  onChange={(e) => setInternalTitle(e.target.value)}
                  placeholder="e.g. Week 1: Introduction"
                  hint="Admin reference only"
                  autoFocus
                />

                <Input
                  label="Public Title"
                  value={publicTitle}
                  onChange={(e) => setPublicTitle(e.target.value)}
                  placeholder="e.g. Getting Started"
                  hint="What participants will see"
                />

                <Input
                  label="Subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Learn the fundamentals..."
                  hint="Short teaser text"
                />

                {/* Content Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-fg)]">
                    Content Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setContentType(type.value as typeof contentType)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                          contentType === type.value
                            ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
                            : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
                        )}
                      >
                        <span className="text-xl">{type.emoji}</span>
                        <div>
                          <div className="text-sm font-medium text-[var(--color-fg)]">{type.label}</div>
                          <div className="text-xs text-[var(--color-fg-muted)]">{type.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Content */}
            {step === 'content' && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center mb-4">
                  <span className="text-4xl mb-2 block">✍️</span>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Write your assignment content
                  </p>
                </div>

                <RichTextEditor
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Write your content here... Use the toolbar to format text, add links, images, and videos."
                />
              </div>
            )}

            {/* Step: Media */}
            {step === 'media' && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🖼️</span>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Add visual elements (optional)
                  </p>
                </div>

                {/* Visual Preview */}
                <div>
                  <label className="text-sm font-semibold text-[var(--color-fg)] block mb-2">
                    Cover Image
                  </label>
                  <div className={cn(
                    "aspect-video rounded-xl border-2 border-dashed flex items-center justify-center mb-3 overflow-hidden",
                    visualUrl 
                      ? "border-[var(--color-accent)] bg-[var(--color-bg)]" 
                      : "border-[var(--color-border)] bg-[var(--color-bg-muted)]"
                  )}>
                    {visualUrl ? (
                      <img 
                        src={visualUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-3xl opacity-30 block mb-2">🖼️</span>
                        <span className="text-xs text-[var(--color-fg-subtle)]">No image set</span>
                      </div>
                    )}
                  </div>
                  <Input
                    value={visualUrl}
                    onChange={(e) => setVisualUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    hint="Direct link to an image"
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label className="text-sm font-semibold text-[var(--color-fg)] block mb-2">
                    Video Embed
                  </label>
                  <div className={cn(
                    "aspect-video rounded-xl border-2 border-dashed flex items-center justify-center mb-3 overflow-hidden",
                    mediaUrl 
                      ? "border-[var(--color-secondary)] bg-[var(--color-bg)]" 
                      : "border-[var(--color-border)] bg-[var(--color-bg-muted)]"
                  )}>
                    {mediaUrl ? (
                      <iframe
                        src={getEmbedUrl(mediaUrl)}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-3xl opacity-30 block mb-2">🎬</span>
                        <span className="text-xs text-[var(--color-fg-subtle)]">No video set</span>
                      </div>
                    )}
                  </div>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    hint="YouTube or Vimeo URL"
                  />
                </div>
              </div>
            )}

            {/* Step: Settings */}
            {step === 'settings' && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🔒</span>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Configure access settings
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-muted)]">
                      <LockIcon className="h-5 w-5 text-[var(--color-fg-muted)]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--color-fg)]">Password Protection</h4>
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        Require a password to access this content
                      </p>
                    </div>
                  </div>

                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={hasPassword ? '••••••••' : 'Enter password (optional)'}
                  />

                  {isEditing && hasPassword && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={removePassword}
                        onChange={(e) => setRemovePassword(e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)]"
                      />
                      <span className="text-[var(--color-fg)]">Remove password protection</span>
                    </label>
                  )}
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-[var(--color-bg-muted)] p-4">
                  <h4 className="font-semibold text-[var(--color-fg)] mb-3">Summary</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-fg-muted)]">Title</dt>
                      <dd className="font-medium text-[var(--color-fg)]">{internalTitle || '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-fg-muted)]">Type</dt>
                      <dd className="font-medium text-[var(--color-fg)]">
                        {CONTENT_TYPES.find(t => t.value === contentType)?.emoji}{' '}
                        {CONTENT_TYPES.find(t => t.value === contentType)?.label}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-fg-muted)]">Has content</dt>
                      <dd className="font-medium text-[var(--color-fg)]">{description ? '✓' : '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-fg-muted)]">Password</dt>
                      <dd className="font-medium text-[var(--color-fg)]">
                        {(password || hasPassword) && !removePassword ? '🔒 Protected' : 'Open'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-between">
            <div>
              {currentStepIndex > 0 && (
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              {currentStepIndex < STEPS.length - 1 ? (
                <Button onClick={nextStep} disabled={!internalTitle.trim()}>
                  Continue
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting || !internalTitle.trim()}>
                  {isSubmitting && <Spinner size="sm" className="mr-2" />}
                  {isEditing ? 'Save Changes' : 'Create'}
                  {!isSubmitting && <CheckIcon className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper to convert video URLs to embed URLs
function getEmbedUrl(url: string): string {
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v')
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('vimeo.com/')) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
    return `https://player.vimeo.com/video/${videoId}`
  }
  return url
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}
