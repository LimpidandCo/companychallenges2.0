'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Spinner, RichTextEditor } from '@/components/ui'
import { createChallenge, updateChallenge } from '@/lib/actions/challenges'
import type { Challenge, Client } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface ChallengeFormProps {
  challenge?: Challenge | null
  clients: Client[]
  open: boolean
  onClose: () => void
  onSuccess?: (challenge: Challenge) => void
}

const STEPS = ['basics', 'content', 'branding', 'review'] as const
type Step = typeof STEPS[number]

// Preset color palette
const COLOR_PRESETS = [
  { value: '#ff6b4a', name: 'Coral' },
  { value: '#14b8a6', name: 'Teal' },
  { value: '#a78bfa', name: 'Lavender' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#10b981', name: 'Emerald' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#6366f1', name: 'Indigo' },
]

export function ChallengeForm({ challenge, clients, open, onClose, onSuccess }: ChallengeFormProps) {
  const isEditing = !!challenge
  const [step, setStep] = useState<Step>(isEditing ? 'review' : 'basics')

  const [clientId, setClientId] = useState(challenge?.client_id ?? (clients[0]?.id || ''))
  const [internalName, setInternalName] = useState(challenge?.internal_name ?? '')
  const [publicTitle, setPublicTitle] = useState(challenge?.public_title ?? '')
  const [showPublicTitle, setShowPublicTitle] = useState(challenge?.show_public_title ?? true)
  const [description, setDescription] = useState(challenge?.description ?? '')
  const [brandColor, setBrandColor] = useState(challenge?.brand_color ?? '#ff6b4a')
  const [folder, setFolder] = useState(challenge?.folder ?? '')
  const [slug, setSlug] = useState(challenge?.slug ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedClient = clients.find(c => c.id === clientId)

  // Reset form when opening
  useEffect(() => {
    if (open && !isEditing) {
      setStep('basics')
      setClientId(clients[0]?.id || '')
      setInternalName('')
      setPublicTitle('')
      setShowPublicTitle(true)
      setDescription('')
      setBrandColor('#ff6b4a')
      setFolder('')
      setSlug('')
    }
  }, [open, isEditing, clients])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = isEditing
        ? await updateChallenge(challenge.id, {
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description: description || null,
            brand_color: brandColor || null,
            folder: folder || null,
            slug: slug || undefined,
          })
        : await createChallenge({
            client_id: clientId,
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description: description || null,
            brand_color: brandColor || null,
            folder: folder || null,
            slug: slug || undefined,
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
                {isEditing ? 'Edit Challenge' : 'Create Challenge'}
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
                  {s === 'branding' && '3. Branding'}
                  {s === 'review' && '4. Review'}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="mb-6 rounded-xl bg-[var(--color-error-subtle)] p-4 text-sm text-[var(--color-error)]">
                {error}
              </div>
            )}

            {/* Step: Basics */}
            {step === 'basics' && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🚀</span>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Let's set up your new challenge
                  </p>
                </div>

                {/* Client Selection */}
                {!isEditing && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[var(--color-fg)]">
                      Select Client
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => setClientId(client.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                            clientId === client.id
                              ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
                          )}
                        >
                          {client.logo_url ? (
                            <img src={client.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain bg-[var(--color-bg-muted)]" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-[var(--color-bg-muted)] flex items-center justify-center text-sm">
                              🏢
                            </div>
                          )}
                          <span className="text-sm font-medium text-[var(--color-fg)] truncate">{client.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  label="Internal Name"
                  value={internalName}
                  onChange={(e) => setInternalName(e.target.value)}
                  placeholder="e.g. Q1 2026 Leadership Challenge"
                  hint="Admin reference only"
                  autoFocus={isEditing}
                />

                <Input
                  label="Public Title"
                  value={publicTitle}
                  onChange={(e) => setPublicTitle(e.target.value)}
                  placeholder="e.g. Leadership Development Program"
                  hint="What participants will see"
                />

                <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-subtle)] transition-colors">
                  <input
                    type="checkbox"
                    checked={showPublicTitle}
                    onChange={(e) => setShowPublicTitle(e.target.checked)}
                    className="h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-accent)]"
                  />
                  <div>
                    <div className="text-sm font-medium text-[var(--color-fg)]">Show public title</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">Display the title to participants</div>
                  </div>
                </label>
              </div>
            )}

            {/* Step: Content */}
            {step === 'content' && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center mb-4">
                  <span className="text-4xl mb-2 block">✍️</span>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Add a welcome message for participants
                  </p>
                </div>

                <RichTextEditor
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Welcome to this challenge! Here's what you'll learn..."
                />
              </div>
            )}

            {/* Step: Branding */}
            {step === 'branding' && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🎨</span>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Customize the visual identity
                  </p>
                </div>

                {/* Color Preview */}
                <div 
                  className="rounded-2xl p-6 text-center transition-colors"
                  style={{ backgroundColor: brandColor }}
                >
                  <span className="text-white/80 text-sm font-medium">
                    {publicTitle || internalName || 'Challenge Title'}
                  </span>
                </div>

                {/* Color Presets */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-fg)]">
                    Brand Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setBrandColor(preset.value)}
                        className={cn(
                          "w-10 h-10 rounded-xl transition-all",
                          brandColor === preset.value 
                            ? "ring-2 ring-offset-2 ring-[var(--color-fg)] scale-110" 
                            : "hover:scale-105"
                        )}
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-xl border border-[var(--color-border)]"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#ff6b4a"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Folder"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="e.g. 2026 Q1"
                    hint="Organize challenges"
                  />
                  {isEditing && (
                    <Input
                      label="Custom Slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="leadership-2026"
                      hint="URL path (careful!)"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step: Review */}
            {step === 'review' && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🎉</span>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    {isEditing ? 'Review your changes' : 'Ready to create!'}
                  </p>
                </div>

                {/* Preview Card */}
                <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
                  {/* Header with brand color */}
                  <div 
                    className="p-4"
                    style={{ backgroundColor: brandColor }}
                  >
                    <div className="flex items-center gap-3">
                      {selectedClient?.logo_url ? (
                        <img 
                          src={selectedClient.logo_url} 
                          alt="" 
                          className="h-10 w-10 rounded-lg object-contain bg-white/20"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                          🏢
                        </div>
                      )}
                      <div>
                        <div className="text-white font-bold">
                          {publicTitle || internalName || 'Untitled Challenge'}
                        </div>
                        <div className="text-white/70 text-xs">
                          {selectedClient?.name || 'No client selected'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-[var(--color-fg-muted)]">Internal Name</dt>
                        <dd className="font-medium text-[var(--color-fg)]">{internalName || '—'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[var(--color-fg-muted)]">Show Title</dt>
                        <dd className="font-medium text-[var(--color-fg)]">{showPublicTitle ? '✓ Yes' : '✗ No'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[var(--color-fg-muted)]">Has Description</dt>
                        <dd className="font-medium text-[var(--color-fg)]">{description ? '✓ Yes' : '—'}</dd>
                      </div>
                      {folder && (
                        <div className="flex justify-between">
                          <dt className="text-[var(--color-fg-muted)]">Folder</dt>
                          <dd className="font-medium text-[var(--color-fg)]">{folder}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Quick edit links */}
                {!isEditing && (
                  <div className="flex justify-center gap-4 text-sm">
                    <button 
                      type="button"
                      onClick={() => goToStep('basics')}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      Edit basics
                    </button>
                    <button 
                      type="button"
                      onClick={() => goToStep('content')}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      Edit content
                    </button>
                    <button 
                      type="button"
                      onClick={() => goToStep('branding')}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      Edit branding
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-between">
            <div>
              {currentStepIndex > 0 && !isEditing && (
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
                <Button onClick={nextStep} disabled={!internalName.trim() || !clientId}>
                  Continue
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting || !internalName.trim() || !clientId}>
                  {isSubmitting && <Spinner size="sm" className="mr-2" />}
                  {isEditing ? 'Save Changes' : 'Create Challenge'}
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
