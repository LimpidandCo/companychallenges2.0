'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Spinner } from '@/components/ui'
import { createClient, updateClient } from '@/lib/actions/clients'
import type { Client, ClientFeatures } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface ClientFormProps {
  client?: Client | null
  open: boolean
  onClose: () => void
  onSuccess?: (client: Client) => void
}

const MODE_OPTIONS = [
  { 
    value: 'collective', 
    label: 'Collective',
    description: 'Anyone with the link can access. Great for large groups.',
    emoji: '👥',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    value: 'individual', 
    label: 'Individual',
    description: 'Users sign in to track their personal progress.',
    emoji: '👤',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    value: 'hybrid', 
    label: 'Hybrid',
    description: 'Combine both modes for maximum flexibility.',
    emoji: '🔀',
    color: 'from-orange-500 to-red-500'
  },
]

const FEATURE_OPTIONS: { key: keyof ClientFeatures; label: string; description: string; emoji: string }[] = [
  { key: 'announcements', label: 'Announcements', description: 'Post updates to all participants', emoji: '📢' },
  { key: 'host_videos', label: 'Host Videos', description: 'Embed video content directly', emoji: '🎬' },
  { key: 'sprint_structure', label: 'Sprints', description: 'Organize content into time periods', emoji: '🏃' },
  { key: 'collective_progress', label: 'Group Progress', description: 'Show collective completion stats', emoji: '📊' },
  { key: 'time_based_unlocks', label: 'Scheduled Unlocks', description: 'Release content on specific dates', emoji: '🔓' },
  { key: 'milestones', label: 'Milestones', description: 'Celebrate completion achievements', emoji: '🏆' },
  { key: 'reveal_moments', label: 'Reveals', description: 'Create exciting content reveals', emoji: '✨' },
  { key: 'micro_quizzes', label: 'Quizzes', description: 'Test knowledge with quick quizzes', emoji: '❓' },
  { key: 'progress_tracking', label: 'Progress Tracking', description: 'Track individual completion', emoji: '📈' },
  { key: 'session_persistence', label: 'Remember Progress', description: 'Save progress across sessions', emoji: '💾' },
  { key: 'private_views', label: 'Private Views', description: 'Personal dashboards for users', emoji: '🔐' },
]

const STEPS = ['welcome', 'branding', 'access', 'features', 'review'] as const
type Step = typeof STEPS[number]

