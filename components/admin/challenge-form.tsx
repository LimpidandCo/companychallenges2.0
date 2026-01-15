'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Spinner } from '@/components/ui'
import { AdvancedEditor, EditorTrigger, type ContentType } from '@/components/ui/advanced-editor'
import { createChallenge, updateChallenge } from '@/lib/actions/challenges'
import type { Challenge, Client, EditorContent, ChallengeFeatures } from '@/lib/types/database'
import { DEFAULT_CHALLENGE_FEATURES } from '@/lib/types/database'
import type { ContainerNode } from '@/components/ui/rich-editor'
import { cn } from '@/lib/utils/cn'

interface ChallengeFormProps {
  challenge?: Challenge | null
  clientId?: string
  clients?: Client[]
  open: boolean
  onClose: () => void
  onSuccess?: (challenge: Challenge) => void
}

// Brand color presets
const BRAND_COLOR_PRESETS = [
  '#ff6b4a', // Coral Orange
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
]

const MODE_OPTIONS = [
  { 
    value: 'collective', 
    label: 'Collective',
    description: 'Shared viewing, no individual progress tracking'
  },
  { 
    value: 'individual', 
    label: 'Individual',
    description: 'Personal progress tracking per participant'
  },
  { 
    value: 'hybrid', 
    label: 'Hybrid',
    description: 'Shared content with individual progress'
  },
] as const

// Group features by category
const FEATURE_GROUPS = [
  {
    title: 'Content & Structure',
    features: [
      { key: 'sprint_structure', label: 'Sprints', description: 'Group assignments into phases' },
      { key: 'announcements', label: 'Announcements', description: 'Post updates to participants' },
      { key: 'time_based_unlocks', label: 'Scheduled Releases', description: 'Time-lock content' },
    ] as const
  },
  {
    title: 'Gamification',
    features: [
      { key: 'milestones', label: 'Milestones', description: 'Achievement markers', requiresIndividual: true },
      { key: 'micro_quizzes', label: 'Micro Quizzes', description: 'Quick assessments' },
    ] as const
  },
  {
    title: 'Tracking',
    features: [
      { key: 'progress_tracking', label: 'Progress Tracking', description: 'Track completion', requiresIndividual: true },
    ] as const
  },
]

