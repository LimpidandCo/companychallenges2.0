'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Input, Spinner } from '@/components/ui'
import { InlineRichEditor } from '@/components/ui/inline-rich-editor'
import { createChallenge, updateChallenge } from '@/lib/actions/challenges'
import { uploadFile } from '@/lib/actions/upload'
import type { Challenge, Client, EditorContent, ChallengeFeatures, DEFAULT_CHALLENGE_FEATURES } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface ChallengeFormProps {
  challenge?: Challenge | null
  clientId?: string
  clients?: Client[]
  open: boolean
  onClose: () => void
  onSuccess?: (challenge: Challenge) => void
}

// Default features for new challenges
const defaultFeatures: ChallengeFeatures = {
  announcements: true,
  host_videos: true,
  sprint_structure: true,
  time_based_unlocks: true,
  milestones: false,
  reveal_moments: false,
  micro_quizzes: false,
  progress_tracking: false,
  collective_progress: false,
  session_persistence: false,
  private_views: false,
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

export function ChallengeForm({ challenge, clientId, clients, open, onClose, onSuccess }: ChallengeFormProps) {
  const isEditing = !!challenge
  const hasClientContext = !!clientId
  const resolvedClientId = clientId || challenge?.client_id || clients?.[0]?.id || ''

  const [selectedClientId, setSelectedClientId] = useState(resolvedClientId)
  const [internalName, setInternalName] = useState(challenge?.internal_name ?? '')
  const [publicTitle, setPublicTitle] = useState(challenge?.public_title ?? '')
  const [showPublicTitle, setShowPublicTitle] = useState(challenge?.show_public_title ?? true)
  const [folder, setFolder] = useState(challenge?.folder ?? '')
  const [brandColor, setBrandColor] = useState(challenge?.brand_color ?? '#ff6b4a')
  const [descriptionHtml, setDescriptionHtml] = useState(challenge?.description_html ?? '')
  const [supportInfo, setSupportInfo] = useState(challenge?.support_info ?? '')
  const [passwordInstructions, setPasswordInstructions] = useState(challenge?.password_instructions ?? '')
  const [showPasswordInstructions, setShowPasswordInstructions] = useState(!!challenge?.password_instructions)
  const [features, setFeatures] = useState<ChallengeFeatures>(challenge?.features ?? defaultFeatures)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form state when modal opens
  useEffect(() => {
    if (open) {
      if (isEditing && challenge) {
        setSelectedClientId(challenge.client_id)
        setInternalName(challenge.internal_name ?? '')
        setPublicTitle(challenge.public_title ?? '')
        setShowPublicTitle(challenge.show_public_title ?? true)
        setDescriptionHtml(challenge.description_html ?? '')
        setFolder(challenge.folder ?? '')
        setBrandColor(challenge.brand_color ?? '#ff6b4a')
        setSupportInfo(challenge.support_info ?? '')
        setPasswordInstructions(challenge.password_instructions ?? '')
        setShowPasswordInstructions(!!challenge.password_instructions)
        setFeatures(challenge.features ?? defaultFeatures)
        setError(null)
      } else {
        setSelectedClientId(resolvedClientId)
        setInternalName('')
        setPublicTitle('')
        setShowPublicTitle(true)
        setDescriptionHtml('')
        setFolder('')
        setBrandColor('#ff6b4a')
        setSupportInfo('')
        setPasswordInstructions('')
        setShowPasswordInstructions(false)
        setFeatures(defaultFeatures)
        setError(null)
      }
    }
  }, [open, isEditing, challenge, resolvedClientId])

  // Handler for image uploads from the rich text editor
  const handleEditorImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadFile(formData, 'challenges')
    if (result.success) {
      return result.url
    }
    throw new Error(result.error || 'Upload failed')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!internalName.trim()) {
      setError('Name is required')
      return
    }
    if (!publicTitle.trim()) {
      setError('Public Title is required')
      return
    }
    if (!descriptionHtml.trim()) {
      setError('Challenge Description is required')
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    const targetClientId = hasClientContext ? clientId : selectedClientId

    try {
      const result = isEditing
        ? await updateChallenge(challenge.id, {
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description_html: descriptionHtml || null,
            folder: folder || null,
            brand_color: brandColor,
            support_info: supportInfo || null,
            password_instructions: showPasswordInstructions ? passwordInstructions : null,
            features,
          })
        : await createChallenge({
            client_id: targetClientId,
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description_html: descriptionHtml || null,
            folder: folder || null,
            brand_color: brandColor,
            support_info: supportInfo || null,
            password_instructions: showPasswordInstructions ? passwordInstructions : null,
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

  const previewUrl = isEditing && challenge ? `/c/${challenge.slug}` : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl">
        <div className="rounded-xl bg-white shadow-xl border border-gray-200 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Challenge' : 'New Challenge'}
              </h2>
              {isEditing && challenge && (
                <p className="text-sm text-gray-500 mt-0.5">
                  URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/c/{challenge.slug}</code>
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
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              {/* Client Selection (only for new challenges without client context) */}
              {!hasClientContext && !isEditing && clients && clients.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Client</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Internal Name */}
              <Input
                label="Internal Name"
                value={internalName}
                onChange={(e) => setInternalName(e.target.value)}
                placeholder="e.g. Q1 2026 Leadership Challenge"
                required
                autoFocus
              />

              {/* Public Title */}
              <div className="space-y-2">
                <Input
                  label="Public Title"
                  value={publicTitle}
                  onChange={(e) => setPublicTitle(e.target.value)}
                  placeholder="e.g. Leadership Development Program"
                  required
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPublicTitle}
                    onChange={(e) => setShowPublicTitle(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-600">Show public title to participants</span>
                </label>
              </div>

              {/* Brand Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Brand Color</label>
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
                    placeholder="#ff6b4a"
                    className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-mono text-gray-900"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Challenge Description <span className="text-red-500">*</span>
                </label>
                <InlineRichEditor
                  key={`desc-${challenge?.id || 'new'}-${open}`}
                  value={descriptionHtml}
                  onChange={setDescriptionHtml}
                  placeholder="Welcome message and overview for participants..."
                  hint="This appears on the challenge landing page"
                  minHeight="150px"
                  required
                  onUploadImage={handleEditorImageUpload}
                />
              </div>

              {/* Support Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Support Info <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <InlineRichEditor
                  key={`support-${challenge?.id || 'new'}-${open}`}
                  value={supportInfo}
                  onChange={setSupportInfo}
                  placeholder="Contact info, help resources, tips..."
                  hint="Shown when participants click the info button"
                  minHeight="100px"
                  onUploadImage={handleEditorImageUpload}
                />
              </div>

              {/* Password Instructions */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordInstructions(!showPasswordInstructions)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showPasswordInstructions ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showPasswordInstructions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <label className="text-sm font-medium text-gray-900">
                    Include Password Instructions
                  </label>
                </div>
                {showPasswordInstructions && (
                  <div className="ml-14">
                    <textarea
                      value={passwordInstructions}
                      onChange={(e) => setPasswordInstructions(e.target.value)}
                      placeholder="e.g., Check your welcome email for the password, or contact support@company.com"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[80px]"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Shown on the challenge page when password-protected assignments exist
                    </p>
                  </div>
                )}
              </div>

              {/* Folder */}
              <Input
                label="Folder (optional)"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g. 2026 Programs"
              />

              {/* Features */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">
                  Challenge Features
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <FeatureToggle
                    label="Sprint Structure"
                    description="Group assignments into phases"
                    checked={features.sprint_structure}
                    onChange={(v) => setFeatures({ ...features, sprint_structure: v })}
                  />
                  <FeatureToggle
                    label="Milestones"
                    description="Celebrate progress achievements"
                    checked={features.milestones}
                    onChange={(v) => setFeatures({ ...features, milestones: v })}
                  />
                  <FeatureToggle
                    label="Time-based Unlocks"
                    description="Schedule content releases"
                    checked={features.time_based_unlocks}
                    onChange={(v) => setFeatures({ ...features, time_based_unlocks: v })}
                  />
                  <FeatureToggle
                    label="Progress Tracking"
                    description="Track individual completion"
                    checked={features.progress_tracking}
                    onChange={(v) => setFeatures({ ...features, progress_tracking: v })}
                  />
                  <FeatureToggle
                    label="Announcements"
                    description="Post updates for participants"
                    checked={features.announcements}
                    onChange={(v) => setFeatures({ ...features, announcements: v })}
                  />
                  <FeatureToggle
                    label="Micro Quizzes"
                    description="Add reflection check-ins"
                    checked={features.micro_quizzes}
                    onChange={(v) => setFeatures({ ...features, micro_quizzes: v })}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div>
                {isEditing && previewUrl && (
                  <Link
                    href={`/admin/challenges/${challenge.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Manage Assignments →
                  </Link>
                )}
              </div>
              <div className="flex gap-3">
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

function FeatureToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className={cn(
      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
      checked 
        ? "bg-blue-50 border-blue-200" 
        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
    )}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
      />
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium",
          checked ? "text-blue-900" : "text-gray-900"
        )}>
          {label}
        </div>
        <div className={cn(
          "text-xs mt-0.5",
          checked ? "text-blue-700" : "text-gray-500"
        )}>
          {description}
        </div>
      </div>
    </label>
  )
}