export function ClientForm({ client, open, onClose, onSuccess }: ClientFormProps) {
  const isEditing = !!client
  const [step, setStep] = useState<Step>(isEditing ? 'review' : 'welcome')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  const [name, setName] = useState(client?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(client?.logo_url ?? '')
  const [mode, setMode] = useState<'collective' | 'individual' | 'hybrid'>(
    client?.mode ?? 'collective'
  )
  const [features, setFeatures] = useState<ClientFeatures>(
    client?.features ?? {
      announcements: false,
      host_videos: false,
      sprint_structure: false,
      collective_progress: false,
      time_based_unlocks: false,
      milestones: false,
      reveal_moments: false,
      micro_quizzes: false,
      progress_tracking: false,
      session_persistence: false,
      private_views: false,
    }
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when opening
  useEffect(() => {
    if (open && !isEditing) {
      setStep('welcome')
          setName('')
          setLogoUrl('')
          setMode('collective')
          setFeatures({
            announcements: false,
            host_videos: false,
            sprint_structure: false,
            collective_progress: false,
            time_based_unlocks: false,
            milestones: false,
            reveal_moments: false,
            micro_quizzes: false,
            progress_tracking: false,
            session_persistence: false,
            private_views: false,
          })
        }
  }, [open, isEditing])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = isEditing
        ? await updateClient(client.id, { name, logo_url: logoUrl || null, mode, features })
        : await createClient({ name, logo_url: logoUrl || null, mode, features })

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

  const toggleFeature = (key: keyof ClientFeatures) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const goToStep = (newStep: Step) => {
    const currentIndex = STEPS.indexOf(step)
    const newIndex = STEPS.indexOf(newStep)
    setDirection(newIndex > currentIndex ? 'forward' : 'backward')
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
  const enabledFeaturesCount = Object.values(features).filter(Boolean).length

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 animate-scale-in">
        <div className="rounded-2xl bg-[var(--color-bg-elevated)] shadow-2xl overflow-hidden border border-[var(--color-border)]">
          
          {/* Progress bar */}
          <div className="h-1 bg-[var(--color-bg-muted)]">
            <div 
              className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step: Welcome */}
            {step === 'welcome' && (
              <div className="text-center animate-fade-in-up">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-accent-subtle)]">
                  <span className="text-5xl">🏢</span>
            </div>
                <h2 className="text-2xl font-bold text-[var(--color-fg)] mb-2">
                  Let's add a new client
                </h2>
                <p className="text-[var(--color-fg-muted)] mb-8 max-w-md mx-auto">
                  We'll guide you through setting up a new organization in just a few steps.
                </p>
                
                <div className="max-w-sm mx-auto">
          <Input
                    label="What's the client's name?"
            value={name}
            onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="text-center"
                    autoFocus
                  />
                </div>

                <div className="mt-8 flex justify-center gap-3">
                  <Button variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={nextStep} disabled={!name.trim()}>
                    Continue
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Branding */}
            {step === 'branding' && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-8">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)]">
                    <span className="text-3xl">🎨</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-fg)] mb-2">
                    Add some branding
                  </h2>
                  <p className="text-[var(--color-fg-muted)]">
                    Give <span className="font-semibold text-[var(--color-fg)]">{name}</span> a visual identity
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  {/* Logo Preview */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center mb-4 transition-all",
                      logoUrl 
                        ? "border-[var(--color-accent)] bg-[var(--color-bg)]" 
                        : "border-[var(--color-border)] bg-[var(--color-bg-muted)]"
                    )}>
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Logo preview" 
                          className="max-w-full max-h-full object-contain rounded-xl"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="text-4xl opacity-30">🖼️</span>
                      )}
                    </div>
          <Input
            label="Logo URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
                      hint="Paste a direct link to the logo image"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="ghost" onClick={prevStep}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={nextStep}>
                      Skip for now
                    </Button>
                    <Button onClick={nextStep}>
                      Continue
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Access Mode */}
            {step === 'access' && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-8">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)]">
                    <span className="text-3xl">🔑</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-fg)] mb-2">
                    How will people access challenges?
                  </h2>
                  <p className="text-[var(--color-fg-muted)]">
                    Choose the authentication mode for participants
                  </p>
                </div>

                <div className="grid gap-4 max-w-lg mx-auto">
                  {MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value as typeof mode)}
                      className={cn(
                        "relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200",
                        mode === option.value
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] shadow-lg"
                          : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-hover)] hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl text-2xl bg-gradient-to-br text-white",
                        option.color
                      )}>
                        {option.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[var(--color-fg)]">{option.label}</div>
                        <div className="text-sm text-[var(--color-fg-muted)]">{option.description}</div>
                      </div>
                      {mode === option.value && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
                          <CheckIcon className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="ghost" onClick={prevStep}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={nextStep}>
                    Continue
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Features */}
            {step === 'features' && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-6">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)]">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-fg)] mb-2">
                    Power up with features
                  </h2>
                  <p className="text-[var(--color-fg-muted)]">
                    Select the capabilities you want to enable
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                  {FEATURE_OPTIONS.map((feature) => (
                    <button
                      key={feature.key}
                      type="button"
                      onClick={() => toggleFeature(feature.key)}
                      className={cn(
                        "group relative flex flex-col items-center p-4 rounded-xl border-2 text-center transition-all duration-200",
                        features[feature.key]
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
                          : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-subtle)]"
                      )}
                    >
                      <span className="text-2xl mb-2">{feature.emoji}</span>
                      <span className="text-xs font-semibold text-[var(--color-fg)]">{feature.label}</span>
                      {features[feature.key] && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
                          <CheckIcon className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {enabledFeaturesCount > 0 && (
                  <p className="text-center text-sm text-[var(--color-fg-muted)] mt-4">
                    {enabledFeaturesCount} feature{enabledFeaturesCount !== 1 ? 's' : ''} selected
                  </p>
                )}

                <div className="mt-8 flex justify-between">
                  <Button variant="ghost" onClick={prevStep}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={nextStep}>
                    Review
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Review */}
            {step === 'review' && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-8">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-success-subtle)]">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-fg)] mb-2">
                    {isEditing ? 'Review changes' : 'Ready to create!'}
                  </h2>
                  <p className="text-[var(--color-fg-muted)]">
                    Here's a summary of your new client
                  </p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl bg-[var(--color-error-subtle)] p-4 text-sm text-[var(--color-error)] text-center">
                    {error}
                  </div>
                )}

                <div className="max-w-md mx-auto space-y-4">
                  {/* Summary Card */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="h-12 w-12 rounded-xl object-contain bg-[var(--color-bg-muted)]" />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-[var(--color-bg-muted)] flex items-center justify-center">
                          <span className="text-xl">🏢</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-[var(--color-fg)]">{name}</h3>
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          {MODE_OPTIONS.find(m => m.value === mode)?.label} access
                        </p>
                      </div>
                    </div>

                    {enabledFeaturesCount > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-2">
                          Enabled Features
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {FEATURE_OPTIONS.filter(f => features[f.key]).map(f => (
                            <span 
                              key={f.key}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-bg-muted)] text-xs font-medium text-[var(--color-fg)]"
                            >
                              {f.emoji} {f.label}
                            </span>
              ))}
            </div>
          </div>
                    )}
                  </div>

                  {/* Edit links */}
                  {!isEditing && (
                    <div className="flex justify-center gap-4 text-sm">
                      <button 
                        type="button"
                        onClick={() => goToStep('welcome')}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        Edit name
                      </button>
                      <button 
                        type="button"
                        onClick={() => goToStep('branding')}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        Edit branding
                      </button>
                      <button 
                        type="button"
                        onClick={() => goToStep('features')}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        Edit features
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  {!isEditing && (
                    <Button variant="ghost" onClick={prevStep}>
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  {isEditing && (
                    <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
                  )}
                  <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            {isEditing ? 'Save Changes' : 'Create Client'}
                    {!isSubmitting && <SparklesIcon className="ml-2 h-4 w-4" />}
          </Button>
                </div>
              </div>
            )}
          </div>

          {/* Step indicators */}
          {!isEditing && (
            <div className="flex justify-center gap-2 pb-6">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    // Only allow going back or to completed steps
                    if (i <= currentStepIndex) {
                      goToStep(s)
                    }
                  }}
                  disabled={i > currentStepIndex}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    s === step
                      ? "w-8 bg-[var(--color-accent)]"
                      : i < currentStepIndex
                        ? "w-2 bg-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/70"
                        : "w-2 bg-[var(--color-border)]"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Icons
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
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}
