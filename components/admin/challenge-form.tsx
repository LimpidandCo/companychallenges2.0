'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Spinner, RichTextEditor } from '@/components/ui'
import { createChallenge, updateChallenge } from '@/lib/actions/challenges'
import type { Challenge, Client } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface ChallengeFormProps {
  challenge?: Challenge | null
  clientId?: string
  clients?: Client[]
  open: boolean
  onClose: () => void
  onSuccess?: (challenge: Challenge) => void
}

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

export function ChallengeForm({ challenge, clientId, clients, open, onClose, onSuccess }: ChallengeFormProps) {
  const isEditing = !!challenge
  const hasClientContext = !!clientId
  const resolvedClientId = clientId || challenge?.client_id || clients?.[0]?.id || ''

  const [selectedClientId, setSelectedClientId] = useState(resolvedClientId)
  const [internalName, setInternalName] = useState(challenge?.internal_name ?? '')
  const [publicTitle, setPublicTitle] = useState(challenge?.public_title ?? '')
  const [showPublicTitle, setShowPublicTitle] = useState(challenge?.show_public_title ?? true)
  const [description, setDescription] = useState(challenge?.description ?? '')
  const [brandColor, setBrandColor] = useState(challenge?.brand_color ?? '#6366f1')
  const [folder, setFolder] = useState(challenge?.folder ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && !isEditing) {
      setSelectedClientId(resolvedClientId)
      setInternalName('')
      setPublicTitle('')
      setShowPublicTitle(true)
      setDescription('')
      setBrandColor('#6366f1')
      setFolder('')
      setError(null)
    }
  }, [open, isEditing, resolvedClientId])

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
            description: description || null,
            brand_color: brandColor || null,
            folder: folder || null,
          })
        : await createChallenge({
            client_id: targetClientId,
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description: description || null,
            brand_color: brandColor || null,
            folder: folder || null,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg">
        <div className="rounded-xl bg-[var(--color-bg-elevated)] shadow-xl border border-[var(--color-border)]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="rounded-lg bg-[var(--color-error-subtle)] px-4 py-3 text-sm text-[var(--color-error)]">
                {error}
              </div>
            )}

            {/* Client Selection - only show if no client context and we have clients to choose from */}
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

            <RichTextEditor
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Welcome message for participants..."
            />

            {/* Brand Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-fg)]">
                Brand Color
              </label>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setBrandColor(preset.value)}
                      className={cn(
                        "w-7 h-7 rounded-lg transition-all",
                        brandColor === preset.value
                          ? "ring-2 ring-offset-2 ring-[var(--color-fg)]"
                          : "hover:scale-110"
                      )}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded border border-[var(--color-border)]"
                />
              </div>
            </div>

            <Input
              label="Folder"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. 2026 Q1"
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !internalName.trim() || (!hasClientContext && !isEditing && !selectedClientId)}
              >
                {isSubmitting && <Spinner size="sm" className="mr-2" />}
                {isEditing ? 'Save' : 'Create'}
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