export function ChallengeForm({ challenge, clientId, clients, open, onClose, onSuccess }: ChallengeFormProps) {
  const isEditing = !!challenge
  const hasClientContext = !!clientId
  const resolvedClientId = clientId || challenge?.client_id || clients?.[0]?.id || ''

  const [activeTab, setActiveTab] = useState<'basic' | 'features'>('basic')
  const [selectedClientId, setSelectedClientId] = useState(resolvedClientId)
  const [internalName, setInternalName] = useState(challenge?.internal_name ?? '')
  const [publicTitle, setPublicTitle] = useState(challenge?.public_title ?? '')
  const [showPublicTitle, setShowPublicTitle] = useState(challenge?.show_public_title ?? true)
  const [folder, setFolder] = useState(challenge?.folder ?? '')
  const [brandColor, setBrandColor] = useState(challenge?.brand_color ?? '#3b82f6')
  
  // Mode and features
  const [mode, setMode] = useState<'collective' | 'individual' | 'hybrid'>(challenge?.mode ?? 'collective')
  const [features, setFeatures] = useState<ChallengeFeatures>(challenge?.features ?? DEFAULT_CHALLENGE_FEATURES)

  // Rich content state (new JSON format)
  const [descriptionJson, setDescriptionJson] = useState<ContainerNode | null>(
    (challenge?.description_json as ContainerNode | null) ?? null
  )
  const [descriptionHtml, setDescriptionHtml] = useState<string>(
    challenge?.description_html ?? ''
  )

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isIndividualMode = mode === 'individual' || mode === 'hybrid'

  // Reset form state when modal opens
  useEffect(() => {
    if (open) {
      if (isEditing && challenge) {
        // Editing: populate with existing values
        setSelectedClientId(challenge.client_id)
        setInternalName(challenge.internal_name ?? '')
        setPublicTitle(challenge.public_title ?? '')
        setShowPublicTitle(challenge.show_public_title ?? true)
        setDescriptionJson((challenge.description_json as ContainerNode | null) ?? null)
        setDescriptionHtml(challenge.description_html ?? '')
        setFolder(challenge.folder ?? '')
        setBrandColor(challenge.brand_color ?? '#3b82f6')
        setMode(challenge.mode ?? 'collective')
        setFeatures(challenge.features ?? DEFAULT_CHALLENGE_FEATURES)
        setError(null)
        setActiveTab('basic')
      } else {
        // Creating new: reset to defaults
        setSelectedClientId(resolvedClientId)
        setInternalName('')
        setPublicTitle('')
        setShowPublicTitle(true)
        setDescriptionJson(null)
        setDescriptionHtml('')
        setFolder('')
        setBrandColor('#3b82f6')
        setMode('collective')
        setFeatures(DEFAULT_CHALLENGE_FEATURES)
        setError(null)
        setActiveTab('basic')
      }
    }
  }, [open, isEditing, challenge, resolvedClientId])

  const handleDescriptionChange = (json: ContainerNode, html: string) => {
    setDescriptionJson(json)
    setDescriptionHtml(html)
  }

  const handleFeatureToggle = (key: keyof ChallengeFeatures) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const targetClientId = hasClientContext ? clientId : selectedClientId

    try {
      const result = isEditing
        ? await updateChallenge(challenge.id, {
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description_json: descriptionJson as EditorContent | null,
            description_html: descriptionHtml || null,
            folder: folder || null,
            brand_color: brandColor,
            mode,
            features,
          })
        : await createChallenge({
            client_id: targetClientId,
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description_json: descriptionJson as EditorContent | null,
            description_html: descriptionHtml || null,
            folder: folder || null,
            brand_color: brandColor,
            mode,
            features,
          })

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

  // Check if there's content in the description
  const hasDescription = descriptionJson !== null && descriptionJson.children?.length > 0

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-xl">
          <div className="rounded-xl bg-[var(--color-bg-elevated)] shadow-xl border border-[var(--color-border)] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] flex-shrink-0">
              <h2 className="text-lg font-semibold text-[var(--color-fg)]">
                {isEditing ? 'Edit Challenge' : 'New Challenge'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)] transition-colors"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-border)] px-5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === 'basic'
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                )}
              >
                Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === 'features'
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                )}
              >
                Mode & Features
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {error && (
                  <div className="rounded-lg bg-[var(--color-error-subtle)] px-4 py-3 text-sm text-[var(--color-error)]">
                    {error}
                  </div>
                )}

                {activeTab === 'basic' && (
                  <>
                    {/* Client Selection */}
                    {!hasClientContext && !isEditing && clients && clients.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-fg)]">
                          Client
                        </label>
                        <select
                          value={selectedClientId}
                          onChange={(e) => setSelectedClientId(e.target.value)}
                          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        >
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <Input
                      label="Internal Name"
                      value={internalName}
                      onChange={(e) => setInternalName(e.target.value)}
                      placeholder="e.g. Q1 2026 Leadership Challenge"
                      required
                      autoFocus
                    />

                    <Input
                      label="Public Title"
                      value={publicTitle}
                      onChange={(e) => setPublicTitle(e.target.value)}
                      placeholder="e.g. Leadership Development Program"
                    />

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPublicTitle}
                        onChange={(e) => setShowPublicTitle(e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)]"
                      />
                      <span className="text-sm text-[var(--color-fg)]">Show public title to participants</span>
                    </label>

                    {/* Challenge Page - Advanced Editor Trigger */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-fg)]">
                        Challenge Page
                      </label>
                      <EditorTrigger
                        label="page"
                        hasContent={hasDescription}
                        onClick={() => setEditorOpen(true)}
                      />
                      <p className="text-xs text-[var(--color-fg-subtle)]">
                        Welcome message and overview for participants
                      </p>
                    </div>

                    {/* Brand Color */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-fg)]">
                        Brand Color
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          {BRAND_COLOR_PRESETS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setBrandColor(color)}
                              className={cn(
                                "w-7 h-7 rounded-lg transition-all",
                                brandColor === color 
                                  ? "ring-2 ring-offset-2 ring-gray-400 scale-110" 
                                  : "hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <input
                          type="text"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          placeholder="#3b82f6"
                          className="w-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-xs font-mono text-[var(--color-fg)]"
                        />
                      </div>
                    </div>

                    {/* Folder */}
                    <Input
                      label="Folder (optional)"
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                      placeholder="e.g. 2026 Programs"
                    />
                  </>
                )}

                {activeTab === 'features' && (
                  <>
                    {/* Mode Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--color-fg)]">
                        Challenge Mode
                      </label>
                      <div className="grid gap-2">
                        {MODE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setMode(option.value)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                              mode === option.value
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                                : "border-[var(--color-border)] hover:border-[var(--color-fg-muted)]"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                              mode === option.value
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                                : "border-[var(--color-fg-muted)]"
                            )}>
                              {mode === option.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-[var(--color-fg)]">{option.label}</div>
                              <div className="text-xs text-[var(--color-fg-muted)]">{option.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feature Toggles */}
                    {FEATURE_GROUPS.map((group) => (
                      <div key={group.title} className="space-y-2">
                        <h3 className="text-sm font-medium text-[var(--color-fg)]">{group.title}</h3>
                        <div className="space-y-1 rounded-lg border border-[var(--color-border)] overflow-hidden">
                          {group.features.map((feature) => {
                            const requiresIndividual = 'requiresIndividual' in feature && feature.requiresIndividual
                            const isDisabled = requiresIndividual && !isIndividualMode
                            
                            return (
                              <label
                                key={feature.key}
                                className={cn(
                                  "flex items-center justify-between p-3 transition-colors",
                                  !isDisabled && "hover:bg-[var(--color-bg-muted)] cursor-pointer",
                                  isDisabled && "opacity-50"
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-[var(--color-fg)]">{feature.label}</div>
                                  <div className="text-xs text-[var(--color-fg-muted)]">{feature.description}</div>
                                </div>
                                <button
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => !isDisabled && handleFeatureToggle(feature.key)}
                                  className={cn(
                                    "relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-3",
                                    features[feature.key]
                                      ? "bg-[var(--color-accent)]"
                                      : "bg-[var(--color-bg-muted)]",
                                    isDisabled && "cursor-not-allowed"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                      features[feature.key] && "translate-x-5"
                                    )}
                                  />
                                </button>
                              </label>
                            )
                          })}
                        </div>
                        {group.features.some(f => 'requiresIndividual' in f && f.requiresIndividual) && !isIndividualMode && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <InfoIcon className="h-3 w-3" />
                            Some features require Individual or Hybrid mode
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] flex-shrink-0">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !internalName.trim()}>
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      {isEditing ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Save Changes' : 'Create Challenge'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Advanced Editor Modal */}
      <AdvancedEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        value={descriptionJson}
        contentType="challenge-description"
        onChange={handleDescriptionChange}
        previewUrl={isEditing && challenge ? `/c/${challenge.slug}` : undefined}
      />
    </>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  )
}
